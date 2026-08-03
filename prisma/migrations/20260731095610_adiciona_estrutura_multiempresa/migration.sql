-- CreateEnum
CREATE TYPE "TipoSetor" AS ENUM ('MANUTENCAO', 'OPERACIONAL', 'ADMINISTRATIVO', 'OUTRO');

-- AlterTable
ALTER TABLE "OrdemPreventiva" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Setor" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "tipo" "TipoSetor" NOT NULL DEFAULT 'OUTRO';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "empresaOrigemId" TEXT,
ADD COLUMN     "funcaoId" TEXT,
ADD COLUMN     "setorId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "cor" TEXT,
    "emailNotificacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmpresaAtendimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEmpresaAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "setorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nome_key" ON "Empresa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_sigla_key" ON "Empresa"("sigla");

-- CreateIndex
CREATE INDEX "UserEmpresaAtendimento_userId_idx" ON "UserEmpresaAtendimento"("userId");

-- CreateIndex
CREATE INDEX "UserEmpresaAtendimento_empresaId_idx" ON "UserEmpresaAtendimento"("empresaId");

-- CreateIndex
CREATE INDEX "UserEmpresaAtendimento_ativo_idx" ON "UserEmpresaAtendimento"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmpresaAtendimento_userId_empresaId_key" ON "UserEmpresaAtendimento"("userId", "empresaId");

-- CreateIndex
CREATE INDEX "Funcao_setorId_idx" ON "Funcao"("setorId");

-- CreateIndex
CREATE INDEX "Funcao_ativo_idx" ON "Funcao"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Funcao_nome_setorId_key" ON "Funcao"("nome", "setorId");

-- CreateIndex
CREATE INDEX "OrdemPreventiva_empresaId_idx" ON "OrdemPreventiva"("empresaId");

-- CreateIndex
CREATE INDEX "OrdemServico_empresaId_idx" ON "OrdemServico"("empresaId");

-- CreateIndex
CREATE INDEX "Setor_empresaId_idx" ON "Setor"("empresaId");

-- CreateIndex
CREATE INDEX "Setor_tipo_idx" ON "Setor"("tipo");

-- CreateIndex
CREATE INDEX "Setor_ativo_idx" ON "Setor"("ativo");

-- CreateIndex
CREATE INDEX "User_empresaOrigemId_idx" ON "User"("empresaOrigemId");

-- CreateIndex
CREATE INDEX "User_setorId_idx" ON "User"("setorId");

-- CreateIndex
CREATE INDEX "User_funcaoId_idx" ON "User"("funcaoId");

-- CreateIndex
CREATE INDEX "User_perfil_idx" ON "User"("perfil");

-- CreateIndex
CREATE INDEX "User_ativo_idx" ON "User"("ativo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaOrigemId_fkey" FOREIGN KEY ("empresaOrigemId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "Funcao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmpresaAtendimento" ADD CONSTRAINT "UserEmpresaAtendimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmpresaAtendimento" ADD CONSTRAINT "UserEmpresaAtendimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcao" ADD CONSTRAINT "Funcao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPreventiva" ADD CONSTRAINT "OrdemPreventiva_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
