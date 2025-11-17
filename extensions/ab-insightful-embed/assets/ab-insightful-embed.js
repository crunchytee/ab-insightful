// The script for controlling which experiments to show will live here.

const appConfigBlock = document.getElementById("ab-insightful-config");
// if app config block not loaded - app will not run
if (appConfigBlock) {
  const config = JSON.parse(appConfigBlock.textContent);
  const appUrl = config.api_url;
  initializeApp(appUrl);
} else {
  console.warn("API Url not found - AB Testing will not run");
}

function initializeApp(appUrl) {
  const experimentsAPIURL = `${appUrl}/api/experiments`;
  let experiment_ids = {};
  fetch(experimentsAPIURL, {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log("[ab-insightful-embed]: list of active experiments: ", data);
      experiment_ids = data;
      for (const id in experiment_ids) {
        let match = document.getElementById(id) ?? "";
        if (match != "") {
          console.log(
            `[ab-insightful-embed] Match! ID: ${id} Element: ${match}`,
          );
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
