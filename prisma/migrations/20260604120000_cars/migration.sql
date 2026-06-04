-- CreateTable
CREATE TABLE "CarBooking" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" INTEGER NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "pickupTime" TEXT,
    "dropoffTime" TEXT,
    "rentalDays" INTEGER NOT NULL,
    "carClass" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactCountry" TEXT,
    "billingName" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZip" TEXT,
    "billingCountry" TEXT,
    "protectionPlan" TEXT,
    "protectionAmount" INTEGER NOT NULL DEFAULT 0,
    "cancellationTier" TEXT,
    "carSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarRenter" (
    "id" TEXT NOT NULL,
    "carBookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "flightNo" TEXT,
    "licenseNo" TEXT,

    CONSTRAINT "CarRenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarPayment" (
    "id" TEXT NOT NULL,
    "carBookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL DEFAULT 'CARD_SIM',
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "last4" TEXT NOT NULL,
    "cardBrand" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarBooking_bookingRef_key" ON "CarBooking"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "CarRenter_carBookingId_key" ON "CarRenter"("carBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CarPayment_carBookingId_key" ON "CarPayment"("carBookingId");

-- AddForeignKey
ALTER TABLE "CarBooking" ADD CONSTRAINT "CarBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarRenter" ADD CONSTRAINT "CarRenter_carBookingId_fkey" FOREIGN KEY ("carBookingId") REFERENCES "CarBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarPayment" ADD CONSTRAINT "CarPayment_carBookingId_fkey" FOREIGN KEY ("carBookingId") REFERENCES "CarBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
