-- AlterEnum
ALTER TYPE "TipoMovimiento" ADD VALUE 'ANULACION_VENTA';

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "anuladaEn" TIMESTAMP(3),
ADD COLUMN     "anuladaPorId" TEXT,
ADD COLUMN     "motivoAnulacion" TEXT;

-- CreateIndex
CREATE INDEX "Venta_anuladaEn_idx" ON "Venta"("anuladaEn");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_anuladaPorId_fkey" FOREIGN KEY ("anuladaPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
