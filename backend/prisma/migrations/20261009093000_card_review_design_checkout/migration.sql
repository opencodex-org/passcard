-- Reconcile Card fields with the Prisma schema and persist card review decisions.
ALTER TABLE "Card" ALTER COLUMN "cardNumber" DROP NOT NULL;
ALTER TABLE "Card" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Card" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'SA';
ALTER TABLE "Card" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR';
ALTER TABLE "Card" ADD COLUMN "cardType" TEXT NOT NULL DEFAULT 'VIRTUAL';
ALTER TABLE "Card" ADD COLUMN "cardName" TEXT;
ALTER TABLE "Card" ADD COLUMN "description" TEXT;
ALTER TABLE "Card" ADD COLUMN "designColor" TEXT;
ALTER TABLE "Card" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Card" ADD COLUMN "reviewReason" TEXT;
ALTER TABLE "Card" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Card" ADD COLUMN "reviewedById" TEXT;
CREATE INDEX "Card_countryCode_idx" ON "Card"("countryCode");
CREATE INDEX "Card_reviewedById_idx" ON "Card"("reviewedById");
ALTER TABLE "Card" ADD CONSTRAINT "Card_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A checkout token keeps each merchant payment intent private to its intended checkout.
ALTER TABLE "Payment" ADD COLUMN "checkoutToken" TEXT;
CREATE UNIQUE INDEX "Payment_checkoutToken_key" ON "Payment"("checkoutToken");
