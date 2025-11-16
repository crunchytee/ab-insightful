// Helper functions for experiment related operations
import db from "../db.server";

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

// Function to get experiments list. This does not return the entire experiment
// This is used for the "Experiments List" page
export async function getExperimentsList() {
  const experiments = await db.experiment.findMany({
    // Use 'include' to fetch related data (like a JOIN in SQL)
    include: {
      // For each experiment, find all its related 'analyses' records
      analyses:{
        // For each of those 'analyses', also include its related 'variant'
        include:{
          variant:true // This gets us the variant name (e.g., "Control", "Variant A")
        }
        }
      }
    });
    
    return experiments // Returns an array of experiments, each containing a list of its analyses
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