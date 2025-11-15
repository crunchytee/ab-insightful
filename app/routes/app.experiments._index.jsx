import { useLoaderData } from "react-router";
import { formatRuntime } from "../utils/formatRuntime.js";


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

  //function responsible for render of table rows based off db
  function renderTableData(experiments)
  {
    const rows = [];

    for(let i = 0; i < experiments.length; i++)
    {
      //single tuple of the experiment data
      const curExp = experiments[i];

      // call formatRuntime utility
      const runtime = formatRuntime(
        curExp.startDate,
        curExp.endDate,
        curExp.status
      );
      
      //pushes javascripts elements into the array
      rows.push(
        <s-table-row>
          <s-table-cell>
            <s-link href={("./app/routes/reports/" + curExp.id)}>{curExp.name ?? "empty-name"}</s-link>
          </s-table-cell> {/* displays N/A when data is null */}
          <s-table-cell> {curExp.status ?? "N/A"} </s-table-cell>
          <s-table-cell> {runtime} </s-table-cell> 
          <s-table-cell>N/A</s-table-cell>
          <s-table-cell>N/A</s-table-cell>
          <s-table-cell>N/A</s-table-cell>
        </s-table-row>
      )
    }
    return rows
  } // end renderTableData function

  if(experiments.length > 0){
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
                    {renderTableData(experiments)} {/* function call that returns the jsx data for table rows */}
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
