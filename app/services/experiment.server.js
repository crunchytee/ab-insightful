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

// Function to check if experiment is still active
export function isExperimentActive(experiment, timeCheck = new Date()) {
  
  if (!experiment) return false;
  // make sure time passed in is valid
  let timeStamp = timeCheck;
  if (!(timeCheck instanceof Date)) timeStamp = new Date(timeCheck);
  // we only want to look at the experiments with running status
  if (experiment.status !== "running") return false;
  // also want to account for start date and end date just in case
  if (experiment.startDate && timeStamp < experiment.startDate) return false;
  if (experiment.endDate && timeStamp > experiment.endDate) return false;

  //if we don't get kicked out from the above conditions, experiment must be actively running
  return true;
}

// Handler function for incoming events
export async function handleCollectedEvent(payload) {
  // normalize time
  let timeCheck = payload.timestamp;
  if (!payload.timestamp) {
    timeCheck = new Date();
  } else if (!(payload.timestamp instanceof Date)) {
    timeCheck = new Date(payload.timestamp);
  }

  // Look up experiment (flesh this out in the future)
  let experiment = null;

  // receive pixel experimentId here
  if (payload.experimentId) {
    const id = typeof payload.experimentId === "string" ? parseInt(payload.experimentId, 10) : payload.experimentId;
    experiment = await getExperimentById(id);
  }

  // check for if the experiment is inactive, if so move on
  if (experiment && !isExperimentActive(experiment, timeCheck)) {
    console.log("handleCollectedEvent: experiment inactive, ignoring event");
    return { ignored: true};
  }

  // this is where we would put all the DB writes for the experiment
  // if I had one

  // for now, if experiment is active, log it
  console.log("handleCollectedEvent: event accepted:", payload);
  
  return { ignored: false};
}

// function to manually end an experiment
export async function manuallyEndExperiment(experimentId) {
  // Validate input into function, throws error if not valid
  if (!experimentId) throw new Error(`manuallyEndExperiment: experimentId is required`);
  // normalize id for db
  const checkId = typeof experimentId === "string" ? parseInt(experimentId, 10) : experimentId;
  // look up experiment
  const experiment = await getExperimentById(checkId);
  // throw an error if we cant find experiment
  if (!experiment) throw new Error(`manuallyEndExperiment: Experiment ${checkId} not found`);
  // check if the experiment has already ended, if it has we move on
  if (experiment.status === "ended") {
    console.log(`manuallyEndExperiment: Experiment ${checkId} already ended`);
    return experiment;
  }

  const now = new Date();
  // save the experiment's change in status, we might want to track this later on 
  const prevStatus = experiment.status;
  // update the experiment in the actual db
  // we're also creating the history record here
  const updated = await db.experiment.update({
    where: { id: checkId },
    data: {
      status: "ended",
      endDate: experiment.endDate ?? now,
      history: {
        create: {
          prevStatus,
          newStatus: "ended",
        },
      },
    },
    include: {
      history: true,
    },
  });
  // log the experiment and then return our updated experiment
  console.log(`manuallyEndExperiment: Experiment ${checkId} has now ended`);
  return updated;
}