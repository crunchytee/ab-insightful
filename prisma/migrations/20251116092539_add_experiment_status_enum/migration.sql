/*
  Warnings:

  - You are about to drop the column `shopifyCustomerID` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "first_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest_session" DATETIME NOT NULL,
    "device_type" TEXT
);
INSERT INTO "new_User" ("device_type", "first_seen", "latest_session", "user_id") SELECT "device_type", "first_seen", "latest_session", "user_id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
