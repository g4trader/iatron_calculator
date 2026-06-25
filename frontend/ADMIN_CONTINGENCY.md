# Admin Contingência

O módulo `/admin/contingency` centraliza ações operacionais excepcionais. A rota exige a permissão `admin.contingency.manage` e todas as ações são executadas no servidor.

## Playbooks disponíveis

- Acesso emergencial
  - Gerar licença emergencial com origem `CONTINGENCY` e expiração obrigatória.
  - Reenviar ativação/verificação de e-mail quando aplicável.
  - Invalidar todas as sessões ativas de um usuário.
- Billing e entitlement
  - Reprocessar reconcile usando a Stripe como fonte.
  - Forçar refresh de entitlement local a partir da assinatura persistida.
- Incidente operacional
  - Registrar incidente operacional como evento administrativo auditável.

## Regras obrigatórias

- Toda ação exige motivo com pelo menos 8 caracteres.
- Toda ação exige confirmação explícita digitando `CONTINGENCIA`.
- Toda ação grava `AdminAuditEvent`.
- Ações financeiras não alteram cobrança crítica diretamente no banco.
- A base atual não possui reautenticação step-up; ações de alto risco usam confirmação reforçada até MFA/step-up ser implementado.

## Auditoria

As ações usam o namespace `admin.contingency.*`:

- `admin.contingency.emergency_license_generated`
- `admin.contingency.reconcile_reprocessed`
- `admin.contingency.activation_resent`
- `admin.contingency.sessions_invalidated`
- `admin.contingency.entitlement_refreshed`
- `admin.contingency.incident_registered`

O histórico recente aparece na própria página e a trilha completa pode ser consultada em `/admin/audit`.

## Operação segura

Use contingência apenas quando o fluxo normal de suporte, billing ou autenticação não resolver o incidente no tempo necessário. Sempre registre um motivo com contexto suficiente para investigação posterior.
