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

// Function to get experiments list. This does not return the entire experiment, just the parts that are needed on the experiment list page.
// Returns null if empty
export async function getExperimentsList() {
  const experiments = await db.experiment.findMany();
  if (experiments) {
    return experiments;
  }
  return null;
}
