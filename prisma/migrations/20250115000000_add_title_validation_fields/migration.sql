-- AlterTable
-- Adicionar campos de validação à tabela titles
-- SQLite não suporta ALTER TABLE ADD COLUMN com DEFAULT diretamente, então usamos uma abordagem alternativa
ALTER TABLE "titles" ADD COLUMN "status" TEXT;
ALTER TABLE "titles" ADD COLUMN "pontosAprovados" REAL;
ALTER TABLE "titles" ADD COLUMN "observacao" TEXT;
ALTER TABLE "titles" ADD COLUMN "validadoPor" TEXT;
ALTER TABLE "titles" ADD COLUMN "validadoEm" DATETIME;

-- Atualizar valores existentes para 'pending' no campo status
UPDATE "titles" SET "status" = 'pending' WHERE "status" IS NULL;

-- CreateIndex
CREATE INDEX "titles_status_idx" ON "titles"("status");

-- CreateIndex
CREATE INDEX "titles_candidateId_status_idx" ON "titles"("candidateId", "status");

