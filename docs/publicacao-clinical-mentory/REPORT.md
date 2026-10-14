# Publicação — recursos clínicos e Mentory

Status: **PUBLICADO**, smoke automático **PASS** (27 verificações), sem erros JavaScript detectados.

- Ambiente: produção, https://ped.iatron.com.br e https://ped.iatron.com.br/mentory.
- Branch: `feat/clinical-resources`.
- Commit publicado: `b7e217ccc969e1f7a4e4239dac1dbb99c863653f`.
- Base V3 preservada: `6dbd7a1ec2f4879700be697a704c223f394d22b6`.
- Deployment: `dpl_CcxoKpziCAXdYKnenhLezLJA75Xe` (READY).
- Artefato: https://frontend-no0648zup-luciano-terres-projects.vercel.app.
- Promoção concluída e registrada localmente: 2026-10-14T20:20:48.294731-03:00 (Brasília).
- Smoke concluído: 2026-10-14T23:21:42.738Z (UTC).
- Sem push ou merge. Commits locais e deploy pela CLI estabelecida da Vercel.

## Escopo e integridade

Publicados biblioteca de medicamentos, consulta de infusão contínua e Mentory integrado (rotas, persistência, permissões, gestão, progresso e estrutura de assinaturas). A interface V3 e os cálculos PCR existentes foram preservados. Foram comparados 360 arquivos frontend com os blobs do commit; 299 arquivos de runtime enviados após exclusões de testes, seeds e ferramentas de revisão. Credenciais, arquivos temporários, protótipos independentes e evidências volumosas não foram publicados.

A única migration pendente era `20261015000100_mentory`. Aplicada em transação às 23:19:18 UTC: dez tabelas novas, sem seed nem alteração de linhas existentes. Fingerprint das colunas pré-existentes antes/depois: `b8a65fab7b9fb2cbf12791a8d54aa9595efb00eaf3ca22f8261f8e19663065a9`. A conexão de runtime confirmou as mesmas dez tabelas.

O endpoint direto Supabase não era acessível pelo build. Foi usada a conexão de sessão IPv4 do mesmo projeto, derivada e validada da configuração existente somente no processo de migration; variáveis persistentes não foram alteradas. Referência: https://supabase.com/docs/guides/database/prisma. Os primeiros deployments não foram promovidos. O backend GCP permaneceu na revisão existente, pois seu runtime não mudou.

## Validação

Antes da publicação: build, typecheck e lint aprovados; 197 testes frontend, 5 backend, 11 do importador, 60 E2E, 55 verificações visuais e rollback em clone local. Sete testes adicionais do controle de publicação passaram. Build remoto e migration passaram.

Em produção: saúde do frontend/banco/auth e backend; resultado PCR sintético idêntico à V3 auditada e ao motor local; entrada inválida rejeitada; landing V3, landing Mentory e ambos os logins em 390/1440 px sem overflow; oito rotas protegidas redirecionando para login; sete APIs Mentory recusando acesso/mutação anônimos. Oito screenshots em `production/screenshots/`. Inspeção visual desktop/mobile da landing Mentory concluída.

A primeira execução do smoke verificava a URL antes de terminar o redirecionamento assíncrono do Next. Confirmado o redirecionamento para login, o script passou a aguardar `waitForURL`; a repetição integral passou. Não houve correção na aplicação nem evidência de exposição do painel.

A URL imutável tem autenticação Vercel e não permitiu smoke anônimo antes da promoção. A revisão automática rejeitou a consulta/gravação de token de bypass por considerar o uso fora da autorização; nenhum token foi usado e a proteção foi preservada. A publicação direta seguiu a autorização expressa anterior do usuário, com smoke no domínio público após promoção.

## Limites e pendências operacionais

- Login com conta real, fluxos autenticados e impressão/PDF em produção serão conferidos pelo usuário, conforme sua instrução. Os E2E locais cobrem esses fluxos; não equivalem a homologação clínica.
- As 75 entradas dos novos recursos clínicos permanecem pendentes de revisão médica; cálculos dependentes desses dados estão bloqueados. A homologação anterior do PCR não foi estendida a esses dados.
- Publicação de conteúdo clínico Mentory e streaming permanecem bloqueados. Não foram criados conteúdos ou usuários sintéticos em produção.
- Cobranças reais continuam desabilitadas. Provedor, termos e homologação comercial permanecem pendentes.
- Nenhum usuário recebeu papel administrativo Mentory automaticamente. É necessária a designação explícita do responsável para provisionamento inicial seguro.
- O npm reportou avisos de dependências preexistentes; não houve atualização automática de pacotes fora do escopo.

## Rollback

Nenhuma falha crítica constatada; rollback não acionado. Restaurar o artefato V3, se necessário:

```sh
vercel rollback dpl_9WrRqyTpse91ZSRSvNyfgf9sdrDx --scope luciano-terres-projects --yes
```

Manter as tabelas Mentory aditivas; não apagar dados automaticamente. Plano detalhado em `PLAN.md`. Logs e resultados nesta pasta. Pacotes de revisão originais: `iatron-mentory-review.zip` e `iatron-clinical-resources-review.zip` na raiz; permanecem como evidências históricas locais.
