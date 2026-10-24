# Armazenamento Cloudinary — público vs autenticado

## Entrega pública (`type: upload`)

| Uso | `kind` no upload | Pasta |
| --- | --- | --- |
| Foto do profissional (perfil / Firebase Auth) | `avatar` | `avatars/{uid}/` |

Esses arquivos continuam com URL `https://res.cloudinary.com/.../upload/...` retornada pela API de upload.

## Entrega autenticada (`type: authenticated`)

Todos os demais envios do painel usam entrega restrita. O Firestore guarda apenas:

```json
{ "publicId": "clinic/{uid}/...", "resourceType": "image|raw", "format": "jpg" }
```

em `ClinicAttachment.asset`, `Patient.fotoAsset`, ou markdown de contrato (`psy-asset:...`).

| Dado | `kind` | Pasta |
| --- | --- | --- |
| Foto do paciente | `patient-photo` | `clinic/{uid}/patients/photos/` |
| Contrato assinado | `patient-contract` | `clinic/{uid}/patients/{patientId}/contracts/` |
| Anamnese / atividades | `appointment-anamnese`, `appointment-atividade` | `clinic/{uid}/appointments/{appointmentId}/...` |
| Comprovante de pagamento | `payment-receipt` | `clinic/{uid}/payments/{paymentId}/comprovantes/` |
| Imagem em modelo de contrato | `contract-template` | `clinic/{uid}/contracts/templates/` |
| PDF de relatório salvo | `report` | `clinic/{uid}/reports/` |

## Acesso no app

- `GET /api/media` — exige Firebase ID token; valida titularidade pelo `publicId`; redireciona para URL assinada (~5 min) ou retorna JSON com `mode=json`.
- `GET /api/pdf` — aceita `publicId` + `resourceType` com a mesma autorização, ou URL legada do Cloudinary (relatórios antigos).

## Migração

Script: `scripts/migrate-cloudinary-to-authenticated.ts` (dry-run por padrão). Ver comentários no arquivo para variáveis e `--apply`.

## Fora deste escopo

- Arquivos estáticos em `public/images/**` (site / landing) — outro PR.
- Logos e ilustrações da landing que não passam pelo upload do painel.
