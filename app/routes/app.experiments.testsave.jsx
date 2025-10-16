import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType == "lookup") {
    const { getExperimentById } = await import("../services/experiment.server");
    const experimentId = parseInt(formData.get("experimentToLookup"));
    const experiment = await getExperimentById(experimentId);
    return { experiment };
  } else if (actionType == "findAll") {
    const { getExperimentsList } = await import(
      "../services/experiment.server"
    );
    const experiments = await getExperimentsList();
    return { experiments };
  } else {
    const { createExperiment } = await import("../services/experiment.server");
    const experiment = await createExperiment();
    return { experiment };
  }
};

export default function TestSave() {
  const fetcher = useFetcher();
  const [experimentToLookup, setExperimentToLookup] = useState("");

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      console.log(fetcher.data);
    }
  }, [fetcher.data, fetcher.state]);

  const handleExperimentCreate = async () => {
    await fetcher.submit({}, { method: "POST" });
  };

  const handleLookupExperiment = async (experimentToLookup) => {
    await fetcher.submit(
      { action: "lookup", experimentToLookup: experimentToLookup.toString() },
      { method: "POST" },
    );
  };

  const handleExperimentList = async () => {
    await fetcher.submit({ action: "findAll" }, { method: "POST" });
  };

  return (
    <s-page heading="Lookup Experiment">
      <s-section heading="Test create experiment">
        <s-button onClick={handleExperimentCreate}>
          Add an experiment (will show experiment in console)
        </s-button>
      </s-section>
      <s-section heading="Get experiments list">
        <s-button onClick={handleExperimentList}>
          Get experiments (will show experiments in console)
        </s-button>
      </s-section>
      <s-section heading="Test lookup experiment">
        <s-form>
          <s-number-field
            label="ID to lookup"
            details="If the ID doesn't exist, it will show null"
            defaultValue={1}
            step={1}
            min={0}
            max={100}
            value={experimentToLookup}
            onChange={(e) => setExperimentToLookup(e.target.value)}
          />
          <s-button
            onClick={() => {
              handleLookupExperiment(experimentToLookup);
            }}
          >
            Lookup experiment (will show experiment in console)
          </s-button>
        </s-form>
      </s-section>
    </s-page>
  );
}
