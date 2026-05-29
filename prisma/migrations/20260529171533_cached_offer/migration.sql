-- CreateTable
CREATE TABLE "CachedOffer" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CachedOffer_createdAt_idx" ON "CachedOffer"("createdAt");
