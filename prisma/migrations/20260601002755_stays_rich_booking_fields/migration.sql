-- AlterTable
ALTER TABLE "StayBooking" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingZip" TEXT,
ADD COLUMN     "cancellationTier" TEXT,
ADD COLUMN     "contactCountry" TEXT,
ADD COLUMN     "protectionAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "protectionPlan" TEXT;

-- AlterTable
ALTER TABLE "StayGuest" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "StayPayment" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "expMonth" INTEGER,
ADD COLUMN     "expYear" INTEGER;
