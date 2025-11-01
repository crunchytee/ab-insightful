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
    include: {
      analyses: true
    }
  });
  
  if (experiments) {
    return experiments;
  }
  
  return null;
}