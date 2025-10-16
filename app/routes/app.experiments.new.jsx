import { authenticate } from "../shopify.server";
import { useFetcher } from "react-router";

// Server side code
export const action = async ({ request }) => {
  // Authenticate request
  await authenticate.admin(request);

  // Get POST request form data & create experiment
  const formData = await request.formData();
  const { createExperiment } = await import("../services/experiment.server");
  const experiment = await createExperiment();
  return { experiment };
};

// Client side code
export default function CreateExperiment() {
  const fetcher = useFetcher();

  const handleExperimentCreate = async () => {
    await fetcher.submit({}, { method: "POST" });
  };

  return (
    <s-page heading="Create Experiment">
      <s-section>
        <s-paragraph>A filler card</s-paragraph>
        <s-button onClick={handleExperimentCreate}>Save experiment</s-button>
      </s-section>
    </s-page>
  );
}
