-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "turnoId" TEXT;

-- CreateTable
CREATE TABLE "turno" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aperturaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierreEn" TIMESTAMP(3),
    "efectivoInicialDeclarado" DECIMAL(12,2) NOT NULL,
    "efectivoContadoCierre" DECIMAL(12,2),
    "efectivoEsperadoCierre" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "observacionesCierre" TEXT,

    CONSTRAINT "turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turno_userId_cierreEn_idx" ON "turno"("userId", "cierreEn");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Garantiza un solo turno abierto por usuario a nivel DB (evita race conditions)
CREATE UNIQUE INDEX "turno_user_abierto_unique"
  ON "turno"("userId")
  WHERE "cierreEn" IS NULL;
