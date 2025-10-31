# Guia de Atualização em Produção - Sem Perder Dados

## 📋 Processo Automático Atual

O sistema **já está configurado** para aplicar migrações automaticamente ao iniciar o container através do script `start-prod.sh`. Ele executa:

```bash
npx prisma migrate deploy  # Aplica apenas migrações pendentes
```

**✅ Isso é SEGURO** - `prisma migrate deploy`:
- Aplica apenas migrações que ainda não foram aplicadas
- **Preserva todos os dados existentes**
- Não remove ou modifica dados existentes
- Adiciona apenas novas tabelas/colunas quando necessário

---

## ⚠️ CORREÇÃO IMEDIATA: Status NULL em Titles

Se você está vendo inscrições antigas com pontuação zerada e ANEXOS vazios, execute este comando no container:

```bash
sqlite3 /app/data/prod.db "UPDATE titles SET status = 'pending' WHERE status IS NULL;"
```

O script `start-prod.sh` agora faz isso automaticamente a cada reinicialização, mas você pode executar manualmente para corrigir imediatamente.

---

## 🔒 Passo a Passo Recomendado (Extra Segurança)

### 1️⃣ **Backup ANTES de Atualizar (RECOMENDADO)**

Antes de fazer deploy de qualquer atualização, faça backup do banco de dados:

```bash
# No EasyPanel, via SSH ou Terminal do Container:
# Copiar o arquivo do banco
cp /app/data/prod.db /app/data/prod.db.backup-$(date +%Y%m%d-%H%M%S)

# Ou baixar via EasyPanel:
# 1. Acesse o volume persistente do banco
# 2. Baixe o arquivo prod.db antes de fazer deploy
```

### 2️⃣ **Verificar se Há Novas Migrações**

Localmente, antes de fazer deploy:

```bash
# Verificar status das migrações
npx prisma migrate status

# Ver migrações aplicadas vs pendentes
npx prisma migrate list
```

### 3️⃣ **Fazer Deploy Normal**

No EasyPanel:
1. Faça commit e push das mudanças
2. No EasyPanel, clique em "Deploy" ou "Rebuild"
3. O container será reconstruído
4. Ao iniciar, o `start-prod.sh` executará automaticamente:
   - `npx prisma generate` (regenera Prisma Client)
   - `npx prisma migrate deploy` (aplica migrações pendentes)
   - **NOVO**: Verifica e corrige status NULL em titles automaticamente

### 4️⃣ **Verificar Logs após Deploy**

Após o deploy, verifique os logs para confirmar que tudo ocorreu bem:

```bash
# No EasyPanel, vá em "Logs" e procure por:
✓ Banco de dados encontrado
✓ Migrações aplicadas com sucesso
✓ Tabela admin_sessions encontrada
✓ Todos os registros de titles têm status definido  # NOVO
# OU
⚠ Encontrados X registros com status NULL. Atualizando para 'pending'...  # NOVO
✓ Registros atualizados com sucesso!  # NOVO
```

---

## 🛠️ Em Caso de Problemas

### Se `migrate deploy` Falhar

O script tem fallback automático:

1. **Primeiro tenta**: `npx prisma migrate deploy`
2. **Se falhar, tenta**: `npx prisma db push --accept-data-loss`

⚠️ **ATENÇÃO**: `db push` com `--accept-data-loss` pode perder dados em casos extremos, mas o script só usa como último recurso.

### Restaurar Backup

Se algo der errado:

```bash
# Parar o container
# Restaurar backup
cp /app/data/prod.db.backup-YYYYMMDD-HHMMSS /app/data/prod.db

# Reiniciar container
```

---

## 📝 Checklist para Cada Deploy

- [ ] ✅ Fazer backup do banco antes de atualizar
- [ ] ✅ Verificar se há novas migrações no código
- [ ] ✅ Fazer commit e push das mudanças
- [ ] ✅ Fazer deploy via EasyPanel
- [ ] ✅ Verificar logs após deploy
- [ ] ✅ **NOVO**: Verificar se registros com status NULL foram corrigidos
- [ ] ✅ Testar funcionalidades principais
- [ ] ✅ Verificar se dados foram preservados

---

## 🔍 Como Verificar se Migrações Foram Aplicadas

No container em produção, você pode verificar:

```bash
# Listar tabelas no banco
sqlite3 /app/data/prod.db ".tables"

# Ver histórico de migrações aplicadas
sqlite3 /app/data/prod.db "SELECT * FROM _prisma_migrations;"

# Verificar estrutura de uma tabela específica
sqlite3 /app/data/prod.db ".schema titles"

# Verificar quantos registros têm status NULL (deve ser 0)
sqlite3 /app/data/prod.db "SELECT COUNT(*) FROM titles WHERE status IS NULL;"

# Ver alguns registros de titles para debug
sqlite3 /app/data/prod.db "SELECT id, type, status FROM titles LIMIT 10;"
```

---

## ⚠️ Importante: Volumes Persistentes

**CRÍTICO**: Certifique-se de que os volumes estão configurados no EasyPanel:

- ✅ `/app/data` → Volume persistente (contém `prod.db`)
- ✅ `/app/uploads` → Volume persistente (contém arquivos enviados)

Sem volumes configurados, os dados serão perdidos ao remover/recriar o container!

---

## 📊 Migrações Atuais no Projeto

- ✅ `20251030210618_init` - Migração inicial (tabelas base)
- ✅ `20250101000000_add_admin_sessions` - Tabela de sessões persistentes
- ✅ `20250115000000_add_title_validation_fields` - **NOVA**: Campos de validação na tabela `titles` (status, pontosAprovados, observacao, validadoPor, validadoEm)

### ⚠️ Migração Importante: Campos de Validação de Títulos

Esta migração adiciona os campos de validação manual à tabela `titles`:
- `status` (pending/approved/rejected)
- `pontosAprovados` (pontos customizados pelo admin)
- `observacao` (observações do admin)
- `validadoPor` (quem validou)
- `validadoEm` (quando foi validado)

**Esta migração é SEGURA** - apenas adiciona novas colunas sem remover dados existentes.

**IMPORTANTE**: O script de startup agora verifica e corrige automaticamente qualquer registro com `status = NULL`, definindo como `'pending'`. Isso corrige inscrições antigas criadas antes da migração.

Se você adicionar novas mudanças no `schema.prisma`:
1. Crie nova migração localmente: `npx prisma migrate dev --name descricao_da_mudanca`
2. Commit a migração junto com o código
3. Faça deploy - ela será aplicada automaticamente

---

## 🎯 Resumo

**Processo Padrão (Seguro e Automático)**:
1. ✅ Commit e push do código (incluindo novas migrações se houver)
2. ✅ Deploy via EasyPanel
3. ✅ Script executa `prisma migrate deploy` automaticamente
4. ✅ Script verifica e corrige status NULL em titles automaticamente
5. ✅ Dados são preservados automaticamente

**Recomendação Extra**:
- Faça backup antes de cada deploy (só por segurança)
- Verifique logs após deploy para confirmar sucesso
- Se ver pontuação zerada após deploy, execute manualmente: `sqlite3 /app/data/prod.db "UPDATE titles SET status = 'pending' WHERE status IS NULL;"`
