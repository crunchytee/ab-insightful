import { useState } from 'react';

export default function Reports() {

    //state variables (special variables that remember across re-renders (e.g. user input, counters))

    //if custom is selected, show date picker
    const [showCustom, setShowCustom] = useState(false);
    //store selected date range
    const [dateRange, setDateRange] = useState(null);

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

    //handle date range selection
    const handleDateRangeChange = (event) => {
        const value = event.target.value;
        const currentDay = getCurrentDate();

        //if 7, get values for 7 days ago, same for 30
        if (value === '7') {
            const startDate = getDateDaysAgo(7);
            setDateRange({ start: startDate, end: currentDay });
            setShowCustom(false);
        } else if (value === '30') {
            const startDate = getDateDaysAgo(30);
            setDateRange({ start: startDate, end: currentDay });
            setShowCustom(false);

        //custom date selection handler
        } else if (value === 'custom') {
            setShowCustom(true);
        }
    };

    const handleDatePickerChange = (event) => {
        const value = event.target.value;
        //value is in format "YYYY-MM-DD--YYYY-MM-DD"
        if (value && value.includes('--')) {
            const [start, end] = value.split('--');
            setDateRange({ start, end });
        }
    };
    //get default view for date picker (current month)
    const getDefaultView = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

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

            {/* TODO: this is a demonstration element.  Remove when output of date range is being utilized */}
            {dateRange && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>Selected Range:</strong> {dateRange.start} to {dateRange.end}
                </div>
            )}
            <s-page heading="Reports">
                {/* Page components go here */}
            </s-page>
        </>
    );
}
