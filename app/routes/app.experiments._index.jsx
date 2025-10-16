export default function Experimentsindex (){
    return (
        <s-section accessibilityLabel="Empty state section">
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
                This is where you will examine and select from your list of experiments. 
              </s-paragraph>
                            <s-button variant="primary" href="/app/experiments/new">Create Experiment</s-button>
            </s-stack>
              
          </s-grid>
        </s-grid>
      </s-section>
    );
}