import { authenticate } from "../shopify.server";
import { useFetcher, redirect } from "react-router";
import { useState } from "react";
import { Text } from '@shopify/polaris';

// Server side code
export const action = async ({ request }) => {
  // Authenticate request
  await authenticate.admin(request);

  // Get POST request form data & create experiment
  const formData = await request.formData();
  const name = (formData.get("name") || "").trim() || "Unnamed experiment";
  const description = (formData.get("description") || "").trim();

  //storage for future errors that may be configured for the fields
  const errors = {}; // will be length 0 when there are no errors
  if (!name) errors.name = "Name is required";
  if (!description) errors.description = "Description is required";

  if (Object.keys(errors).length) {

    return { errors };
  }

  const { createExperiment } = await import("../services/experiment.server");

  // will pass the data used for the new experiment (currently a single variable)
  const experiment = await createExperiment({
    description: description.trim()

  });

  return redirect(`/app/experiments/${experiment.id}`);
};

//--------------------------- client side ----------------------------------------

export default function CreateExperiment() {
  
  //fetcher stores the data in the fields into a form that can be retrieved
  const fetcher = useFetcher();

  //state variables (special variables that remember across re-renders (e.g. user input, counters))
  const [name, setName] = useState("") 
  const [description, setDescription] = useState("");
  const [emptyNameError, setNameError] = useState(null)

  const handleExperimentCreate = async () => {

    //asynchronous submittal of experiment info in the text fields
    await fetcher.submit({description, name}, { method: "POST" });
  }; // end CreateExperiment()

  

  //arrow function expression that is used to set the error message when there is no name
  const handleNameBlur = () => {
    if (!name.trim()) {
      setNameError("Name is a required field")
    } 
    else {
      setNameError(null); //clears error once user fixes
    }
  };

  
  //if fetcher data exists, add this otherwise undefined.

  const errors = fetcher.data?.errors || {}; // looks for error data, if empty instantiate errors as empty object
  const descriptionError = errors.description
  
  return (
    <s-page heading="Create Experiment" variant="headingLg">
      <s-section >

        {/*Name Portion of code */}
        <s-box padding="base">
          <s-stack gap="large-200" direction="block">
            <s-heading>
              <Text as="h1" variant="headingLg">
                Basic Settings
              </Text>
            </s-heading>
            <s-form>
              <s-text-field
                  label="Experiment Name"
                  placeholder="Add experiment name here"
                  value={name}
                  //Event handler callback to set value
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    if (emptyNameError && v.trim()) setNameError(null); // clear as soon as it’s valid
                  }} /*Updating the name that will be sent to server on experiment creation for each change */
                  onBlur={handleNameBlur}
                  error={emptyNameError}
              />    
            </s-form>

            {/*Description portion of code*/}
            <s-form>
            <s-text-area
                  label="Experiment Description"
                  placeholder="Add a detailed description of your experiment"
                  value={description}
                  // Known as a controlled component, the value is tied to {description} state
                  onChange={(e) => setDescription(e.target.value)} 
                />
                {descriptionError && <s-paragraph tone="critical">{descriptionError}</s-paragraph>}
            </s-form>
            <s-button onClick={handleExperimentCreate}>Save experiment</s-button>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}
