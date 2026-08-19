-- AlterTable
ALTER TABLE "ExecucaoPreventiva" ADD COLUMN     "checkFerramentasRecolhidas" TEXT,
ADD COLUMN     "checkLimpezaEfetiva" TEXT,
ADD COLUMN     "checkLimpezaRealizada" TEXT,
ADD COLUMN     "checkMaterialRepostoRecolhido" TEXT,
ADD COLUMN     "checkQuantidadePecas" TEXT,
ADD COLUMN     "duracaoRealMinutos" INTEGER;
