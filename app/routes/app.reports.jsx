import { useState, useEffect } from 'react';
import { useLoaderData } from "react-router";

//server side code
export async function loader() {
  //get the list of experiments & return them if there are any
  const { getExperimentsList1 } = await import("../services/experiment.server");
  const experiments = await getExperimentsList1();
  if (experiments) {
    return experiments;
  }
  return null;
}

export default function Reports() {
    //get list of experiments
    const experiments = useLoaderData();

    //state variables
    const [showCustom, setShowCustom] = useState(false);
    const [dateRange, setDateRange] = useState(null);
    const [filteredExperiments, setFilteredExperiments] = useState(experiments);

    //calculate the days since start date
    const getDaysSince = (startDate) => {
        if (!startDate) return "Not started";
        
        const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
        
        if (days === 0) return "Less than a day";
        if (days === 1) return "1 day";
        if (days < 0) return "Not started";
        return `${days} days`;
    };

    //generate a badge for status if applicable
    const renderStatus = (status) => {
        if (!status) return "N/A";
    
        if (status.toLowerCase() === "active") {
            return <s-badge tone="info" icon="gauge">Active</s-badge>;
        } else if (status.toLowerCase() === "completed") {
            return <s-badge tone="success" icon="check">Completed</s-badge>;
        } else if (status.toLowerCase() === "archived") {
            return <s-badge tone="warning" icon="order">Archived</s-badge>;
        } else if (status.toLowerCase() === "paused") {
            return <s-badge tone="caution" icon="pause-circle">Paused</s-badge>;
        }
        return status;
    };  

    //render experiment name with link if not active
    const renderExperimentName = (experiment) => {
        const name = experiment.name ?? "N/A";
        
        if (!experiment.status || experiment.status.toLowerCase() === "active") {
            return name;
        }
        return <a href="/404">{name}</a>;
    };

    //get conversions for experiment
    const getConversionRate = (experiment) => {
    //check for analysis data
    if (experiment.analyses && experiment.analyses.length > 0) {
        //get the most recent analysis
        const latestAnalysis = experiment.analyses[experiment.analyses.length - 1];
        //get the conversions and users from analysis
        const { totalConversions, totalUsers } = latestAnalysis;
        
        //check for valid data
        if (totalConversions !== null && totalConversions !== undefined && totalUsers !== null && totalUsers !== undefined) {
            return `${totalConversions}/${totalUsers}`;
        }
    }
    return "N/A";
};
    
    //function responsible for render of table rows based off db
    function renderTableData(experiments) {
        const rows = [];

        for(let i = 0; i < experiments.length; i++) {
            const curExp = experiments[i];
      
            rows.push(
                <s-table-row key={i}>
                    <s-table-cell>{renderExperimentName(curExp)}</s-table-cell>
                    <s-table-cell>{renderStatus(curExp.status)}</s-table-cell>
                    <s-table-cell>{getDaysSince(curExp.startDate)}</s-table-cell>
                    <s-table-cell>{curExp.endCondition ?? "N/A"}</s-table-cell>
                    <s-table-cell>{getConversionRate(curExp)}</s-table-cell>
                </s-table-row>
            )
        }
        return rows;
    }

    //function to retrieve the current date
    const getCurrentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    //input a number of days, retrieve days ago based on current day
    const getDateDaysAgo = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };

    //filter experiments based on date range
    const filterByDateRange = (start, end) => {
        if (!experiments) return [];
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        return experiments.filter(exp => {
            if (!exp.startDate) return false;
            const expStartDate = new Date(exp.startDate);
            return expStartDate >= startDate && expStartDate <= endDate;
        });
    };

    //handle date range selection
    const handleDateRangeChange = (event) => {
        const value = event.target.value;
        const currentDay = getCurrentDate();

        if (value === '7') {
            const startDate = getDateDaysAgo(7);
            const newDateRange = { start: startDate, end: currentDay };
            setDateRange(newDateRange);
            setFilteredExperiments(filterByDateRange(startDate, currentDay));
            setShowCustom(false);
        } else if (value === '30') {
            const startDate = getDateDaysAgo(30);
            const newDateRange = { start: startDate, end: currentDay };
            setDateRange(newDateRange);
            setFilteredExperiments(filterByDateRange(startDate, currentDay));
            setShowCustom(false);
        } else if (value === 'custom') {
            setShowCustom(true);
        }
    };

    //handle custom date picker change
    const handleDatePickerChange = (event) => {
        const value = event.target.value;
        if (value && value.includes('--')) {
            const [start, end] = value.split('--');
            setDateRange({ start, end });
            setFilteredExperiments(filterByDateRange(start, end));
        }
    };

    //get default view for date picker (current month)
    const getDefaultView = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    //initialize with last 30 days 
    useEffect(() => {
        const currentDay = getCurrentDate();
        const startDate = getDateDaysAgo(30);
        setDateRange({ start: startDate, end: currentDay });
        setFilteredExperiments(filterByDateRange(startDate, currentDay));
    }, [experiments]);

    return (
        <>
            <s-stack direction="inline" align="start">
                <div style={{ width: '120px' , marginRight: '16px'}}>
                    <s-select label="Date range" onChange={handleDateRangeChange}>
                        <s-option value="7">Last 7 days</s-option>
                        <s-option value="30" defaultSelected>Last 30 days</s-option>
                        <s-option value="custom">Custom</s-option>
                    </s-select>
                </div>
                
                {showCustom && (
                     <div style={{ height: '15px', marginTop: '21px'}}>
                        <s-button commandFor="custom-date-popover" icon="calendar">
                            Select date range
                        </s-button>
                        <s-popover id="custom-date-popover">
                            <s-date-picker
                                view={getDefaultView()}
                                type="range"
                                onChange={handleDatePickerChange}
                            />
                        </s-popover>
                    </div>
                )}
            </s-stack>
            
                <div style={{ marginBottom: '16px', marginTop: '16px'}}>
                    <s-heading>Experiment Reports</s-heading>
                </div>
                <s-section>
                    <s-box  background="base"
                            border="base"
                            borderRadius="base"
                            overflow="hidden">
                        <s-table>
                            <s-table-header-row>
                                <s-table-header listSlot="primary">Experiment Name (Click To View Report)</s-table-header>
                                <s-table-header listSlot="secondary">Status</s-table-header>
                                <s-table-header listSlot="labeled">Run Length</s-table-header>
                                <s-table-header listSlot="labeled" format="numeric">End Condition</s-table-header>
                                <s-table-header listSlot="labeled" format="numeric">Conversions</s-table-header>
                            </s-table-header-row>
                            <s-table-body>
                                {renderTableData(filteredExperiments)}
                            </s-table-body>
                        </s-table>
                    </s-box>
                </s-section>
            <s-page heading="Reports" variant="headingLg"></s-page>
        </>
    );
}