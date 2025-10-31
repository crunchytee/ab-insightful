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
  if(experiments != null){
    return (
      <s-page heading="Experiment Management">
        <s-section> {/*might be broken */}
          <s-heading>Experiment List</s-heading>

          {/* Table Section of experiment list page */}
          <s-box  background="base"
                  border="base"
                  borderRadius="base"
                  overflow="hidden"> {/*box used to provide a curved edge table */}
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">Name</s-table-header>
                <s-table-header listSlot="secondary">Status</s-table-header>
                <s-table-header listSlot="labeled">Runtime</s-table-header>
                <s-table-header listSlot="labeled" format="numeric">Goal Completion Rate</s-table-header>
                <s-table-header listSlot="labeled" format="numeric">Improvement</s-table-header>
                <s-table-header listSlot="labeled" format="numeric">Probability to be the best</s-table-header>
                {/*Place Quick Access Button here */}
              </s-table-header-row>
                <s-table-body>
                    <s-table-row>
                    <s-table-cell>Hero Page Variant</s-table-cell>
                    <s-table-cell>Drafting</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                  </s-table-row>
                  <s-table-row>
                    <s-table-cell>Nav Menu Variant</s-table-cell>
                    <s-table-cell>Completed</s-table-cell>
                    <s-table-cell>23h</s-table-cell>
                    <s-table-cell>35%</s-table-cell>
                    <s-table-cell>19.8%</s-table-cell>
                    <s-table-cell>Menu C (83.3%)</s-table-cell>             
                  </s-table-row>
                  <s-table-row>
                    <s-table-cell>Product Details Variant</s-table-cell>
                    <s-table-cell>Scheduled</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                    <s-table-cell>N/A</s-table-cell>
                  </s-table-row>
                </s-table-body>
              </s-table>
          </s-box> {/*end of table section*/}
        </s-section>
      </s-page>
    );

  //if there are no experiments, alternate display page
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
