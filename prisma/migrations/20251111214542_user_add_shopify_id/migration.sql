/*
  Warnings:

  - Added the required column `shopifyCustomerID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopifyCustomerID" TEXT NOT NULL,
    "first_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest_session" DATETIME NOT NULL,
    "device_type" TEXT
);
INSERT INTO "new_User" ("device_type", "first_seen", "latest_session", "user_id") SELECT "device_type", "first_seen", "latest_session", "user_id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_shopifyCustomerID_key" ON "User"("shopifyCustomerID");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
