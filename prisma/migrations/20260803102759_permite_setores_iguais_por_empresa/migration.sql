-- DropIndex
DROP INDEX "Setor_nome_key";

-- CreateIndex
CREATE UNIQUE INDEX "Setor_nome_empresaId_key" ON "Setor"("nome", "empresaId");
