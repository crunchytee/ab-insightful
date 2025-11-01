import { authenticate } from "../shopify.server";
import { useFetcher, redirect } from "react-router";
import { useState } from "react";
import db from "../db.server";

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
    'viewPage':'Viewed Page',
    'startCheckout': 'Started Checkout',
    'addToCart': 'Added Product to Cart',
    'completedCheckout': 'Completed Checkout'
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

function TimeSelect({ 
  id = "selectTime", 
  label = "Select time", 
  value, 
  onChange,
  invalidMessage = 'Enter a time like "1:30 PM" or "13:30"'}) {

  //variable declaration, unique id reference setup
  const times = [];
  const popoverId =  `${id}-popover`;
  const inputId = `${id}-input`;

  //logic for making time labels for dropdown menu
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour24 = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      const value24 = `${hour24}:${minute}`;

      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = ((h + 11) % 12) + 1;
      const label12 = `${hour12}:${minute} ${suffix}`;

      times.push({ value: value24, label: label12 });
    }
  }

  //converts 24hr format into 12hr am/pm format for readability, 13:00 or 1300 becomes 1:00 PM
  const labelFor = (hhmm) => {
    if (!hhmm) return "";
    const hit = times.find(t => t.value === hhmm);
    if (hit) return hit.label;
    const [H, M] = hhmm.split(":").map(n => parseInt(n, 10));
    const am = H < 12; const h12 = ((H + 11) % 12) + 1;
    return `${h12}:${String(M).padStart(2,"0")} ${am ? "AM" : "PM"}`;
  };

  //updates display in text field
  const setFieldDisplay = (hhmm) => {
    const el = document.getElementById(inputId);
    if (el) { 
      el.value = hhmm ? labelFor(hhmm) : ""; 
      el.removeAttribute("error");
    }
  };

  //sets error, needed to handle separate error handling
  const setError = (msg) => {
    const el = document.getElementById(inputId);
    el?.setAttribute("error", msg);
  }

  //opens popover on click
  const openPopover = (el) => el?.querySelector(`#${popoverId}Trigger`)?.click();

  //saves typed field, throws error if typed input hasn't been parsed/cleaned
  const commitFromField = (raw) => {
    const el = document.getElementById(inputId);
    const parsed = parseUserTime(raw);
    if (!parsed) { 
      setError(invalidMessage);
      return; 
    }
    onChange(parsed);
    setFieldDisplay(parsed);
  }

  return (
    <div>
      {/* This section is what will visually display when the function is called */}
      <s-text-field
        label= {label}
        id={inputId}
        icon="clock"
        defaultValue={value ? labelFor(value) : ""}
        placeholder="Choose a time"
        onFocus={(e) => openPopover(e.currentTarget.parentElement)}
        onClick={(e) => openPopover(e.currentTarget.parentElement)}
        onInput={(e) => e.currentTarget.removeAttribute("error")}
        onBlur={(e) => commitFromField(e.currentTarget.value)}
        onKeyDown={(e) => {if (e.key === "Enter") {
          e.preventDefault(); 
          commitFromField(e.currentTarget.value);
        }}} >
          <s-button
            slot="accessory"
            variant="tertiary"
            disclosure="down"
            commandFor={popoverId}
            icon="chevron-down" />
      </s-text-field>

      {/* This is the popover styling and the button population */}
      <s-popover 
        id={popoverId}
        maxBlockSize="200px"
        >
          <s-stack direction="block">
            {times.map((t) => (
              <s-button
                key={t.value}
                fullWidth
                variant="tertiary"
                commandFor={popoverId}
                onClick={() => {
                  onChange(t.value); 
                  setFieldDisplay(t.value);
                }} >
                  {t.label}
              </s-button>
            ))}
          </s-stack>
      </s-popover>
    </div>  
  );
}

//This function cleans and parses the user input, we only care about numbers and :, everything else is scrubbed
function parseUserTime(input) {
  if (!input) return "";
  let s = String(input).trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  if (s === "noon") return "12:00";
  if (s === "midnight") return "00:00";
  let ampm = null;
  if (s.endsWith("am")) { 
    ampm = "am"; s = s.slice(0, -2);
  } else if (s.endsWith("pm")) {ampm = "pm"; s = s.slice(0, -2); }
  s = s.replace(/[^0-9:]/g, "");
  let hh = 0, mm = 0;
  if (s.includes(":")) {
    const [hStr, mStr = "0"] = s.split(":");
    if (!/^\d+$/.test(hStr) || !/^\d+$/.test(mStr)) return null;
    hh = parseInt(hStr, 10);
    mm = parseInt(mStr.padEnd(2, "0").slice(0, 2), 10);
  } else {
    if (!/^\d+$/.test(s)) return null;
    if (s.length <= 2) { 
      hh = parseInt(s, 10); 
      mm = 0;
    } else if (s.length === 3) { 
      hh = parseInt(s.slice(0,1),10); 
      mm = parseInt(s.slice(1),10);
    } else {
      hh = parseInt(s.slice(0, -2), 10); 
      mm = parseInt(s.slice(-2), 10); 
    }
  }

  //error handling for if minutes are out of bounds
  if (isNaN(hh) || isNaN(mm) || mm < 0 || mm > 59) return null;

  //error handling for if user types in am/pm to check that hours are within bounds
  if (ampm) {
    if (hh < 1 || hh > 12) return null;
    if (ampm === "am") {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
  } else {
      if (hh < 0 || hh > 23) return null;
  }
  //This is what we care about most, returns a string in 24hr format with hh:mm
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function CreateExperiment() {
  
  //fetcher stores the data in the fields into a form that can be retrieved
  const fetcher = useFetcher();

  //state variables (special variables that remember across re-renders (e.g. user input, counters))
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState(null)
  const [description, setDescription] = useState("");
  const [emptyDescriptionError, setDescriptionError] = useState(null);
  const [sectionId, setSectionId] = useState("");
  const [emptySectionIdError, setSectionIdError] = useState(null);
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [experimentChance, setExperimentChance] = useState(50);
  const [endSelected, setEndSelected] = useState("manual");
  const [goalSelected, setGoalSelected] = useState('completedCheckout');
  const [customerSegment, setCustomerSegment] = useState("allSegments");
  const [variant, setVariant] = useState(false);
  const [variantDisplay, setVariantDisplay] = useState("none");
  const [variantSectionId, setVariantSectionId] = useState("");
  const [variantExperimentChance, setVariantExperimentChance] = useState(50);
  const [startDate, setStartDate] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");


  const handleExperimentCreate = async () => {
    // creates data object for all current state variables   
      const experimentData = {
      name: name, 
      description: description,
      sectionId: sectionId,
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
  const handleName = (v) => {
    if (nameError && v.trim()) setNameError(null); // clear as soon as it’s valid
    setName(v);
  };

  // validating picked dates, throws error for past dates
  const handleDateChange = (field, e) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedDate = new Date(e);
      selectedDate.setHours(0,0,0,0);
      const isValid = selectedDate > today;
     
      if (field === "start") {
        setStartDateError(isValid ? "" : "Date must be in the future");
      } else if (field === "end") {
        setEndDateError(isValid ? "" : "Date must be in the future");
      };
      
      if (isValid) {
        if (field === "start") {
          setStartDate(e.target.value);
        } else if (field === "end") {
          setEndDate(e.target.value);
        }
      }
  };

  const handleVariant = () => {
    setVariant(true);
    setVariantDisplay("auto");
    setVariantExperimentChance(50);
  };

  const handleVariantUndo = () => {
    setVariant(false);
    setVariantDisplay("none");
    setVariantSectionId("");
    setVariantExperimentChance();
  }

  const error = fetcher.data?.error; // Fetches error from server side MIGHT CAUSE ERROR

  const errors = fetcher.data?.errors || {}; // looks for error data, if empty instantiate errors as empty object
 
  return (
    <s-page heading="Create Experiment" variant="headingLg">
     <s-button slot="primary-action" variant="primary" onClick={handleExperimentCreate}>Save Draft</s-button> 
     <s-button slot="secondary-actions" href="/app/experiments">Discard</s-button>
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
                  error={errors.name || nameError}
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
          <s-stack direction="block" gap="base" paddingBlock="base">
            <s-stack direction="block" gap="small">
              <s-stack display={variantDisplay}>
                <s-heading>Variant 1</s-heading>
              </s-stack>
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
              inputMode="numeric"
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, Number(e.target.value)));
                setExperimentChance(value);
              }}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />

            {/* Variant 2 fields */}
            <s-stack display={variantDisplay} paddingBlock="base">
              <s-heading>Variant 2</s-heading>

              <s-stack direction="block" gap="small" paddingBlock="base">
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
                  value={variantSectionId}
                  onChange={(e) => setVariantSectionId(e.target.value)}
                  details="The associated Shopify section ID to be tested. Must be visible on production site"
                />
              </s-stack>

              <s-number-field
                label="Chance to show experiment"
                value={variantExperimentChance}
                inputMode="numeric"
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

      <s-stack direction="inline" gap="small" justifyContent="end" paddingBlockEnd="base">
        <s-button icon="minus" disabled={!variant} onClick={handleVariantUndo}>Remove Another Variant</s-button>
        <s-button icon="plus" disabled={variant} onClick={handleVariant}>Add Another Variant</s-button>
      </s-stack>

      {/*Active dates/end conditions portion of code */}
      
      <s-section heading="Active Dates">
        <s-form>
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-box flex="1" minInlineSize="220px" inlineSize="stretch">
                <s-date-field
                  id="startDateField"
                  label="Start Date" 
                  placeholder="Select start date"
                  value={startDate}
                  error={startDateError}
                  required
                  onChange={(e) => {handleDateChange("start", e.target.value)}} />
              </s-box>

              <s-box flex="1" minInlineSize="220px">
                <TimeSelect
                  id="startTimeSelect"
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime} />
              </s-box>

            </s-stack>

            <s-choice-list
              label="End condition"
              name="endCondition"
              value={endSelected}
              onChange={(e) => setEndSelected(e.target.value)}>
                <s-choice value="manual" defaultSelected>Manual</s-choice>
                <s-choice value="endDate">End date</s-choice>
                <s-choice value="stableSuccessProbability">Stable success probability</s-choice>
            </s-choice-list>
            
            <s-stack direction="inline" gap="base">
              <s-box flex="1" minInlineSize="220px" inlineSize="stretch">
                <s-date-field
                  id="endDateField"
                  label="End Date" 
                  placeholder="Select end date"
                  value={endDate}
                  error={endDateError}
                  required
                  onChange={(e) => {handleDateChange("end", e.target.value)}} />
              </s-box>

              <s-box flex="1" minInlineSize="220px">
                <TimeSelect
                  id="endTimeSelect"
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime} />
              </s-box>
            </s-stack>
          </s-stack>
        </s-form>
      </s-section>
      <div style={{ marginBottom: '250px'}}>
      <s-stack direction="inline" gap="small" justifyContent="end">
        <s-button href="/app/experiments">Discard</s-button>
        <s-button variant="primary" onClick={handleExperimentCreate}>Save Draft</s-button>
      </s-stack>
      </div>
    </s-page>
      
    
  );
}
