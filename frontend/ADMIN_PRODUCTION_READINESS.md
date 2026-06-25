# Admin SaaS - Produção Ampla

Este documento é operacional. Se uma etapa crítica falhar, interrompa a validação e não avance para produção ampla.

## Staging Obrigatório

1. Aplicar migrations:

```bash
npm run prisma:deploy
```

2. Validar schema/build:

```bash
npx prisma validate
npm run build
```

3. Validar login admin:

- login com usuário ADMIN;
- `/admin`;
- `/admin/archive`;
- `/admin/exports`;
- `/admin/retention`.

4. Validar step-up:

- exportação de auditoria em `/admin/exports`;
- archive em `/admin/archive`;
- restore em `/admin/archive`;
- execução real de retenção em `/admin/retention`.

5. Validar storage externo:

- configurar `ARCHIVE_STORAGE_PROVIDER=s3`;
- configurar endpoint/bucket/chaves S3-compatible;
- confirmar que `ARCHIVE_STORAGE_PROVIDER=local` não está em uso em produção;
- confirmar que o bucket é privado e não expõe URLs públicas permanentes;
- confirmar rotação/revogação possível da credencial de escrita/leitura.

6. Validar archive:

- criar `ArchiveJob` para `FUNNEL_EVENTS`;
- confirmar `ArchiveObject` criado;
- confirmar objeto `.jsonl` no bucket privado;
- confirmar checksum SHA-256 persistido;
- confirmar `AdminAuditEvent` de requested/completed.

7. Validar Archive Restore:

- solicitar dry-run de restore para um `ArchiveObject`;
- confirmar validação de checksum;
- confirmar `ArchiveRestoreJob.status = DRY_RUN`;
- confirmar `ArchiveRestoreEvent` de requested/checksum/dry-run;
- executar restore real apenas em banco isolado;
- confirmar `ArchiveRestoreJob.status = COMPLETED`;
- repetir restore sem `force` e confirmar bloqueio;
- testar objeto adulterado em staging isolado e confirmar falha por checksum.

8. Validar retenção:

- rodar dry-run;
- criar archive correspondente;
- rodar execução real apenas em banco isolado;
- confirmar bloqueio quando archive obrigatório estiver ausente.

9. Validar Stripe test mode:

- checkout individual;
- webhook `checkout.session.completed`;
- webhook `invoice.payment_failed`;
- `FunnelEvent` de checkout e licença.

10. Executar checklist automatizado:

```bash
npm run admin:readiness
```

Modo estrito para staging final:

```bash
ADMIN_READINESS_STRICT=true ADMIN_STAGING_BASE_URL=https://staging.example.com npm run admin:readiness
```

Opcional para smoke HTTP:

```bash
ADMIN_STAGING_BASE_URL=https://staging.example.com npm run admin:readiness
```

## Variáveis

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ARCHIVE_STORAGE_PROVIDER=s3`
- `ARCHIVE_S3_ENDPOINT`
- `ARCHIVE_S3_BUCKET`
- `ARCHIVE_S3_REGION`
- `ARCHIVE_S3_ACCESS_KEY_ID`
- `ARCHIVE_S3_SECRET_ACCESS_KEY`
- `ARCHIVE_S3_PREFIX`
- `ADMIN_STAGING_BASE_URL` opcional para smoke do checklist.
- `ADMIN_READINESS_STRICT=true` para validação final de staging.

`ARCHIVE_STORAGE_PROVIDER=local` e `ARCHIVE_STORAGE_DIR` são permitidos somente em desenvolvimento/teste.
`ADMIN_EXPORT_ALLOW_INLINE_FALLBACK=true` é compatibilidade local/dev e não deve existir em produção.

## Retenção vs Arquivo

- Archive preserva histórico em storage privado e cria `ArchiveObject`.
- Archive Restore usa `ArchiveRestoreJob` e `ArchiveRestoreEvent`.
- Restore sempre valida checksum antes de dry-run ou execução real.
- Restore real usa `createMany(..., skipDuplicates: true)` para reduzir risco de duplicação acidental.
- Restore dry-run informa linhas candidatas, IDs já existentes, linhas sem ID e duplicados internos.
- Retenção remove dados recentes do banco primário apenas depois de archive quando aplicável.
- `AdminAuditEvent` não é removido por retenção automática.

## Exportações Sensíveis

- Exportações são gravadas no mesmo storage privado governado por `ArchiveStorage`.
- `ExportJob` registra `storageProvider`, `storageKey`, `checksum` e `byteSize`.
- Download lê do storage privado e valida checksum antes de entregar o arquivo.
- Em produção, ausência de storage externo bloqueia processamento/download em vez de cair para conteúdo inline.
- Reprocessamento manual exige step-up.

## Rollback Se Archive Falhar

- Não executar retenção destrutiva.
- Revisar `ArchiveJob.status = FAILED`.
- Conferir `errorMessage`.
- Corrigir storage/permissão.
- Reprocessar o job.

## Rollback Se Restore Falhar

- Não repetir restore real sem diagnóstico.
- Revisar `ArchiveRestoreJob.errorMessage`.
- Confirmar checksum esperado vs atual.
- Confirmar se a tabela alvo ainda existe e se FKs referenciadas existem.
- Reexecutar primeiro em `dryRun`.
- Usar `force` apenas quando houver restore concluído anterior e motivo operacional documentado.

## Quando Não Executar Restore Real

- Quando o dry-run aponta linhas sem ID.
- Quando há divergência de checksum.
- Quando existem FKs removidas ou schema incompatível.
- Quando o objetivo é rollback amplo de banco. Use backup transacional do PostgreSQL.
- Quando o operador não consegue justificar o motivo no ticket/incidente.

## Limites Conhecidos

- Provider final implementado: `s3_private`, compatível com S3/R2/MinIO/Supabase S3-compatible quando disponível.
- Fallback `local_private` continua apenas para desenvolvimento/teste.
- Restore não é ferramenta de migração geral. Ele cobre os tipos de archive modelados e depende da compatibilidade dos dados JSONL com o schema atual.
- Restore de registros com FKs removidas pode falhar e deve ser tratado como incidente operacional.
- Restore não é transacional ponta a ponta entre múltiplas tabelas.
- E2E completo depende de banco isolado/staging e Stripe test mode configurado.
