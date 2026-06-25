# Dados Operacionais do Admin

Esta camada substitui proxies frágeis do backoffice por entidades persistidas e auditáveis. Ela não altera fórmulas clínicas nem o fluxo público comercial.

## Entidades

- `OperationalIncident`: incidente operacional aberto, monitorado ou resolvido.
- `OperationalIncidentComment`: comentários de evolução do incidente.
- `SupportTicket`: ticket interno de suporte/customer success.
- `SupportTicketComment`: histórico do ticket.
- `JobRun`: execução de jobs como cleanup, reconcile e rotinas futuras.
- `CheckoutEvent`: evento operacional de checkout.
- `WebhookFailure`: falha persistida de webhook; armazena hash do payload, não payload bruto.
- `BillingIssue`: divergência/risco de billing persistido.
- `FunnelEvent`: evento de funil comercial para substituir contagens por proxy.
- `ExportJob`: job governado de exportação sensível ou pesada.
- `RetentionRun`: execução auditada de política de retenção/cleanup.
- `ArchiveJob`: execução de arquivamento histórico para storage privado.
- `ArchiveObject`: referência rastreável ao objeto arquivado.
- `ArchiveRestoreJob`: dry-run ou execução real de restore a partir de um objeto arquivado.
- `ArchiveRestoreEvent`: timeline técnica do restore.

## Fontes Por Painel

- `/admin/operations`: usa `OperationalIncident`, `JobRun`, `WebhookFailure`, `BillingIssue`, `SupportTicket`, `SecurityEvent` e `UserSession`.
- `/admin/support`: usa `SupportTicket` para tickets reais e mantém intervenções legadas via `AdminAuditEvent`.
- `/admin/billing`: usa `WebhookFailure` e `BillingIssue`, além de `Subscription`, `StripeWebhookEvent` e Stripe quando configurada.
- `/admin/sales`: usa `FunnelEvent` quando existe; mantém fallback documentado para `Subscription` e `CalculationHistory`.
- `/admin/exports`: lista `ExportJob`, cria exportações auditadas com step-up e libera download somente quando `COMPLETED`.
- `/admin/retention`: executa políticas de retenção com dry-run por padrão e step-up para limpeza real.
- `/admin/archive`: cria e monitora `ArchiveJob`/`ArchiveObject`, além de dry-run/restore controlado.

## Eventos de Funil Instrumentados

- `landing_view`: beacon público em `/`.
- `pricing_view`: beacon público na seção de planos e registro server-side em `/checkout`.
- `account_created`: cadastro por email/senha.
- `first_login`: login por credenciais ou acesso temporário.
- `checkout_started`: criação de Stripe Checkout Session.
- `checkout_completed`: webhook `checkout.session.completed`.
- `checkout_failed`: falha ao criar checkout ou `invoice.payment_failed`.
- `license_activated`: sincronização de assinatura ativa/trial com licença.
- `first_use`: primeiro salvamento de cálculo no histórico.

Todos usam `dedupeKey` quando há `userId`, `sessionId` ou escopo confiável. Quando não há contexto, o evento é registrado sem dedupe e deve ser tratado como contagem bruta.

## Auditoria

Mutations administrativas de incidentes e tickets gravam `AdminAuditEvent`. Falhas de webhook não armazenam segredo nem payload bruto; apenas `payloadHash` SHA-256 e metadata operacional.

## Paginação

Os helpers `listOperationalIncidents()` e `listSupportTickets()` implementam paginação server-side com:

- `page` mínimo 1.
- `pageSize` entre 10 e 100.
- filtros por status/severidade/prioridade/categoria.

## Retenção

Comando:

```bash
npm run operational:cleanup
```

Por padrão roda em `dry_run`. Para apagar registros resolvidos/fechados antigos:

```bash
OPERATIONAL_RETENTION_DAYS=180 OPERATIONAL_CLEANUP_EXECUTE=true npm run operational:cleanup
```

O script remove apenas:

- incidentes `RESOLVED` com `resolvedAt` antigo;
- tickets `RESOLVED`/`CLOSED` com `closedAt` antigo;
- jobs `SUCCESS`/`CANCELED` antigos;
- webhook failures `RESOLVED`/`IGNORED` antigos;
- billing issues `RESOLVED`/`IGNORED` antigos.

O painel `/admin/retention` formaliza três políticas:

- curta: eventos operacionais resolvidos;
- média: exportações expiradas;
- longa: auditoria/funil.

`AdminAuditEvent` não é apagado automaticamente na política longa; exige estratégia externa de arquivo/snapshot antes.

Execução real de retenção destrutiva exige archive concluído para os tipos relacionados. Sem `ArchiveJob COMPLETED` com `ArchiveObject`, a retenção falha fechada.

## Arquivamento

Archive usa `ArchiveJob` e `ArchiveObject`.

- Provider de produção ampla: `s3_private`.
- Compatível com S3/R2/MinIO/Supabase S3-compatible quando o endpoint privado estiver disponível.
- Variáveis: `ARCHIVE_STORAGE_PROVIDER=s3`, `ARCHIVE_S3_ENDPOINT`, `ARCHIVE_S3_BUCKET`, `ARCHIVE_S3_REGION`, `ARCHIVE_S3_ACCESS_KEY_ID`, `ARCHIVE_S3_SECRET_ACCESS_KEY`, `ARCHIVE_S3_PREFIX`.
- Fallback `local_private` com `ARCHIVE_STORAGE_DIR` é permitido apenas em desenvolvimento/teste.
- Formato: JSONL.
- Checksum: SHA-256.
- Cada archive grava `AdminAuditEvent`.
- Em produção, ausência de provider externo falha fechado.

## Archive Restore

Restore usa `ArchiveRestoreJob` e `ArchiveRestoreEvent`.

- Toda solicitação exige permissão `admin.contingency.manage`.
- Toda solicitação exige step-up por senha.
- Toda solicitação exige motivo operacional.
- Dry-run é o modo padrão.
- Restore real valida checksum antes de escrever.
- Restore duplicado é bloqueado, exceto quando o operador informa confirmação forçada e motivo.
- `AdminAuditEvent` é gravado para requested, dry-run, completed, failed e blocked.
- Restore usa `createMany` com `skipDuplicates` para reduzir duplicação acidental, mas não substitui backup/restore transacional do banco.

## Exportações

Exportações sensíveis usam `ExportJob`.

- Criação exige permissão `admin.audit.export`.
- Exportação de auditoria exige step-up por senha.
- Reprocessamento de exportação exige step-up por senha.
- Download é permitido apenas quando o job está `COMPLETED`.
- Conteúdo é gravado em storage privado via `ArchiveStorage`.
- `storageProvider`, `storageKey`, `checksum` e `byteSize` são persistidos.
- Download valida checksum antes de entregar o arquivo.
- Cada solicitação, conclusão ou falha grava `AdminAuditEvent`.
- `ExportJob.fileContent` só pode ser usado como fallback local/dev. Em produção, ausência de storage privado falha fechado.

## Limites Conhecidos

- `CheckoutEvent` existe para persistência operacional; parte do funil usa `FunnelEvent`, e eventos técnicos de checkout podem ser ampliados depois com `CheckoutEvent`.
- Archive possui provider S3-compatible final, mas a validação real depende de bucket privado configurado em staging/produção.
- `ExportJob.fileContent` permanece apenas por compatibilidade local/dev e para exports antigos; não é caminho aceito de produção ampla.
- Restore existe no admin, mas só deve ser executado em produção após dry-run e confirmação operacional.
