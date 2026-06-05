-- Add an admin role to User (default USER, backfills existing rows safely).
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- Indexes supporting the admin backend's list/search/sort queries.
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Membership_tier_idx" ON "Membership"("tier");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX "StayBooking_createdAt_idx" ON "StayBooking"("createdAt");
CREATE INDEX "CarBooking_createdAt_idx" ON "CarBooking"("createdAt");
