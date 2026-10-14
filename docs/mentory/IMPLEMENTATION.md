# iatron.PED Mentory — implementação local para aprovação

## Escopo e integração

Especificação lida integralmente: `mentory/docs/PROMPT_CODEX.md`. Referência visual: `mentory/public/images/conceito-ux-v1.png`. Foram reaproveitados a composição da landing, hierarquia de cards, navegação lateral/inferior e padrões de módulo/player do frontend entregue. O store em localStorage e os usuários fictícios do protótipo não fazem parte do produto integrado. Não foram reutilizadas fotografias, pessoas, credenciais profissionais, depoimentos ou números de alunos do conceito.

Stack real: Next.js 15.5.18 App Router, React 18.3.1, TypeScript 5.5.2, Prisma 6.19.3/PostgreSQL, NextAuth 5 beta 31 e lucide-react. O backend FastAPI clínico permanece separado e sem alterações. Não há novas dependências de runtime. O CSS está restrito ao contêiner `.mentory`; os tokens e componentes V3 existentes permanecem intactos.

Branch de trabalho: `feat/clinical-resources`; base Git: `6dbd7a1ec2f4879700be697a704c223f394d22b6`. Havia alterações locais clínicas e de documentação anteriores à tarefa. Elas foram preservadas. Nenhum commit, push, merge, mudança em infraestrutura externa ou deploy foi executado nesta entrega.

## Rotas e funcionalidades

| Rota | Comportamento |
| --- | --- |
| `/mentory` | Landing pública, investimento e disponibilidade comercial real |
| `/mentory/login` | Formulário de autenticação existente, com destino fixo no Mentory |
| `/mentory/aprender` | Progresso calculado no servidor, continuidade e módulos publicados |
| `/mentory/modulos` | Lista ordenada de módulos e aulas publicadas |
| `/mentory/aprender/[id]` | Sala de aula, materiais, conclusão e posição persistente; preview editorial autorizada |
| `/mentory/materiais` | Consulta a materiais com acesso premium no servidor |
| `/mentory/assinatura` | Contrato próprio, preço de renovação registrado, vigência e CTA bloqueado enquanto pendente |
| `/mentory/admin` | Dashboard e auditoria editorial |
| `/mentory/admin/conteudo` | CRUD de módulos, aulas e materiais; ordem, preview, revisão, publicar/retirar |
| `/mentory/admin/alunos` | Pesquisa, filtro, paginação de alunos e gestão explícita de permissões |
| `/mentory/admin/assinaturas` | Pesquisa, filtro e paginação de contratos, datas e preço contratual |
| `/mentory/termos`, `/mentory/privacidade` | Avisos transparentes de implantação; **não** representam termos/política final homologados |
| `/api/mentory/*` | Autorização por sessão/recurso; mutações com mesma origem e limite por usuário persistente no banco |

O player usa um adaptador opcional para Cloudflare Stream e fica bloqueado até configuração e homologação. O backend verifica `requireSignedURLs` antes de emitir acesso temporário, limitado a cinco minutos ou ao vencimento da assinatura. O provedor entrega os controles e legendas disponíveis. A posição é salva explicitamente pelo aluno e reutilizada ao abrir o player; não há telemetria automática de visualização ou alegação de vídeo assistido. A marcação de conclusão é autodeclarada.

Referência técnica do adaptador: [Cloudflare — Secure your Stream](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/). Nenhuma conta Cloudflare foi criada, contratada ou conectada, e nenhuma reprodução externa real foi homologada.

## Dados, acesso e segurança

A migration aditiva cria as entidades especificadas com FKs e índices, além de permissões, ativos privados e buckets de rate limit. O vínculo composto matrícula/assinatura/usuário impede associação de uma matrícula ao contrato de outra conta. Progresso tem chave composta usuário/aula. As datas contratuais são `timestamptz`, armazenadas como instantes UTC e apresentadas em Brasília. O cálculo de seis meses de calendário UTC limita dias inexistentes ao último dia do mês de destino. O preço inicial é `350000` centavos BRL. A cotação de renovação lê o valor e a versão de termos do contrato, não o preço atual de catálogo.

Permissões Mentory não são herdadas de `User.role=ADMIN`, licença PCR ou plano comercial existente:

- `mentory_student`: precisa também de matrícula e assinatura vigentes para ativos e progresso.
- `mentory_editor`: prepara conteúdo e usa preview; não publica, homologa, gerencia roles ou vê dados comerciais/alunos.
- `mentory_admin`: gestão completa do Mentory; publicação continua sujeita ao gate operacional e revisão por aula.

As páginas e APIs fazem verificações no servidor. Identificadores de usuário enviados para acessar progresso/assinatura de terceiros são recusados; as consultas usam a identidade da sessão. URLs de PDF são assinadas por recurso, usuário, finalidade e expiração. O download revalida sessão, matrícula, vigência e publicação; outro aluno ou assinatura expirada não reutiliza o link. Respostas privadas têm `no-store`. As ações administrativas geram auditoria sem corpo de aulas, documentos, senhas ou tokens.

PDFs e slides exportados em PDF (até 3 MB) são armazenados de forma privada em PostgreSQL, fora de `/public`, reutilizando a persistência existente e evitando introduzir um bucket não autorizado. Há checksum, MIME, tamanho, assinatura básica e recusa de marcadores de conteúdo ativo. Download como attachment com `nosniff` e CSP restritiva. Isso **não equivale a um antivírus**: homologar varredura documental e política operacional antes de ingestão em escala. A decisão por armazenamento em banco exige revisar capacidade, backup e retenção antes de produção.

Textos são renderizados como texto React, sem `dangerouslySetInnerHTML`, HTML ou Markdown executável. IDs de vídeo aceitam somente identificadores, não URLs arbitrárias. Não há fetch de links fornecidos pelo aluno/editor.

Alterar aula ou material invalida a revisão e retira a aula de publicação. A reordenação valida a lista completa e ocorre em transação com lock editorial, evitando uma ordem parcial concorrente. Publicação exige administrador, referência de revisão da versão atual e `MENTORY_PUBLICATION_APPROVAL` no servidor. As fixtures usam uma autorização local explicitamente sintética para testar o fluxo, sem equivalência a homologação médica.

## Operação e gates antes da produção

1. Aprovar visualmente as evidências e revisar código/migration. Não publicar o pacote do protótipo como aplicação independente.
2. Registrar os responsáveis por Mentory. Bootstrap de role é explícito via `scripts/mentory-grant-role.ts`, usuário existente, referência da autorização e flag `--confirm-explicit-authorization`; o script não foi executado em produção.
3. Revisar conteúdo real pelo médico e registrar referência por aula. Não usar a homologação do PCR ou das interfaces V3 como revisão dos novos conteúdos.
4. Escolher/homologar provedor de vídeo. O adaptador opcional requer `MENTORY_STREAM_APPROVED=true`, `MENTORY_STREAM_ACCOUNT_ID`, `MENTORY_STREAM_API_TOKEN`, `MENTORY_STREAM_CUSTOMER_CODE`. Segredos somente no servidor. Revisar domínio permitido, legendas, revogação e comportamento de expiração no provedor real. URLs de streaming são credenciais temporárias: proteção de acesso não é DRM.
5. Aprovar gateway, termos, renovação manual/automática, cancelamento/reembolso, parcelamento/impostos, elegibilidade e emissão fiscal. O adaptador de checkout atual recusa toda cobrança com HTTP 423; nenhuma variável ativa pagamentos. Após decisões, será necessária implementação específica e homologação do gateway/webhooks/idempotência, sem reutilizar indevidamente a cobrança do PCR.
6. Homologar termos próprios, política de privacidade, controlador, canal do titular, retenção e atendimento LGPD. Os avisos disponíveis descrevem a implantação e suas pendências, sem inventar uma política aprovada.
7. Revisar backup/restore e capacidade do banco/arquivos. Aplicar migration somente após backup verificado e aprovação do ambiente. Homologar monitoração e alertas usando a infraestrutura existente.
8. Realizar aceitação com contas reais de teste autorizadas, conteúdo revisado, vídeos privados, legendas, downloads e vencimento. A entrega atual usa somente fixtures locais.

Não foram criados pagamentos falsos. Os contratos sintéticos existem exclusivamente no banco de teste isolado e são identificados por `DEMONSTRACAO-SEM-VALIDADE-COMERCIAL`; não simulam sucesso de gateway nem devem ser migrados.

## Reprodução local

Usar Node 24 ARM64, dependências do lockfile e banco PostgreSQL descartável. Gerar Prisma, aplicar a migration local, configurar a autenticação existente e iniciar frontend/API locais. O script `mentory-seed-test.ts` exige `IATRON_ENV=e2e`, host localhost e banco com nome contendo `redesign`. Não usá-lo como seed de produção.

- Unitários: `node --test --import tsx tests/*.test.ts`.
- Integração/navegador: `playwright test mentory.spec.ts --project=chromium`.
- Para testar publicação com fixtures: somente no ambiente local, `MENTORY_PUBLICATION_APPROVAL=LOCAL-E2E-SYNTHETIC-ONLY`.
- Visual: `MENTORY_REVIEW_DIR=<destino> node scripts/mentory-review.mjs`, com Playwright/Chrome e axe disponíveis.
- Backend: `PYTHONPATH=backend python3 -m pytest backend/app/tests -q`.

O ambiente de verificação usa uma cópia local em `/tmp/iatron-redesign-verified`, devido a arquivos não materializados pelo iCloud na árvore original. A entrega contém manifesto para verificar os mesmos fontes usados nos testes. Arquivos `.env`, credenciais e dependências não entram no pacote.

## Rollback e restauração

A primeira opção de rollback de aplicação é retornar ao artefato anterior mantendo as novas tabelas inativas; isso preserva dados. Não misturar rollback do Mentory com o rollback dos módulos clínicos anteriores.

Antes de aplicar a migration em qualquer ambiente compartilhado: produzir backup consistente do PostgreSQL (incluindo os ativos privados), registrar referência/hora, criptografar e verificar restore em ambiente isolado. Nenhum backup de produção foi acessado nesta tarefa.

`rollback.sql` remove exclusivamente as tabelas/tipos Mentory, de forma transacional. É destrutivo para os dados Mentory e exige backup/restauração aprovados. O teste em cópia descartável verificou remoção, preservação dos contadores de User/Subscription/License e reaplicação da migration. Em produção, não executar esse SQL automaticamente: preferir rollback de código; decidir retenção/restauração e reconciliar `_prisma_migrations` com o procedimento operacional do projeto antes de uma nova aplicação.

## Evidências e limites

Consultar `VALIDATION.md`, `logs/`, `visual-checks.json`, `screenshots/`, `source-manifest.json`, `protected-after.json` e `review.html`. Testes automatizados não são homologação clínica, comercial, de privacidade ou certificação integral de acessibilidade. Screenshots de contas, módulos, aulas e contratos são demonstrativos e não representam conteúdo/receita reais.
