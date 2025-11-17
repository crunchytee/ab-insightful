// The script for controlling which experiments to show will live here.
console.log("Hello from the app extension!");
const experimentsAPIURL = `https://says-terminal-themes-itunes.trycloudflare.com/api/experiments`;
// FOR TOSH: REPLACE THAT URL WITH THE URL OF THE APP. COPY IT FROM YOUR TERMINAL. I CAN'T FIGURE OUT A BETTER WAY TO GET THE BASE URL OF THE APP. 
// unsure how to test this. It always returns false because we don't have any pages with components that are part of an experiment. 

let experiment_ids = {};
fetch(experimentsAPIURL, {
    method: "GET"
}).then(res => {
    return res.json();
}).then(data => {
    console.log("[ab-insightful-embed]: list of active experiments: ", data);
    experiment_ids = data;
    for(const id in experiment_ids){
        let match = document.getElementById(id) ?? "";
        if(match != ""){
            console.log(`[ab-insightful-embed] Match! ID: ${id} Element: ${match}`);
        }
    }
}).catch(error => {
    console.log(error);
})
