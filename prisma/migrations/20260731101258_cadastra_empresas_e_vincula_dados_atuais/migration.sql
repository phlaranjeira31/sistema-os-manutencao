BEGIN;

-- Empresas iniciais do grupo
INSERT INTO "Empresa" (
    "id",
    "nome",
    "sigla",
    "ativo",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        'empresa_sequoia',
        'Sequoia',
        'SEQ',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'empresa_shasta',
        'Shasta',
        'SHA',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'empresa_ocotillo',
        'Ocotillo',
        'OCO',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

-- Todos os setores existentes pertencem atualmente à Sequoia
UPDATE "Setor"
SET "empresaId" = 'empresa_sequoia'
WHERE "empresaId" IS NULL;

-- Todas as OS existentes pertencem atualmente à Sequoia
UPDATE "OrdemServico"
SET "empresaId" = 'empresa_sequoia'
WHERE "empresaId" IS NULL;

-- Todas as preventivas existentes pertencem atualmente à Sequoia
UPDATE "OrdemPreventiva"
SET "empresaId" = 'empresa_sequoia'
WHERE "empresaId" IS NULL;

-- Todos os usuários atuais possuem origem na Sequoia
UPDATE "User"
SET "empresaOrigemId" = 'empresa_sequoia'
WHERE "empresaOrigemId" IS NULL;

COMMIT;
