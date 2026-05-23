-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombreNegocio" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "cuit" TEXT,
    "markupDefault" DECIMAL(6,4) NOT NULL,
    "descuentoEstandar" DECIMAL(5,2) NOT NULL,
    "diasDevolucion" INTEGER NOT NULL,
    "umbralStockBajo" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);
