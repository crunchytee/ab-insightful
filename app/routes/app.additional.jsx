export default function ExperimentManagement() {
  // this file represents the route for /experiments/create, as needed by ET-20. The "Create Experiment" button navigates to this route, and shows the page defined by this file.  
  return (
    <s-page heading="Experiment Management">
      <s-stack>
              <s-section heading="Experiment List">
          <s-grid justifyItems="center">
            <s-box  maxInlineSize="266px" maxBlockSize="266px">
              <s-image src="public\Group-182.svg"></s-image>
            </s-box>
          </s-grid>
          <s-stack alignItems="center">
            <s-heading>Your experiments will show here</s-heading>
            <s-paragraph> This is where you will examine and select from your list of experiments</s-paragraph>
            <s-button href="/app/experiments/new" variant="primary">Create Experiment</s-button>
          </s-stack>
        </s-section>
      </s-stack>

    </s-page>
  );
}
