-- CreateTable
CREATE TABLE "Devolucion" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDevolucion" (
    "id" TEXT NOT NULL,
    "devolucionId" TEXT NOT NULL,
    "itemVentaId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ItemDevolucion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Devolucion_ventaId_creadaEn_idx" ON "Devolucion"("ventaId", "creadaEn");

-- CreateIndex
CREATE INDEX "Devolucion_usuarioId_idx" ON "Devolucion"("usuarioId");

-- CreateIndex
CREATE INDEX "ItemDevolucion_devolucionId_idx" ON "ItemDevolucion"("devolucionId");

-- CreateIndex
CREATE INDEX "ItemDevolucion_itemVentaId_idx" ON "ItemDevolucion"("itemVentaId");

-- CreateIndex
CREATE INDEX "ItemDevolucion_varianteId_idx" ON "ItemDevolucion"("varianteId");

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDevolucion" ADD CONSTRAINT "ItemDevolucion_devolucionId_fkey" FOREIGN KEY ("devolucionId") REFERENCES "Devolucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDevolucion" ADD CONSTRAINT "ItemDevolucion_itemVentaId_fkey" FOREIGN KEY ("itemVentaId") REFERENCES "ItemVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDevolucion" ADD CONSTRAINT "ItemDevolucion_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
