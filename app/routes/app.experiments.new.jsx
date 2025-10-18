import { authenticate } from "../shopify.server";
import { useFetcher, redirect } from "react-router";
import { useState } from "react";

// Server side code
export const action = async ({ request }) => {
  // Authenticate request
  await authenticate.admin(request);

  // Get POST request form data & create experiment
  const formData = await request.formData(); 
  const description = formData.get("description");
  if (!description || description.trim() === "") {
    return {error: "Description is required"};
  }

  const { createExperiment } = await import("../services/experiment.server");
  // Eventually will pass all fields needed for new experiment
  const experiment = await createExperiment({description: description.trim()});
  return redirect(`/app/experiments/${experiment.id}`);
};

// Client side code
export default function CreateExperiment() {
  const fetcher = useFetcher();
  const [description, setDescription] = useState("");

  const handleExperimentCreate = async () => {
    await fetcher.submit({description}, { method: "POST" });
  };

  const error = fetcher.data?.error; // Fetches error from server side

  return (
    <s-page heading="Create Experiment">
      <s-button slot="primary-action" variant="primary">Save Draft</s-button>
      <s-section>
        <s-form>
        <s-text-area
              label="Experiment Description"
              placeholder="Add a detailed description of your experiment"
              value={description}
              // Known as a controlled component, the value is tied to {description} state
              onChange={(e) => setDescription(e.target.value)} 
            />
            {error && <s-paragraph tone="critical">{error}</s-paragraph>}
        <s-button onClick={handleExperimentCreate}>Save experiment</s-button>
        </s-form>
      </s-section>
    </s-page>
  );
}
