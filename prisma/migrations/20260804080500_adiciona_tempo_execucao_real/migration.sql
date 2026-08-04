ALTER TABLE "OrdemServico"
ADD COLUMN "inicioExecucaoReal" TIMESTAMP(3),
ADD COLUMN "fimExecucaoReal" TIMESTAMP(3),
ADD COLUMN "duracaoExecucaoMinutos" INTEGER;