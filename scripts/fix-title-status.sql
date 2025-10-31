-- Script para corrigir registros antigos com status NULL
-- Execute manualmente se a migração não atualizou todos os registros

-- Garantir que campos existam (caso a migração não tenha sido aplicada)
-- SQLite permite ADD COLUMN mesmo que já exista, então é seguro executar múltiplas vezes
ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "pontosAprovados" REAL;
ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "observacao" TEXT;
ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "validadoPor" TEXT;
ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "validadoEm" DATETIME;

-- Atualizar todos os registros com status NULL para 'pending'
UPDATE "titles" SET "status" = 'pending' WHERE "status" IS NULL;

-- Criar índices se não existirem (SQLite não tem IF NOT EXISTS para índices, então pode dar erro se já existir)
-- Mas isso não é crítico
CREATE INDEX IF NOT EXISTS "titles_status_idx" ON "titles"("status");
CREATE INDEX IF NOT EXISTS "titles_candidateId_status_idx" ON "titles"("candidateId", "status");

