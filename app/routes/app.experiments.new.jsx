import { authenticate } from "../shopify.server";
import { useFetcher, redirect } from "react-router";
import { Select, Text, Page, PageActions, Card, BlockStack } from '@shopify/polaris';
import { useState, useCallback, useEffect } from "react";
import React from 'react';

// Server side code
export const action = async ({ request }) => {
  // Authenticate request
  await authenticate.admin(request);

  // Get POST request form data & create experiment
  const formData = await request.formData();
  const name = (formData.get("name") || "").trim();
  const description = (formData.get("description") || "").trim();
  const sectionId = (formData.get("sectionId") || "").trim();

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
    description: description

  });

  return redirect(`/app/experiments/${experiment.id}`);
};

//--------------------------- client side ----------------------------------------

export default function CreateExperiment() {
  
  //fetcher stores the data in the fields into a form that can be retrieved
  const fetcher = useFetcher();

  //state variables (special variables that remember across re-renders (e.g. user input, counters))
  const [name, setName] = useState(""); 
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [emptyNameError, setNameError] = useState(null)
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [experimentChance, setExperimentChance] = useState(50);
  const [endSelected, setEndSelected] = useState("Manual");
  const [selected, setSelected] = useState('view-page'); //This corresponds to the experiment goal selection


  const handleExperimentCreate = async () => {

    //asynchronous submittal of experiment info in the text fields
    await fetcher.submit({description, name, sectionId}, { method: "POST" });
  }; // end CreateExperiment()

  const handleSelectChange = useCallback(
    (value) => setSelected(value),
    [],
  );

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
  // validating picked dates, throws error for past dates
  const handleDateChange = useCallback(
    (date) => {
      //pull current date and normalize both date inputs to compare
      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0,0,0,0);
      const isValid = selectedDate > today;
      setDateError(isValid ? "" : "Date must be in the future");
    }, [setDateError]
  );

  //End condition list handler
  const handleEndCondition = useCallback(
    (value) => setEndSelected(value),
    [],
  );

  //TODO: This needs to be managed if future bottons are added
  //clear each individual field on the create experiment page when Discard button clicked
  const handleDiscard = () => {
    setName('');
    setDescription('');
    setSectionId('');
    setEndDate('');
    setExperimentChance(50);
    setEndSelected('Manual');
    setSelected('view-page');
  };

  const error = fetcher.data?.error; // Fetches error from server side MIGHT CAUSE ERROR

  const errors = fetcher.data?.errors || {}; // looks for error data, if empty instantiate errors as empty object
  const descriptionError = errors.description



const [sumName, setSumName] = useState("No experiment name set"); 
 /* const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [emptyNameError, setNameError] = useState(null)
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [experimentChance, setExperimentChance] = useState(50);*/
// state (or derive from existing selection)

// map internal values to a label + icon
const goalMap = {
  'view-page': { label: 'View Page', icon: 'view' },
  'start-checkout': { label: 'Start Checkout', icon: 'clock' },
  'add-product': { label: 'Add to Cart', icon: 'cart' },
  'complete-checkout': { label: 'Complete Purchase', icon: 'cash-dollar' },
};

// derive current badge info and icon from selected goal
const { label, icon } = goalMap[selected] ?? { label: '—', icon: 'alert' };


  return (
    <s-page heading="Create Experiment" variant="headingLg">
      <s-button slot="primary-action" variant="primary">Save Draft</s-button> 
      <s-button slot="secondary-actions" onClick={handleDiscard}>Discard</s-button>
      <s-section>
      
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
                  placeholder="Unnamed Experiment"
                  value={name}
                  //Event handler callback to set value
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    setSumName(v || "No experiment name set");
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
            <s-select 
                 label="Experiment Goal" 
                 icon={icon}
                 value={selected}
                 onChange = { (e) => {
                   const value = e.target.value;
                   setSelected(value);
              }}
            >
              <s-option value="view-page" >Viewed Page</s-option>
              <s-option value="start-checkout">Started Checkout</s-option>
              <s-option value="add-product">Added Product to Cart</s-option>
              <s-option value="complete-checkout">Completed Checkout</s-option>
            </s-select>
          </s-stack>
        </s-box>

      {/*Sidebar to display current experiment in summary panel*/}
      </s-section>
          <s-section heading={sumName} slot="aside" onChange={(e) => setSumName(e.target.value)}>
          <s-stack gap="small">
            <s-badge icon = {icon}>{label}</s-badge>
            <s-badge tone={sectionId ? "" : "warning"} icon={sectionId ? "check" : "alert-circle"}>
              {sectionId || "Section not selected"}
            </s-badge>
            <s-text font-weight="heavy">Experiment Details</s-text>

            {/* DYNAMIC BULLET LIST */}
              <s-text >• Segment</s-text>
              <s-text >• Single Variation</s-text>
              <s-text >• {experimentChance}% Chance to show</s-text>
              <s-text >• Active from Today until{" "}{endDate ? new Date(endDate).toLocaleDateString(undefined, {year: "numeric",month: "long", day: "numeric",}) : "—"}</s-text>
          </s-stack>
       
      </s-section>


      {/*Active dates/end conditions portion of code */}
      <s-section heading="Active Dates">
        <s-form>
          <s-stack direction="block" gap="base">
            <s-choice-list
              label="End condition"
              name="endCondition"
              onChange={handleEndCondition}>
                <s-choice value="Manual" defaultSelected={endSelected === "Manual"}>Manual</s-choice>
                <s-choice value="End date" defaultSelected={endSelected === "End date"}>End date</s-choice>
                <s-choice value="Stable success probability" defaultSelected={endSelected === "Stable success probability"}>Stable success probability</s-choice>
            </s-choice-list>

            <s-date-field
              //end date field options
              id="endDateField"
              label="End Date" 
              placeholder="Select end date"
              value={endDate}
              allow={"today--"}
              error={dateError}
              required //this requires end date to be filled
              onChange={(e) => { //listens and passes picked time to validate
                setEndDate(e.target.value)
                handleDateChange(e.target.value)}}
              details="Experiment ends at 11:59pm" />
            </s-stack>
        </s-form>
      </s-section>
      
      <s-section heading="Experiment Details">
        <s-form>
          <s-stack direction="block" gap="base">
            <s-stack direction="block" gap="small">
              {/*Custom Label Row (SectionID + help link)*/}
              <s-stack direction="inline" align="baseline" gap="large">
                <s-box flex-grow="1">
                  <s-text as="p" variant="bodyMd" font-weight="medium">
                    Section ID to be tested
                  </s-text>
                </s-box>
                <s-link href="#" target="_blank"> 
                  How do I find my section?
                </s-link>
              </s-stack>
          <s-text-field
            placeholder="shopify-section-sections--25210977943842__header"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            details="The associated Shopify section ID to be tested. Must be visible on production site"
          />
          </s-stack>
            <s-number-field
              label="Chance to show experiment"
              value={experimentChance}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, Number(e.target.value)));
                setExperimentChance(value);
              }}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
          </s-stack>
          </s-form>
      </s-section>
      <s-stack direction="inline" gap="base">
        <s-button onClick={handleDiscard}>Discard</s-button>
        <s-button variant="primary" onClick={handleExperimentCreate}>Save Draft</s-button>
      </s-stack>
    </s-page>
  );
}
