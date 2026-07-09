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
4. Na página de detalhe, anexe o comprovante privado quando existir arquivo PDF, PNG, JPG ou WEBP.
5. Um operador com permissão `admin.billing.manage` confirma ou recusa o recebimento com step-up.
6. Somente pagamento `CONFIRMED` pode liberar licença.
7. A liberação cria uma licença `ACTIVE` com origem `MANUAL_SUPPORT`.
8. O pagamento fica vinculado à licença e muda para `RECONCILED`.

## Upload de comprovante

- O comprovante binário fica em storage privado usando o mesmo provider de archive/export (`ARCHIVE_STORAGE_PROVIDER=gcs` ou `ARCHIVE_STORAGE_PROVIDER=s3`).
- A aplicação gera URL assinada temporária para upload direto. O arquivo não trafega pelo servidor Next.js.
- O limite atual é 8 MB por arquivo.
- Formatos permitidos: PDF, PNG, JPG e WEBP.
- Cada solicitação de upload, conclusão de upload e abertura de comprovante gera evento em `AdminAuditEvent`.
- A referência textual/link/ID externo continua disponível para casos em que o comprovante esteja fora do sistema.

## Governança

- Toda action sensível exige motivo operacional.
- Confirmação, recusa, conciliação e liberação de licença exigem step-up por senha.
- Todos os eventos são gravados em `AdminAuditEvent`.
- Pagamento rejeitado não pode ser reativado; registre um novo pagamento.
- Pagamento conciliado não pode ser alterado novamente.
- Conciliação exige sequência válida: `PENDING -> CONFIRMED -> RECONCILED`.
- Conciliação manual direta exige licença já vinculada ao pagamento.
- Referência externa duplicada bloqueia novo registro ativo para reduzir conciliação indevida.

## Fora do escopo atual

- Integração automática com banco, PIX ou gateway externo.
- Emissão fiscal.
- Contas a receber completas.
- Substituição do Stripe como fonte principal de assinaturas recorrentes.
