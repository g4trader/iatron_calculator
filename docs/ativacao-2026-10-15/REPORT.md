# Ativação e revisão — 15/10/2026

## Publicação confirmada

Correções publicadas em https://ped.iatron.com.br. Commit `546c4cc7eb6d4324d1cf6e3c391b49732cb09ae8`, deployment `dpl_6DnonYnupReXhccZpHg3pVgjq1e3`, promoção registrada em 2026-10-15T12:27:26.097161-03:00 (Brasília). Build remoto aprovado; 27 verificações automáticas em produção passaram, sem erros JavaScript. PCR sintético idêntico à V3 auditada. Sem rollback necessário.

As rotas privadas foram verificadas contra acesso anônimo; os fluxos autenticados de produção continuam sob teste do usuário, conforme instrução anterior. Testes autenticados desta entrega usaram banco local e contas sintéticas.

## Autorização e estado

O responsável autorizou implementação, commit e publicação, mantendo o provedor de pagamento pendente. Confirmou não possuir Cloudflare ativo e solicitou pesquisa de referências para corrigir as fontes clínicas.

As variáveis de produção `MENTORY_PUBLICATION_APPROVAL` e `MENTORY_STREAM_APPROVED` foram registradas. A publicação de aulas continua exigindo administrador, revisão da versão atual e auditoria; não houve publicação automática de conteúdo nem concessão de novas permissões. A conta administrativa previamente designada permanece a mesma. Pagamentos continuam sem transações reais.

## Entregas

- Commit de correções: `546c4cc7eb6d4324d1cf6e3c391b49732cb09ae8`. Oito registros com correções de exibição e notas de fontes primárias; detalhes em `CLINICAL-REFERENCE-REVIEW.md`.
- Commit de mídia: `69c0a92` — upload privado GCS, MP4, WebVTT, autorização e assinatura temporária; implementado e testado localmente, **não incluído no pacote de produção das correções**. Detalhes em `MEDIA-IMPLEMENTATION.md`.
- A fonte importada, XLSX, motor PCR, schema do banco, autenticação e billing preexistentes permanecem intactos, conforme `preserved-modules.json`.

## Evidências

- 209 testes unitários aprovados; 5 de backend aprovados.
- 14 cenários Mentory e 12 cenários clínicos aprovados (desktop/mobile).
- Build local, typecheck e lint aprovados.
- Oito capturas e verificações de overflow/acessibilidade com zero violações detectadas pelo Axe.
- Reprodução MP4 e legendas testadas com fixture sintética local; não equivale a validação externa do GCS.
- Uma rodada mobile foi interrompida por disputa local da pasta `.next`; outra encontrou configuração local de rate limit incompatível com `next start`. A execução final sequencial, com fallback em memória somente no processo E2E, passou. Nenhuma proteção de produção foi reduzida.

## Bloqueios reais

1. A revisão automática rejeitou configurar o bucket de arquivos atual para mídia, por risco de misturar dados e ausência de autorização específica. Nenhuma configuração foi aplicada. Foi solicitada autorização para bucket privado exclusivo, ainda pendente nesta etapa. A identidade GCP operacional precisa reautenticar antes de configurar infraestrutura; a conta ativa diferente não foi usada para modificar recursos.
2. A pesquisa não equivale a revisão clínica integral dos 69 medicamentos. As notas corrigem erros identificáveis, mas não escolhem arbitrariamente concentração institucional, indicação ou dose para gerar saídas de uma nova calculadora. As fontes ambíguas continuam sem execução clínica até protocolo inequívoco.
3. Provedor de pagamento permanece pendente, conforme instrução explícita. Não foram alteradas regras de cobrança PCR nem criados contratos fictícios.

## Restauração

Antes das correções, o deployment estável com aprovação operacional é `dpl_4BKfUpoEWfnEW82GqGVF53DgngRM`. Rollback de aplicação:

```sh
vercel rollback dpl_4BKfUpoEWfnEW82GqGVF53DgngRM --scope luciano-terres-projects --yes
```

Não há migration nesta etapa. Nenhuma modificação destrutiva de banco. Não houve push ou merge.
