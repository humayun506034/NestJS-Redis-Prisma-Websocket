/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdminGeneralSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Blog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduleSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_slotId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_blogId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_adminId_fkey";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "AdminGeneralSetting";

-- DropTable
DROP TABLE "Appointment";

-- DropTable
DROP TABLE "Blog";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "ScheduleSlot";

-- DropTable
DROP TABLE "Service";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "BlogCategory";

-- DropEnum
DROP TYPE "BlogStatus";

-- DropEnum
DROP TYPE "BlogTags";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "InvoicePaymentType";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "MeetingType";

-- DropEnum
DROP TYPE "NotificationEvent";

-- DropEnum
DROP TYPE "ServiceCategory";

-- DropEnum
DROP TYPE "ServiceStatus";

-- DropEnum
DROP TYPE "SlotStatus";
