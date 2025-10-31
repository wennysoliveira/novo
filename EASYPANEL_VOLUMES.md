# Configuração de Volumes Persistentes no EasyPanel

## ⚠️ IMPORTANTE: Sem esta configuração, os dados serão perdidos a cada rebuild!

## Passo a Passo no EasyPanel

### 1. Acesse o Painel de Configuração do Seu App

1. No EasyPanel, vá até o seu aplicativo
2. Clique em **"Settings"** ou **"Configurações"**
3. Procure pela seção **"Volumes"** ou **"Storage"** ou **"Persistent Storage"**

### 2. Adicione os Volumes Persistentes

Você precisa configurar **2 volumes/bind mounts**:

#### Volume 1: Banco de Dados
- **Host Path / Source Path**: `/data/gestao-escolar/db` (ou qualquer caminho no servidor)
- **Container Path / Mount Point**: `/app/data`
- **Type**: `Bind Mount` ou `Named Volume`
- **Description**: Armazena o banco de dados SQLite (prod.db)

#### Volume 2: Arquivos Uploadados
- **Host Path / Source Path**: `/data/gestao-escolar/uploads` (ou qualquer caminho no servidor)
- **Container Path / Mount Point**: `/app/uploads`
- **Type**: `Bind Mount` ou `Named Volume`
- **Description**: Armazena arquivos enviados pelos usuários

### 3. Configuração no EasyPanel (Interface Web)

1. Na página do seu aplicativo, procure por:
   - **"Volumes"**
   - **"Storage"**
   - **"Persistent Volumes"**
   - **"Mounts"**
   - **"Bind Mounts"**

2. Clique em **"Add Volume"** ou **"Add Mount"**

3. Configure assim:

   **Volume 1 - Banco de Dados:**
   ```
   Mount Path: /app/data
   Source: /data/gestao-escolar/db
   Type: Bind Mount
   ```

   **Volume 2 - Uploads:**
   ```
   Mount Path: /app/uploads
   Source: /data/gestao-escolar/uploads
   Type: Bind Mount
   ```

### 4. Se EasyPanel usar Docker Compose

Se você tiver acesso ao `docker-compose.yml` gerado, adicione:

```yaml
volumes:
  - /data/gestao-escolar/db:/app/data
  - /data/gestao-escolar/uploads:/app/uploads
```

### 5. Crie os Diretórios no Servidor (SSH)

Se estiver usando Bind Mounts, você precisa criar os diretórios no servidor:

```bash
# Conecte-se ao servidor via SSH
ssh seu-usuario@seu-servidor

# Crie os diretórios
sudo mkdir -p /data/gestao-escolar/db
sudo mkdir -p /data/gestao-escolar/uploads

# Defina as permissões corretas
sudo chmod 755 /data/gestao-escolar/db
sudo chmod 755 /data/gestao-escolar/uploads

# Defina o dono (substitua pelo usuário do Docker, geralmente root ou usuário específico)
sudo chown -R root:root /data/gestao-escolar/
```

### 6. Verificação

Após configurar, reinicie o aplicativo e verifique os logs:

```
=== Iniciando aplicação em produção ===
Verificando volumes persistentes...
DATABASE_URL: file:/app/data/prod.db
UPLOAD_DIR: /app/uploads
✓ Diretório /app/data é gravável
✓ Diretório /app/uploads é gravável
✓ Banco de dados encontrado: /app/data/prod.db (X.XK)
```

## Troubleshooting

### Problema: "Diretório não é gravável"

**Solução:**
```bash
# Verificar permissões no servidor
ls -la /data/gestao-escolar/

# Ajustar permissões
sudo chmod 755 /data/gestao-escolar/db
sudo chmod 755 /data/gestao-escolar/uploads
```

### Problema: "Banco de dados não encontrado"

**Solução:** O banco será criado automaticamente. Se não criar, verifique:
1. Permissões do diretório `/app/data`
2. Se o volume está montado corretamente

### Problema: Dados ainda se perdem

**Solução:** 
1. Verifique se os volumes estão realmente configurados no EasyPanel
2. Verifique se os caminhos estão corretos
3. Verifique se o tipo de volume está correto (Bind Mount ou Named Volume)
4. Reinicie o container após configurar os volumes

## Exemplo de Configuração Completa

No EasyPanel, você deve ver algo como:

```
Volumes:
┌─────────────────┬──────────────────────────────┬──────────────┐
│ Container Path  │ Host Path                    │ Type         │
├─────────────────┼──────────────────────────────┼──────────────┤
│ /app/data       │ /data/gestao-escolar/db      │ Bind Mount   │
│ /app/uploads    │ /data/gestao-escolar/uploads │ Bind Mount   │
└─────────────────┴──────────────────────────────┴──────────────┘
```

## Alternativa: Named Volumes

Se preferir usar Named Volumes (gerenciados pelo Docker):

1. No EasyPanel, ao adicionar volume, escolha **"Named Volume"** em vez de **"Bind Mount"**
2. Nome sugerido:
   - `gestao-escolar-db`
   - `gestao-escolar-uploads`

Os dados ficarão em:
- `/var/lib/docker/volumes/gestao-escolar-db/_data`
- `/var/lib/docker/volumes/gestao-escolar-uploads/_data`

