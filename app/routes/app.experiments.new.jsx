import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useFetcher, redirect } from "react-router";
import { useState } from "react";

// Server side code
export const action = async ({ request }) => {
  // Authenticate request
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();  
  
  // Get POST request form data & create experiment
  const name = (formData.get("name") || "").trim();
  const description = (formData.get("description") || "").trim();
  const sectionId = (formData.get("sectionId") || "").trim();
  const goalValue = (formData.get("goal") || "").trim();
  const endCondition = (formData.get("endCondition") || "").trim();
  const endDateStr = (formData.get("endDate") || "").trim();
  const trafficSplitStr = (formData.get("trafficSplit") || "50").trim(); // Default to "0"

  // Storage Validation Errors
  const errors = {};                                                // will be length 0 when there are no errors
  if (!name) errors.name = "Name is required";
  if (!description) errors.description = "Description is required";
  if (!sectionId) errors.sectionId = "Section Id is required";      //Todo: Is sectionId still required?

  // Only validates endDate if endCondition is 'End date'
  if (endCondition == "End date" && !endDateStr){
    errors.endDate = "End Date is required when 'End date' is selected"
  }

  if (Object.keys(errors).length) return {errors};

  // Find or create a parent Project for this shop
  const shop = session.shop;
  const project = await db.project.upsert({
    where: {shop:shop},
    update: {},
    create: {shop:shop, name: `${shop} Project`},
  });
  const projectId = project.id;
  
  // Map client-side goal value ('view-page') to DB goal name
  const goalNameMap = {
  };
  const goalName = goalNameMap[goalValue];
  
  // Find the corresponding Goal record ID
  const goalRecord = await db.goal.findUnique({
    where: {name: goalName}
  });

  if (!goalRecord){
    return {errors: {goal: "Could not find matching goal in the database"}};
  }

  // Convert form data strings to schema-ready types
  const goalId = goalRecord.id;
  const trafficSplit = parseFloat(trafficSplitStr) / 100.0;
  // Converts the date string to a Date object for Prisma
  // If no date was provided, set to null
  const endDate = endDateStr ? new Date(endDateStr) : null;

  // Assembles the final data object for Prisma
  const experimentData = {
    name: name,
    description: description,
    status: "draft", 
    trafficSplit: trafficSplit,
    endCondition: endCondition,
    endDate: endDate, 
    sectionId: sectionId,
    project:{ // Connect to the parent project
      connect: {
        id: projectId
      }
    }, 
    experimentGoals: { // Create the related goal
      create: [
        {
          goalId: goalId,   
          goalRole: "primary" 
        }
      ]
    }
  };

  const { createExperiment } = await import("../services/experiment.server");
  const experiment = await createExperiment(experimentData);
  
  return redirect(`/app/experiments/${experiment.id}`);
};

//--------------------------- client side ----------------------------------------

export default function CreateExperiment() {
  
  //fetcher stores the data in the fields into a form that can be retrieved
  const fetcher = useFetcher();

  //state variables (special variables that remember across re-renders (e.g. user input, counters))
  const [name, setName] = useState("")
  const [emptyNameError, setNameError] = useState(null)
  const [description, setDescription] = useState("");
  const [emptyDescriptionError, setDescriptionError] = useState(null);
  const [sectionId, setSectionId] = useState("");
  const [emptySectionIdError, setSectionIdError] = useState(null);
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [experimentChance, setExperimentChance] = useState(50);
  const [endSelected, setEndSelected] = useState("manual");
  const [goalSelected, setGoalSelected] = useState('completedCheckout');
  const [customerSegment, setCustomerSegment] = useState("allSegments");


  const handleExperimentCreate = async () => {
    // creates data object for all current state variables   
      const experimentData = {
      name: name, 
      description: description,
      sectionId: sectionId,
      goal: selected,                 // holds the "view-page" value
      goal: goalSelected,                 // holds the "view-page" value
      endCondition: endSelected,      // holds "Manual", "End Data"
      endDate:endDate,                // The date string from s-date-field
      trafficSplit:experimentChance   // 0-100 value
    };

    try{
      await fetcher.submit(experimentData, { method: "POST" });
    }catch(error) {
      console.error("Error during fetcher.submit",error);
    };
  }; // end HandleCreateExperiment()
  
  const handleSelectChange = useCallback(
    (value) => setSelected(value),
    [],
  );

  const [icon, setIcon] = useState("")
  
  //arrow function expression that is used to set the error message when there is no name
  const handleNameBlur = () => {
    if (!name.trim()) {
      setNameError("Name is a required field")
    } 
    else {
      setNameError(null); //clears error once user fixes
    }
  };

  const handleDescriptionBlur = () => {
    if (!description.trim()) {
      setDescriptionError("Description is a required field");
    } else {
      setDescriptionError(null); //clears error once user fixes
    }
  };

  const handleSectionIdBlur = () => {
    if (!sectionId.trim()) {
      setSectionIdError("Section ID is a required field");
    } else {
      setSectionIdError(null); //clears error once user fixes
    }
  };

  
  //if fetcher data exists, add this otherwise undefined.
  // validating picked dates, throws error for past dates
  const handleDateChange = (date) => {
      //pull current date and normalize both date inputs to compare
      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0,0,0,0);
      const isValid = selectedDate > today;
      setDateError(isValid ? "" : "Date must be in the future");
      if (!dateError) { 
        setEndDate(e.target.value);
      }
  };

  const handleName = (v) => {
    if (nameError && v.trim()) setNameError(null); // clear as soon as it’s valid
    setName(v);
  };
  
  const errors = fetcher.data?.errors || {}; // looks for error data, if empty instantiate errors as empty object
 
  return (
    <s-page heading="Create Experiment" variant="headingLg">
     <s-button slot="primary-action" variant="primary" onClick={handleExperimentCreate}>Save Draft</s-button> 
      {(errors.form || errors.goal) && (
        <s-box padding="base">
          <s-banner title="There was an error" tone="critical">
            <p>{errors.form || errors.goal}</p>
          </s-banner>
        </s-box>
      )}
      <s-section>
        {/*Name Portion of code */}
        <s-box padding="base">
          <s-stack gap="large-200" direction="block">
            <s-form>
              <s-text-field
                  label="Experiment Name"
                  placeholder="Unnamed Experiment"
                  value={name}
                  //Event handler callback to set value
                  onChange={(e) => {handleName(e.target.value)}} /*Updating the name that will be sent to server on experiment creation for each change */
                  onBlur={handleNameBlur}
                  error={errors.name || emptyNameError}
              />    
            </s-form>

            {/*Description portion of code*/}
            <s-form>
            <s-text-area
                  label="Experiment Description"
                  placeholder="Add a detailed description of your experiment"
                  value={description}
                  // Known as a controlled component, the value is tied to {description} state
                  onChange={(e) => {
                    const v = e.target.value;
                    setDescription(v);
                    if (emptyDescriptionError && v.trim()) setDescriptionError(null);
                  }}
                  onBlur={handleDescriptionBlur}
                  error={errors.description || emptyDescriptionError} 
                />
            </s-form>
            <s-select 
                 label="Experiment Goal" 
                 icon="sort" 
                 value={goalSelected}
                 onChange = { (e) => {
                   const value = e.target.value;
                   setGoalSelected(value);
              }}
            >
              <s-option value="viewPage" >Viewed Page</s-option>
              <s-option value="startCheckout">Started Checkout</s-option>
              <s-option value="addToCart">Added Product to Cart</s-option>
              <s-option value="completedCheckout">Completed Checkout</s-option>
            </s-select>
          </s-stack>
        </s-box>
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
            <s-select label="Customer segment to test"
              value={customerSegment} 
              onChange={(e) => setCustomerSegment(e.target.value)}
              details="The customer segment that the experiment can be shown to.">
              <s-option value="allSegments" defaultSelected>All Segments</s-option>
              <s-option value="desktopVisitors">Desktop Visitors</s-option>
              <s-option value="mobileVisitors">Mobile Visitors</s-option>
            </s-select>
          </s-stack>
        </s-form>
      </s-section>

      {/*Active dates/end conditions portion of code */}
      <s-section heading="Active Dates">
        <s-form>
          <s-stack direction="block" gap="base">
            <s-choice-list
              label="End condition"
              name="endCondition"
              value={endSelected}
              onChange={(e) => setEndSelected(e.target.value)}>
                <s-choice value="manual" defaultSelected>Manual</s-choice>
                <s-choice value="endDate">End date</s-choice>
                <s-choice value="stableSuccessProbability">Stable success probability</s-choice>
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
              onChange={(e) => {handleDateChange(e.target.value)}} />
            </s-stack>
        </s-form>
      </s-section>
      
      <s-section heading="Experiment Details">
        <s-form>
          <s-stack direction="block" gap="base">
            <s-stack direction="block" gap="small">
              {/*Custom Label Row (SectionID + help link)*/}
              <s-text-field
                label="Section ID to be tested"
                placeholder="shopify-section-sections--25210977943842__header"
                value={sectionId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSectionId(v);
                  if (emptySectionIdError && v.trim()) setSectionIdError(null);
                }}
                onBlur={handleSectionIdBlur}
                details="The associated Shopify section ID to be tested. Must be visible on production site"
                error={errors.sectionId || emptySectionIdError}
              >
                <s-link
                  slot="help-text"
                  href="#"
                  target="_blank"
                >
                  How do I find my section?
                </s-link>
              </s-text-field>
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
        <s-button href="/app/experiments">Discard</s-button>
        <s-button variant="primary" onClick={handleExperimentCreate}>Save Draft</s-button>
      </s-stack>
    </s-page>
  );
}
