warning: in the working copy of 'prisma/schema.prisma', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/app/routes/app.experiments._index.jsx b/app/routes/app.experiments._index.jsx[m
[1mindex 138dec3..97126c6 100644[m
[1m--- a/app/routes/app.experiments._index.jsx[m
[1m+++ b/app/routes/app.experiments._index.jsx[m
[36m@@ -15,7 +15,7 @@[m [mexport async function loader() {[m
 export default function Experimentsindex() {[m
   // Get list of experiments[m
   const experiments = useLoaderData();[m
[31m-  if(experiments!= {}){[m
[32m+[m[32m  if(experiments == {}){[m
     return ([m
       <s-section heading="Experiments">[m
         <s-paragraph>Placeholder UI elements to denote when there are experiments</s-paragraph>[m
[1mdiff --git a/app/routes/app.experiments.new.jsx b/app/routes/app.experiments.new.jsx[m
[1mindex af5a7b2..9b6b314 100644[m
[1m--- a/app/routes/app.experiments.new.jsx[m
[1m+++ b/app/routes/app.experiments.new.jsx[m
[36m@@ -1,5 +1,6 @@[m
 import { authenticate } from "../shopify.server";[m
 import { useFetcher } from "react-router";[m
[32m+[m[32mimport { useState } from "react";[m
 [m
 // Server side code[m
 export const action = async ({ request }) => {[m
[36m@@ -8,24 +9,33 @@[m [mexport const action = async ({ request }) => {[m
 [m
   // Get POST request form data & create experiment[m
   const formData = await request.formData();[m
[32m+[m[32m  const description = formData.get("description");[m
   const { createExperiment } = await import("../services/experiment.server");[m
[31m-  const experiment = await createExperiment();[m
[32m+[m[32m  const experiment = await createExperiment({description});[m
   return { experiment };[m
 };[m
 [m
 // Client side code[m
 export default function CreateExperiment() {[m
   const fetcher = useFetcher();[m
[32m+[m[32m  const [description, setDescription] = useState("");[m
 [m
   const handleExperimentCreate = async () => {[m
[31m-    await fetcher.submit({}, { method: "POST" });[m
[32m+[m[32m    await fetcher.submit({description}, { method: "POST" });[m
   };[m
 [m
   return ([m
     <s-page heading="Create Experiment">[m
       <s-section>[m
[31m-        <s-paragraph>A filler card</s-paragraph>[m
[32m+[m[32m        <s-form>[m
[32m+[m[32m        <s-text-area[m
[32m+[m[32m              label="Experiment Description"[m
[32m+[m[32m              placeholder="Add a detailed description of your experiment"[m
[32m+[m[32m              value={description}[m
[32m+[m[32m              onChange={(e) => setDescription(e.target.value)}[m
[32m+[m[32m            />[m
         <s-button onClick={handleExperimentCreate}>Save experiment</s-button>[m
[32m+[m[32m        </s-form>[m
       </s-section>[m
     </s-page>[m
   );[m
[1mdiff --git a/app/services/experiment.server.js b/app/services/experiment.server.js[m
[1mindex 950908c..f6f7ef2 100644[m
[1m--- a/app/services/experiment.server.js[m
[1m+++ b/app/services/experiment.server.js[m
[36m@@ -3,11 +3,14 @@[m [mimport db from "../db.server";[m
 [m
 // Function to create an experiment. Returns the created experiment object.[m
 export async function createExperiment(experiment) {[m
[31m-  return await db.experiment.create({[m
[32m+[m[32m  console.log('Creating experiment with data:', experiment);[m
[32m+[m[32m  const result = await db.experiment.create({[m
     data: {[m
       ...experiment,[m
     },[m
   });[m
[32m+[m[32m  console.log('Created experiment:', result);[m
[32m+[m[32m  return result;[m
 }[m
 [m
 // Function to get an experiment by id. Returns the experiment object if found, otherwise returns null.[m
[1mdiff --git a/prisma/schema.prisma b/prisma/schema.prisma[m
[1mindex 2c1c46f..af539ab 100644[m
[1m--- a/prisma/schema.prisma[m
[1m+++ b/prisma/schema.prisma[m
[36m@@ -34,4 +34,4 @@[m [mmodel Session {[m
 // Experiment Model[m
 model Experiment {[m
   id Int @id @default(autoincrement())[m
[31m-}[m
\ No newline at end of file[m
[32m+[m[32m}[m
