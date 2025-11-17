/*
  Warnings:

  - A unique constraint covering the columns `[shopify_customer_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "shopify_customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_shopify_customer_id_key" ON "User"("shopify_customer_id");
