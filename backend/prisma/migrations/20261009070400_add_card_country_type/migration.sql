-- Add country profile and card type metadata to PassCard cards.
-- Existing cards default to Saudi Arabia / SAR / virtual.
ALTER TABLE "Card"
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'SA',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR',
  ADD COLUMN "cardType" TEXT NOT NULL DEFAULT 'VIRTUAL';

CREATE INDEX "Card_countryCode_idx" ON "Card"("countryCode");
