-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "creadoPorId" TEXT,
ADD COLUMN     "incompleto" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Producto_incompleto_idx" ON "Producto"("incompleto");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
