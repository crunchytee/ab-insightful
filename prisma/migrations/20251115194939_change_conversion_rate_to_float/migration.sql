/*
  Warnings:

  - You are about to alter the column `conversion_rate` on the `Analysis` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analysis" (
    "result_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "calculated_when" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "days_analyzed" INTEGER NOT NULL,
    "total_users" INTEGER NOT NULL,
    "total_conversions" INTEGER NOT NULL,
    "conversion_rate" REAL NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
