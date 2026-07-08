# Pagamentos manuais

Este fluxo cobre recebimentos fora do Stripe para contingência comercial.

## Quando usar

- Cliente não conseguiu finalizar checkout automático.
- Equipe recebeu PIX, transferência, boleto, link externo ou cortesia autorizada.
- Suporte precisa liberar acesso sem editar banco diretamente.

## Fluxo operacional

1. Acesse `/admin/payments-manual`.
2. Registre o pagamento com cliente, método, valor, data/hora, comprovante ou referência e motivo.
3. O pagamento nasce como `PENDING`.
4. Um operador com permissão `admin.billing.manage` confirma ou recusa o recebimento com step-up.
5. Somente pagamento `CONFIRMED` pode liberar licença.
6. A liberação cria uma licença `ACTIVE` com origem `MANUAL_SUPPORT`.
7. O pagamento fica vinculado à licença e muda para `RECONCILED`.

## Governança

- Toda action sensível exige motivo operacional.
- Confirmação, recusa, conciliação e liberação de licença exigem step-up por senha.
- Todos os eventos são gravados em `AdminAuditEvent`.
- Pagamento rejeitado não pode ser reativado; registre um novo pagamento.
- Referência externa duplicada bloqueia novo registro ativo para reduzir conciliação indevida.

## Fora do escopo atual

- Upload binário de comprovante.
- Integração automática com banco, PIX ou gateway externo.
- Emissão fiscal.
- Contas a receber completas.
- Substituição do Stripe como fonte principal de assinaturas recorrentes.
