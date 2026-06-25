# Revisão Controlada do Admin SaaS

Objetivo: permitir avaliação visual e operacional do admin sem considerar produção ampla automaticamente aprovada.

## O Que Abrir

1. `/admin`
   - Verificar cards gerais.
   - Verificar seção "Liberação controlada".
   - Confirmar módulos disponíveis conforme permissões.

2. `/admin/system`
   - Verificar banco, ambiente, Stripe e envs.
   - Verificar "Readiness de liberação".
   - Confirmar ausência de secrets em tela.

3. `/admin/operations`
   - Verificar status geral.
   - Verificar integrações.
   - Verificar filas: export, archive, restore, retention, webhook e billing.

4. `/admin/exports`
   - Confirmar que export exige senha atual.
   - Confirmar storage privado/checksum no job concluído.
   - Em produção/staging final, não aceitar export concluído sem `storageProvider`.

5. `/admin/archive`
   - Confirmar archive, restore dry-run e restore real controlado.
   - Confirmar motivo, step-up e checksum.

6. `/admin/retention`
   - Confirmar dry-run por padrão.
   - Confirmar que execução real depende de archive prévio.

7. `/admin/audit`
   - Confirmar eventos administrativos e filtros.

8. `/admin/billing`, `/admin/sales`, `/admin/support`, `/admin/admin-users`
   - Revisar dashboards, ações auditadas e mensagens de limitação.

## Validação Local

```bash
npx prisma validate
npx prisma generate
npm run build
npm run admin:readiness
```

Modo estrito para staging final:

```bash
ADMIN_READINESS_STRICT=true ADMIN_STAGING_BASE_URL=https://staging.example.com npm run admin:readiness
```

## Fallbacks Restantes

- `ARCHIVE_STORAGE_PROVIDER=local`: apenas dev/test.
- `ADMIN_EXPORT_ALLOW_INLINE_FALLBACK=true`: apenas compatibilidade local/dev.
- Readiness sem `ADMIN_STAGING_BASE_URL`: checagem estática/local, não prova staging navegável.
- Restore: não é restore transacional completo de banco; usar primeiro dry-run.

## Bloqueadores Para Produção Ampla

- Bucket S3-compatible privado precisa estar configurado e validado.
- Stripe test mode precisa estar configurado e validado em staging.
- Webhook Stripe precisa receber eventos reais em staging.
- Restore real precisa ser testado em banco isolado antes de qualquer uso produtivo.
- Readiness estrito precisa passar sem falhas.

## Critério Para Revisão Visual

Pode revisar visualmente quando:

- build local passa;
- `/admin` e `/admin/system` carregam;
- usuário admin tem permissões esperadas;
- mensagens de fallback aparecem como partial/blocked quando infra externa estiver ausente.

Isso não equivale a aprovação de produção ampla.
