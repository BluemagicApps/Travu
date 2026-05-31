-- CreateTable
CREATE TABLE "StayBooking" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "staySnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StayBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StayGuest" (
    "id" TEXT NOT NULL,
    "stayBookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ADULT',

    CONSTRAINT "StayGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StayPayment" (
    "id" TEXT NOT NULL,
    "stayBookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL DEFAULT 'CARD_SIM',
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "last4" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StayPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StayBooking_bookingRef_key" ON "StayBooking"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "StayPayment_stayBookingId_key" ON "StayPayment"("stayBookingId");

-- AddForeignKey
ALTER TABLE "StayBooking" ADD CONSTRAINT "StayBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayGuest" ADD CONSTRAINT "StayGuest_stayBookingId_fkey" FOREIGN KEY ("stayBookingId") REFERENCES "StayBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayPayment" ADD CONSTRAINT "StayPayment_stayBookingId_fkey" FOREIGN KEY ("stayBookingId") REFERENCES "StayBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
