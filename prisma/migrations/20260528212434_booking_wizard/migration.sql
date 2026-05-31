-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "fareName" TEXT,
ADD COLUMN     "multiCityFlightSnapshots" JSONB,
ADD COLUMN     "returnFlightSnapshot" JSONB,
ADD COLUMN     "tripType" TEXT NOT NULL DEFAULT 'one-way';

-- AlterTable
ALTER TABLE "Passenger" ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "passportCountry" TEXT,
ADD COLUMN     "passportNumber" TEXT;
