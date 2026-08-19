-- CreateEnum
CREATE TYPE "FrequenciaPreventiva" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PERSONALIZADA');

-- CreateEnum
CREATE TYPE "StatusExecucaoPreventiva" AS ENUM ('PROGRAMADA', 'PENDENTE', 'EM_EXECUCAO', 'CONCLUIDA', 'NAO_REALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "PlanoPreventivo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadeOS" NOT NULL DEFAULT 'MEDIA',
    "empresaId" TEXT,
    "setorId" TEXT NOT NULL,
    "maquinaId" TEXT,
    "frequencia" "FrequenciaPreventiva" NOT NULL DEFAULT 'MENSAL',
    "intervaloPersonalizadoDias" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "proximaExecucao" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "diasAntesAviso" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "gerarAutomaticamente" BOOLEAN NOT NULL DEFAULT true,
    "ultimaGeracaoEm" TIMESTAMP(3),
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoPreventivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsavelPlanoPreventivo" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsavelPlanoPreventivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecucaoPreventiva" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "dataProgramada" TIMESTAMP(3) NOT NULL,
    "status" "StatusExecucaoPreventiva" NOT NULL DEFAULT 'PROGRAMADA',
    "dataInicio" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "descricaoExecucao" TEXT,
    "pecasUtilizadas" TEXT,
    "observacoes" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "avisoEnviadoEm" TIMESTAMP(3),
    "concluidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecucaoPreventiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsavelExecucaoPreventiva" (
    "id" TEXT NOT NULL,
    "execucaoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsavelExecucaoPreventiva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanoPreventivo_empresaId_idx" ON "PlanoPreventivo"("empresaId");

-- CreateIndex
CREATE INDEX "PlanoPreventivo_setorId_idx" ON "PlanoPreventivo"("setorId");

-- CreateIndex
CREATE INDEX "PlanoPreventivo_maquinaId_idx" ON "PlanoPreventivo"("maquinaId");

-- CreateIndex
CREATE INDEX "PlanoPreventivo_frequencia_idx" ON "PlanoPreventivo"("frequencia");

-- CreateIndex
CREATE INDEX "PlanoPreventivo_proximaExecucao_idx" ON "PlanoPreventivo"("proximaExecucao");

-- CreateIndex
CREATE INDEX "PlanoPreventivo_ativo_idx" ON "PlanoPreventivo"("ativo");

-- CreateIndex
CREATE INDEX "ResponsavelPlanoPreventivo_planoId_idx" ON "ResponsavelPlanoPreventivo"("planoId");

-- CreateIndex
CREATE INDEX "ResponsavelPlanoPreventivo_userId_idx" ON "ResponsavelPlanoPreventivo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsavelPlanoPreventivo_planoId_userId_key" ON "ResponsavelPlanoPreventivo"("planoId", "userId");

-- CreateIndex
CREATE INDEX "ExecucaoPreventiva_planoId_idx" ON "ExecucaoPreventiva"("planoId");

-- CreateIndex
CREATE INDEX "ExecucaoPreventiva_dataProgramada_idx" ON "ExecucaoPreventiva"("dataProgramada");

-- CreateIndex
CREATE INDEX "ExecucaoPreventiva_status_idx" ON "ExecucaoPreventiva"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExecucaoPreventiva_planoId_dataProgramada_key" ON "ExecucaoPreventiva"("planoId", "dataProgramada");

-- CreateIndex
CREATE INDEX "ResponsavelExecucaoPreventiva_execucaoId_idx" ON "ResponsavelExecucaoPreventiva"("execucaoId");

-- CreateIndex
CREATE INDEX "ResponsavelExecucaoPreventiva_userId_idx" ON "ResponsavelExecucaoPreventiva"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsavelExecucaoPreventiva_execucaoId_userId_key" ON "ResponsavelExecucaoPreventiva"("execucaoId", "userId");

-- AddForeignKey
ALTER TABLE "PlanoPreventivo" ADD CONSTRAINT "PlanoPreventivo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoPreventivo" ADD CONSTRAINT "PlanoPreventivo_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoPreventivo" ADD CONSTRAINT "PlanoPreventivo_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoPreventivo" ADD CONSTRAINT "PlanoPreventivo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelPlanoPreventivo" ADD CONSTRAINT "ResponsavelPlanoPreventivo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoPreventivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelPlanoPreventivo" ADD CONSTRAINT "ResponsavelPlanoPreventivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoPreventiva" ADD CONSTRAINT "ExecucaoPreventiva_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoPreventivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoPreventiva" ADD CONSTRAINT "ExecucaoPreventiva_concluidoPorId_fkey" FOREIGN KEY ("concluidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelExecucaoPreventiva" ADD CONSTRAINT "ResponsavelExecucaoPreventiva_execucaoId_fkey" FOREIGN KEY ("execucaoId") REFERENCES "ExecucaoPreventiva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelExecucaoPreventiva" ADD CONSTRAINT "ResponsavelExecucaoPreventiva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
