// Helper functions for experiment related operations
import db from "../db.server";
import betaFactory from "@stdlib/random-base-beta";

// Function to create an experiment. Returns the created experiment object.
export async function createExperiment(experimentData) {
  console.log('Creating experiment with data:', experimentData);
  // Update Prisma database using npx prisma 
  const result = await db.experiment.create({
    data: {
      ...experimentData, // Will include all DB fields of a new experiment
    },
  });
  console.log('Created experiment:', result);
  return result;
}

// Function to get an experiment by id. Returns the experiment object if found, otherwise returns null.
export async function getExperimentById(id) {
  if (id) {
    const experiment = await db.experiment.findUnique({
      where: {
        id: id,
      },
    });
    return experiment;
  }
  return null;
}


//finds all the experiments that can be analyzed
export async function getExperimentsWithAnalyses() {
  return db.experiment.findMany({
    where: {
      analyses: { some: {} }, //only experiments that have at least one Analysis
    },
    include: {
      project: true, 
      analyses: {
        include: {
          variant: true,
          goal: true,
        },
        orderBy: { calculatedWhen: "desc" }, //newest analyses first
      },
    },
    orderBy: { createdAt: "desc" },
  });
}


//takes a list of experiment objects and updates their analyses
//Needs to change function parameter to take PK and FK to iterate through multiple setProbabilityOfBest
export async function updateProbabilityOfBest(experiment) {
  //DRAW_CONSTANT functions as a limit on the amount of computations this does. The more computations the more accurate but also the more heavy load
  const DRAW_CONSTANT = 20000
  for(let i = 0; i < experiment.length; i++)
  {
    const curExp = experiment[i];
    await setProbabilityOfBest({experimentId: curExp.id, goalId: curExp.goalId, draws:DRAW_CONSTANT, controlVariantId: null }); 
  }

  //maybe if we wanted this calculated all at once. 
  /**  await Promise.all(
    experiments.map((exp) => setProbabilityOfBest(exp.id))
  );  */
  return experiment;
}


//takes a singular experiment and adds an entry with all relevant statistics update (probabilityOfBeingBest, alpha, beta, )
//uses random-base-beta from the stdlib to perform statistical simulation.
//intended to be used in conjunction with other helper functions (e.g. getExperimentsWithAnalyses() and updateProbabilityOfBest) to perform batch calculation on multiple experiments
export async function setProbabilityOfBest({
  experimentId, goalId,
  draws = 1000,
  controlVariantId = null
}) 
{
  const experiment = await db.experiment.findUnique({
  where: { id: experimentId },
  include: { analyses: true },
  });

  if (!experiment) {
    throw new Error(`Experiment with ID ${experimentId} not found`);
  }

  //loads all analysis rows
  const allAnalysisRows = await db.analysis.findMany({
    where: { experimentId, goalId },
    orderBy: { calculatedWhen: "desc" },
  });
  if (!allAnalysisRows.length) return { updated: 0, reason: "No Analysis rows found" };


  //reduces variant entries down to ones that have not been calculated yet. 
  const uncalculatedRows = await db.analysis.findMany({
    where: {
      experimentId,
      goalId,
      probabilityOfBeingBest: null,
      expectedLoss: null,
    },
  });

  if (uncalculatedRows.length < 2) {
    return;
  }

  //filters out unacceptable postBetas and postAlphas (ones that are 0) and then maps it into a new object called posteriors
  //keep in mind during DB testing this mean if postBeta and postAlpha are left blank, 
  const posteriors = uncalculatedRows
  .filter((r) => r.postAlpha > 0 && r.postBeta > 0) // filters entries with less than and greater than 0 
  .map((r) => ({
    variantId: r.variantId,
    analysisId: r.id, // to update same row
    totalConversions: r.totalConversions,
    totalUsers: r.totalUsers,
    alpha: Number(r.postAlpha),
    beta: Number(r.postBeta),
  })); //this list of for postBeta calculations

  //safety check for when there are somehow less than 2 pages to compare
  if (posteriors.length < 2) {
    return { updated: null, reason: "Need at least two variants with posteriors" }; //check later
  }

  //Monte Carlo Calculation
  const betaSamplers = []; //will be array of functions
  for (const posterior of posteriors)
  {
    const sampler = betaFactory.factory(posterior.alpha, posterior.beta) //calculates random values based on beta
    betaSamplers.push(sampler);
  }

  const totalVariants = betaSamplers.length;

  const betaSamples = Array.from({ length: totalVariants }, () => new Array(draws).fill(null)); //check if fill is doing as expected

  //performs the randomized simulation number of "draw" times then moves on to the next variant
  for (let variantIndex = 0; variantIndex < totalVariants; variantIndex++)
  {
    const sampleBeta = betaSamplers[variantIndex];
    for (let drawIndex = 0; drawIndex < draws; drawIndex++)
    {
      betaSamples[variantIndex][drawIndex] = sampleBeta();
    }
  }

  //Calculate probability of best
  const bestVariantCounts = new Array(totalVariants).fill(0);
  const cumulativeExpectedLoss = new Array(totalVariants).fill(0);

  //iterates through the results of the simulation and finds highest value
  for (let drawIndex = 0; drawIndex < draws; drawIndex++)
  {
    let highestValue = -Infinity;
    let indexOfBestVariant = -1;

    // Find the highest sampled value of the variant
    for (let variantIndex = 0; variantIndex < totalVariants; variantIndex++) {
      const sampledValue = betaSamples[variantIndex][drawIndex];
      if (sampledValue > highestValue) {
        highestValue = sampledValue;
        indexOfBestVariant = variantIndex;
      }
    }

    // Increment best count for the variant (accumulating total wins for each variant)
    bestVariantCounts[indexOfBestVariant] += 1;

    // Compute expected loss for all variants (because they are so inter-related) 
    //expected loss represents how much conversion rate you would lose out on if you were to choose the corresponding variant (will be close to 0 for winning variant). 
    for (let variantIndex = 0; variantIndex < totalVariants; variantIndex++) {
      const sampledValue = betaSamples[variantIndex][drawIndex];
      const loss = highestValue - sampledValue;
      cumulativeExpectedLoss[variantIndex] += loss;
    }

  }// forloop

  const probabilityOfBeingBest = [];
  const expectedLoss = [];


  //divides number of times a variant page was won by number of times it was drawn
  for (let variantIndex = 0; variantIndex < totalVariants; variantIndex++) {
    const probability =
      bestVariantCounts[variantIndex] / parseFloat(draws);
    const loss =
      cumulativeExpectedLoss[variantIndex] / parseFloat(draws);

    probabilityOfBeingBest.push(probability);
    expectedLoss.push(loss);
  }

  //update analyses table with new values
  const currentTime = new Date();
  for (let variantIndex = 0; variantIndex < totalVariants; variantIndex++) {
    const posterior = posteriors[variantIndex];
    const variantProbability = probabilityOfBeingBest[variantIndex];
    const variantExpectedLoss = expectedLoss[variantIndex];

    await db.analysis.update({
      where: { id: posterior.analysisId },
      data: {
        calculatedWhen: currentTime,
        probabilityOfBeingBest: variantProbability,
        expectedLoss: variantExpectedLoss,
      },
    });

  }
} //end of setProbabilityOfBest

// Function to get experiments list. 
// This is used for the "Experiments List" page
export async function getExperimentsList() {
  const experiments = await db.experiment.findMany({
    //using include as a join 
    include: {
      //for each experiment, find all its related analyses records
      analyses:{
        // For each of those analyses include their variant
        include:{
          variant:true //this gets us the variant name (e.g., "Control", "Variant A")
        }
        }
      }
    });
    
    return experiments // Returns an array of experiments, 
}

//get the experiment list, additionally analyses for conversion rate
export async function getExperimentsList1() {
  const experiments = await db.experiment.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    }, orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (experiments) return experiments;
  else return null;
}

// get a variant (by name or id) Example: "Control" or "Variant A"
export async function getVariant(experimentId, name) {
  return db.variant.findFirst({
    where: { experimentId, name },
    select: { id: true, name: true },
  });
}

//get the latest analysis row for that variant (conversionRate lives here)
export async function getAnalysis(experimentId, variantId) {
  return db.analysis.findFirst({
    where: { experimentId, variantId },
    orderBy: { calculatedWhen: "desc" },
    select: { id: true, conversionRate: true, calculatedWhen: true },
  });
}

//convenience: return conversionRate as a float (or null)
export async function getVariantConversionRate(experimentId, variantId) {
  const row = await getAnalysis(experimentId, variantId);
  if (!row) return null;
  const num = row.conversionRate;
  return num;
}

// Improvement calculation for an experiment
export async function getImprovement(experimentId) {
  // get control
  const control = await getVariant(experimentId, "Control");
  if (!control) return null;

  // get all other variants
  const variants = await db.variant.findMany({
    where: { experimentId, NOT: { id: control.id } },
    select: { id: true, name: true },
  });
  if (!variants.length) return null;

  // get control conversion rate
  const controlAnalysis = await getAnalysis(experimentId, control.id);
  const controlRate = controlAnalysis ? controlAnalysis.conversionRate : null;
  if (!(typeof controlRate === "number") || controlRate <= 0) return null;

  // find best treatment rate
  let best = null;
  for (const v of variants) {
    const a = await getAnalysis(experimentId, v.id);
    const rate = a ? a.conversionRate : null;
    if (typeof rate === "number" && (best === null || rate > best)) best = rate;
  }

  if (best === null || best >= 1 || best <= 0) return null;
  if (controlRate === null || controlRate >= 1 || controlRate <= 0) return null;

  // improvement formula
  const improvement = ((best - controlRate) / controlRate) * 100;
  return improvement;
}