import { useLoaderData } from "react-router";


// Server side code
export async function loader() {
  // Get the list of experiments & return them if there are any
  const { getExperimentsList } = await import("../services/experiment.server");
  const experiments = await getExperimentsList();
  if (experiments) {
    return experiments;
  }
  return null;
}

// Client side code
export default function Experimentsindex() {
  // Get list of experiments
  const experiments = useLoaderData();
  console.log("Experiments data:", experiments);
  if(experiments.length == 0){
    return (
      <s-section heading="Experiments">
        <s-paragraph>Placeholder UI elements to denote when there are experiments</s-paragraph>
      </s-section>
    );
  }else{
      return (
    <s-section heading="Experiments">
      <s-grid gap="base" justifyItems="center" paddingBlock="large-500">
        <s-box maxInlineSize="400px" maxBlockSize="400px">
          <s-image
            aspectRatio="1/1.5"
            src="/Group-182.svg"
            alt="Empty state image"
          />
        </s-box>
        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
          <s-stack alignItems="center">
            <s-heading>Your experiments will show here</s-heading>
            <s-paragraph>
              This is where you will examine and select from your list of
              experiments.
            </s-paragraph>
            <s-button variant="primary" href="/app/experiments/new">
              Create Experiment
            </s-button>
          </s-stack>
        </s-grid>
      </s-grid>
    </s-section>
      );
}

}
