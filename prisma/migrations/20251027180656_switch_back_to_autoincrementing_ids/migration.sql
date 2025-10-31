-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Allocation" (
    "assignment_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assigned_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_type" TEXT,
    "user_id" INTEGER NOT NULL,
    "experiment_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    CONSTRAINT "Allocation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Allocation" ("assigned_when", "assignment_id", "device_type", "experiment_id", "user_id", "variant_id") SELECT "assigned_when", "assignment_id", "device_type", "experiment_id", "user_id", "variant_id" FROM "Allocation";
DROP TABLE "Allocation";
ALTER TABLE "new_Allocation" RENAME TO "Allocation";
CREATE UNIQUE INDEX "Allocation_user_id_experiment_id_key" ON "Allocation"("user_id", "experiment_id");
CREATE TABLE "new_Analysis" (
    "result_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "calculated_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "days_analyzed" INTEGER NOT NULL,
    "total_users" INTEGER NOT NULL,
    "total_conversions" INTEGER NOT NULL,
    "conversion_rate" DECIMAL NOT NULL,
    "probability_of_being_best" DECIMAL NOT NULL,
    "expected_loss" DECIMAL NOT NULL,
    "cred_interval_lift" JSONB NOT NULL,
    "post_alpha" INTEGER NOT NULL,
    "post_beta" INTEGER NOT NULL,
    "experiment_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "goal_id" INTEGER NOT NULL,
    CONSTRAINT "Analysis_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Analysis_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Analysis_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Analysis" ("calculated_when", "conversion_rate", "cred_interval_lift", "days_analyzed", "expected_loss", "experiment_id", "goal_id", "post_alpha", "post_beta", "probability_of_being_best", "result_id", "total_conversions", "total_users", "variant_id") SELECT "calculated_when", "conversion_rate", "cred_interval_lift", "days_analyzed", "expected_loss", "experiment_id", "goal_id", "post_alpha", "post_beta", "probability_of_being_best", "result_id", "total_conversions", "total_users", "variant_id" FROM "Analysis";
DROP TABLE "Analysis";
ALTER TABLE "new_Analysis" RENAME TO "Analysis";
CREATE TABLE "new_Audience" (
    "audience_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rules_json" JSONB NOT NULL,
    "project_id" INTEGER NOT NULL,
    CONSTRAINT "Audience_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("project_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Audience" ("audience_id", "name", "project_id", "rules_json") SELECT "audience_id", "name", "project_id", "rules_json" FROM "Audience";
DROP TABLE "Audience";
ALTER TABLE "new_Audience" RENAME TO "Audience";
CREATE TABLE "new_Conversion" (
    "conversion_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "converted_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_type" TEXT,
    "money_value" DECIMAL,
    "user_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "experiment_id" INTEGER NOT NULL,
    CONSTRAINT "Conversion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Conversion" ("conversion_id", "converted_when", "device_type", "experiment_id", "goal_id", "money_value", "user_id", "variant_id") SELECT "conversion_id", "converted_when", "device_type", "experiment_id", "goal_id", "money_value", "user_id", "variant_id" FROM "Conversion";
DROP TABLE "Conversion";
ALTER TABLE "new_Conversion" RENAME TO "Conversion";
CREATE UNIQUE INDEX "Conversion_experiment_id_goal_id_user_id_key" ON "Conversion"("experiment_id", "goal_id", "user_id");
CREATE TABLE "new_Experiment" (
    "experiment_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "traffic_split" DECIMAL NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "endCondition" TEXT,
    "sectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" INTEGER NOT NULL,
    CONSTRAINT "Experiment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("project_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("createdAt", "description", "endCondition", "end_date", "experiment_id", "name", "project_id", "sectionId", "start_date", "status", "traffic_split") SELECT "createdAt", "description", "endCondition", "end_date", "experiment_id", "name", "project_id", "sectionId", "start_date", "status", "traffic_split" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
CREATE TABLE "new_ExperimentAudience" (
    "requirement_type" TEXT NOT NULL,
    "audience_id" INTEGER NOT NULL,
    "experiment_id" INTEGER NOT NULL,

    PRIMARY KEY ("audience_id", "experiment_id"),
    CONSTRAINT "ExperimentAudience_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "Audience" ("audience_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperimentAudience_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExperimentAudience" ("audience_id", "experiment_id", "requirement_type") SELECT "audience_id", "experiment_id", "requirement_type" FROM "ExperimentAudience";
DROP TABLE "ExperimentAudience";
ALTER TABLE "new_ExperimentAudience" RENAME TO "ExperimentAudience";
CREATE TABLE "new_ExperimentGoal" (
    "experiment_id" INTEGER NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "goalRole" TEXT NOT NULL,

    PRIMARY KEY ("experiment_id", "goal_id"),
    CONSTRAINT "ExperimentGoal_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperimentGoal_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExperimentGoal" ("experiment_id", "goalRole", "goal_id") SELECT "experiment_id", "goalRole", "goal_id" FROM "ExperimentGoal";
DROP TABLE "ExperimentGoal";
ALTER TABLE "new_ExperimentGoal" RENAME TO "ExperimentGoal";
CREATE TABLE "new_ExperimentHistory" (
    "histroy_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prev_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experiment_id" INTEGER NOT NULL,
    CONSTRAINT "ExperimentHistory_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExperimentHistory" ("changed_at", "experiment_id", "histroy_id", "new_status", "prev_status") SELECT "changed_at", "experiment_id", "histroy_id", "new_status", "prev_status" FROM "ExperimentHistory";
DROP TABLE "ExperimentHistory";
ALTER TABLE "new_ExperimentHistory" RENAME TO "ExperimentHistory";
CREATE TABLE "new_Goal" (
    "goal_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "metric_type" TEXT,
    "icon" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Goal" ("created_at", "goal_id", "icon", "metric_type", "name") SELECT "created_at", "goal_id", "icon", "metric_type", "name" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE UNIQUE INDEX "Goal_name_key" ON "Goal"("name");
CREATE TABLE "new_Project" (
    "project_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Project" ("created_at", "name", "project_id", "shop") SELECT "created_at", "name", "project_id", "shop" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_shop_key" ON "Project"("shop");
CREATE TABLE "new_User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "first_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest_session" DATETIME NOT NULL,
    "device_type" TEXT
);
INSERT INTO "new_User" ("device_type", "first_seen", "latest_session", "user_id") SELECT "device_type", "first_seen", "latest_session", "user_id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_Variant" (
    "variant_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config_data" JSONB,
    "experiment_id" INTEGER NOT NULL,
    CONSTRAINT "Variant_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("config_data", "description", "experiment_id", "name", "variant_id") SELECT "config_data", "description", "experiment_id", "name", "variant_id" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
