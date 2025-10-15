// Helper functions for experiment related operations
import db from "../db.server";

// Function to create an experiment. Returns the created experiment object.
export async function createExperiment(experiment) {
  return await db.experiment.create({
    data: {
      ...experiment,
    },
  });
}

// Function to get an experiment by id. Returns the experiment object if found, otherwise returns null.
export async function getExperimentById(id) {
  const experiment = await db.experiment.findUnique({
    where: {
      id: id,
    },
  });
  return experiment;
}
