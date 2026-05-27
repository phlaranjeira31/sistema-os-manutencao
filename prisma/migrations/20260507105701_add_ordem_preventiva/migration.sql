-- CreateTable
CREATE TABLE "OrdemPreventiva" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadeOS" NOT NULL DEFAULT 'MEDIA',
    "setorId" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "diasAntesAviso" INTEGER NOT NULL DEFAULT 1,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemPreventiva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrdemPreventiva" ADD CONSTRAINT "OrdemPreventiva_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
