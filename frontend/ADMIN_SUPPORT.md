# Suporte e Customer Success

O módulo `/admin/support` centraliza sinais de suporte, risco e intervenção operacional. A rota exige `admin.support.view`.

## Escopo

Este módulo não é um help desk completo. Ele funciona como backoffice de triagem para:

- contas em risco;
- contas com billing problem;
- contas com baixa adoção;
- falhas recorrentes de acesso;
- notas, motivos de risco, ações tomadas e follow-up date.

## Priorização

A lista usa o health score do módulo de clientes e adiciona pesos operacionais:

- risco critical/at-risk/monitor;
- problema de billing;
- falta de uso por mais de 30 dias;
- menor health score.

## Auditoria

Toda intervenção grava `AdminAuditEvent` com:

- `action = admin.support.note_added`
- `resourceType = user` ou `organization`
- `supportNote`
- `riskReason`
- `actionTaken`
- `followUpDate`

Não registrar dados clínicos sensíveis, secrets, tokens ou senhas em notas de suporte.
