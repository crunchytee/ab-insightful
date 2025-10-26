-- CreateTable
CREATE TABLE "Project" (
    "project_id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Goal" (
    "goal_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "metric_type" TEXT,
    "icon" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExperimentGoal" (
    "experiment_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "goalRole" TEXT NOT NULL,

    PRIMARY KEY ("experiment_id", "goal_id"),
    CONSTRAINT "ExperimentGoal_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperimentGoal_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audience" (
    "audience_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rules_json" JSONB NOT NULL,
    "project_id" TEXT NOT NULL,
    CONSTRAINT "Audience_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("project_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperimentAudience" (
    "requirement_type" TEXT NOT NULL,
    "audience_id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,

    PRIMARY KEY ("audience_id", "experiment_id"),
    CONSTRAINT "ExperimentAudience_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "Audience" ("audience_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperimentAudience_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperimentHistory" (
    "histroy_id" TEXT NOT NULL PRIMARY KEY,
    "prev_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experiment_id" TEXT NOT NULL,
    CONSTRAINT "ExperimentHistory_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Variant" (
    "variant_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config_data" JSONB,
    "experiment_id" TEXT NOT NULL,
    CONSTRAINT "Variant_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "first_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest_session" DATETIME NOT NULL,
    "device_type" TEXT
);

-- CreateTable
CREATE TABLE "Allocation" (
    "assignment_id" TEXT NOT NULL PRIMARY KEY,
    "assigned_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_type" TEXT,
    "user_id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    CONSTRAINT "Allocation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversion" (
    "conversion_id" TEXT NOT NULL PRIMARY KEY,
    "converted_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_type" TEXT,
    "money_value" DECIMAL,
    "user_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    CONSTRAINT "Conversion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversion_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analysis" (
    "result_id" TEXT NOT NULL PRIMARY KEY,
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
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    CONSTRAINT "Analysis_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Analysis_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant" ("variant_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Analysis_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal" ("goal_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Experiment" (
    "experiment_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "traffic_split" DECIMAL NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME NOT NULL,
    "endCondition" TEXT,
    "sectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" TEXT NOT NULL,
    CONSTRAINT "Experiment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("project_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("description") SELECT "description" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Project_shop_key" ON "Project"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_name_key" ON "Goal"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_user_id_experiment_id_key" ON "Allocation"("user_id", "experiment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversion_experiment_id_goal_id_user_id_key" ON "Conversion"("experiment_id", "goal_id", "user_id");
