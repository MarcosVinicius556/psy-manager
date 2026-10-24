# Backup diário do Firebase (Psy Manager)

Este projeto (`clinic-manager-ed887`) está no plano Spark do Firebase, sem export gerenciado do Firestore nem buckets do Cloud Storage. O backup automático usa o GitHub Actions para exportar Firestore e Auth, empacotar, calcular SHA-256 e **criptografar com [age](https://github.com/FiloSottile/age)** antes de publicar um artefato (retenção de 90 dias).

## O que é incluído

- **Firestore**: todas as coleções raiz e subcoleções, em NDJSON por caminho de coleção, com tipos especiais (`Timestamp`, `GeoPoint`, `DocumentReference`, `Bytes`) serializados de forma reversível.
- **Authentication**: lista de usuários via `listUsers` (inclui `passwordHash` / `passwordSalt` quando a conta de serviço tiver permissão).
- **Manifesto**: timestamp, SHA do Git, contagens, total de leituras e SHA-256 do arquivo `.tar.gz` (antes da criptografia).

O orçamento padrão de leituras do export é **40 000** por execução (limite Spark ~50 000/dia).

## Secrets no GitHub

Crie estes secrets em **Settings → Secrets and variables → Actions**:

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `FIREBASE_BACKUP_SERVICE_ACCOUNT` | Sim | JSON completo de uma **nova** chave de conta de serviço (veja abaixo). |
| `BACKUP_AGE_RECIPIENT` | Recomendado | Chave pública age (`age1…`). O runner **não** guarda a chave privada. |
| `BACKUP_PASSPHRASE` | Alternativa | Senha para `age -p` se não usar recipient. Menos recomendado que o par age. |

Se `FIREBASE_BACKUP_SERVICE_ACCOUNT` ou a criptografia não estiverem configurados, o workflow **encerra com sucesso** e apenas registra um aviso (para não quebrar o CI antes da configuração).

### Conta de serviço (mínimo privilégio)

1. No [Console GCP](https://console.cloud.google.com/) do projeto `clinic-manager-ed887`, crie uma conta de serviço dedicada, por exemplo `github-firestore-backup`.
2. Conceda apenas:
   - **Cloud Datastore Viewer** (leitura do Firestore)
   - **Firebase Authentication Viewer** (listar usuários)
3. Crie uma **nova** chave JSON e cole o conteúdo no secret `FIREBASE_BACKUP_SERVICE_ACCOUNT`.
4. Não commite esse JSON no repositório (o GitGuardian varre cada commit).

## Par de chaves age (Windows)

Instale o `age` e gere um par offline (guarde só a chave **privada** fora do GitHub):

```powershell
winget install FiloSottile.age
age-keygen -o backup-key.txt
```

- A linha `# public key: age1…` vai para o secret `BACKUP_AGE_RECIPIENT`.
- O arquivo `backup-key.txt` permanece **offline** (pendrive, cofre de senhas, etc.). É ele que você usa na restauração (`--age-identity`).

No Linux/macOS o fluxo é o mesmo (`age-keygen -o backup-key.txt`).

## Agendamento

Workflow: `.github/workflows/firestore-backup.yml`

- **Cron**: 06:00 UTC (03:00 BRT)
- **Manual**: Actions → *Firestore backup* → *Run workflow*

## Baixar e restaurar

1. No GitHub Actions, abra a execução do backup e baixe o artefato `firestore-backup-*` (arquivos `.tar.gz.age` e `.manifest.json`).
2. Instale `age` na máquina de restauração.
3. Descriptografe e restaure em um projeto de **destino** (emulador ou outro projeto Firebase):

```bash
npm ci
# Preencha auth/auth-hash-config.json dentro do tar se for importar senhas:
# Console Firebase → Authentication → Configurações → Parâmetros de hash de senha
# (algorithm SCRYPT, key, saltSeparator, rounds, memoryCost — não versionar)

npx tsx scripts/backup/restore.ts \
  --archive ./psy-manager-backup-....tar.gz.age \
  --age-identity ./backup-key.txt \
  --project meu-projeto-de-teste
```

Flags úteis:

- `--dry-run` — apenas lista o que seria escrito
- `--collection users` — restaura uma coleção (caminho completo, ex. `users/UID/notas`)
- `--i-know-this-is-production` — necessário apenas se `--project clinic-manager-ed887` (restauração em produção)

O script valida o SHA-256 do `.tar.gz` usando o manifesto lado a lado (`.manifest.json`) ou o `manifest.json` dentro do pacote.

### Hash de senhas na importação do Auth

O arquivo `auth-hash-config.json` no backup vem com `key` e `saltSeparator` vazios. Antes de `importUsers`, preencha com os valores do console Firebase (mesmo projeto de **origem** do backup). Sem isso, usuários com senha não podem ser reimportados com hash correto.

## Scripts npm

| Comando | Uso |
|---------|-----|
| `npm run backup:export` | Só Firestore (local / credenciais em `GOOGLE_APPLICATION_CREDENTIALS`) |
| `npm run backup:run` | Export completo + empacote + age (variáveis de ambiente) |
| `npm run backup:verify` | Teste no emulador (export → age → restore → diff) |

## Retenção e cópia extra

- Artefatos do GitHub: **90 dias** (`retention-days` no workflow).
- Para cópia adicional (ex.: Google Drive), baixe o `.age` periodicamente ou automatize com uma etapa extra no workflow — isso não está implementado por padrão.

## Desenvolvimento

Pastas ignoradas pelo Git: `.backup-work/`, `.backup-restore-work/`, `.backup-verify/`, `.backup-verify-work/`.

Variáveis opcionais:

- `BACKUP_READ_BUDGET` — orçamento de leituras (padrão 40000)
- `BACKUP_PASSPHRASE` — criptografia por senha no `run-backup`
