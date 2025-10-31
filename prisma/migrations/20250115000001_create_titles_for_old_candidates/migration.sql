-- Migração para criar registros de titles para inscrições antigas
-- Esta migração cria registros de título baseados nos campos diretos do candidato
-- para inscrições que foram criadas antes do sistema de validação de títulos

-- Criar títulos de formação acadêmica baseados no campo formacaoAcademica
-- SQLite: usar hex(randomblob()) para gerar IDs únicos no formato cuid simples

-- Doutorado
INSERT INTO "titles" ("id", "type", "candidateId", "uploadedAt", "status", "description")
SELECT 
  'c' || lower(hex(randomblob(24))) as id,
  'doutorado' as type,
  c.id as candidateId,
  c."createdAt" as uploadedAt,
  'pending' as status,
  'Criado automaticamente para inscrição antiga' as description
FROM "candidates" c
WHERE c."formacaoAcademica" = 'Doutorado'
  AND NOT EXISTS (
    SELECT 1 FROM "titles" t 
    WHERE t."candidateId" = c.id 
    AND t."type" = 'doutorado'
  );

-- Mestrado
INSERT INTO "titles" ("id", "type", "candidateId", "uploadedAt", "status", "description")
SELECT 
  'c' || lower(hex(randomblob(24))) as id,
  'mestrado' as type,
  c.id as candidateId,
  c."createdAt" as uploadedAt,
  'pending' as status,
  'Criado automaticamente para inscrição antiga' as description
FROM "candidates" c
WHERE c."formacaoAcademica" = 'Mestrado'
  AND NOT EXISTS (
    SELECT 1 FROM "titles" t 
    WHERE t."candidateId" = c.id 
    AND t."type" = 'mestrado'
  );

-- Especialização/Pós-graduação
INSERT INTO "titles" ("id", "type", "candidateId", "uploadedAt", "status", "description")
SELECT 
  'c' || lower(hex(randomblob(24))) as id,
  'pos_graduacao' as type,
  c.id as candidateId,
  c."createdAt" as uploadedAt,
  'pending' as status,
  'Criado automaticamente para inscrição antiga' as description
FROM "candidates" c
WHERE c."formacaoAcademica" = 'Especialização'
  AND NOT EXISTS (
    SELECT 1 FROM "titles" t 
    WHERE t."candidateId" = c.id 
    AND t."type" = 'pos_graduacao'
  );

-- Criar título de experiência em gestão baseado no campo tempoExperienciaGestao
INSERT INTO "titles" ("id", "type", "value", "candidateId", "uploadedAt", "status", "description")
SELECT 
  'c' || lower(hex(randomblob(24))) as id,
  'experiencia_gestao' as type,
  CAST(c."tempoExperienciaGestao" AS REAL) as value,
  c.id as candidateId,
  c."createdAt" as uploadedAt,
  'pending' as status,
  'Criado automaticamente para inscrição antiga' as description
FROM "candidates" c
WHERE c."tempoExperienciaGestao" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "titles" t 
    WHERE t."candidateId" = c.id 
    AND t."type" = 'experiencia_gestao'
  );
  
-- Nota: tempo_magisterio não é criado automaticamente aqui porque
-- as inscrições antigas podem não ter esse dado no formulário.
-- Se necessário, o admin pode adicionar manualmente ou criar via interface.

