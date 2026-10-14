# Validação — Mentory local

Resultado: implementação disponível para revisão; produção, conteúdo clínico real, streaming real e cobranças não homologados nesta entrega.

| Verificação | Resultado final | Evidência |
| --- | --- | --- |
| Build Next.js/Prisma | Passou | `logs/build.log` |
| TypeScript `tsc --noEmit` | Passou, exit 0 | `logs/typecheck.log` |
| Lint | Sem avisos/erros ESLint | `logs/lint.log` |
| Frontend unitário | 197 passaram, incluindo 5 novos testes de domínio Mentory | `logs/frontend-tests.log` |
| Backend clínico | 5 passaram | `logs/backend-tests.log` |
| Importador clínico anterior | 11 passaram | `logs/clinical-import-tests.log` |
| Mentory E2E/integração | 12 passaram: 6 desktop + 6 mobile | `logs/mentory-e2e-final.log` |
| Regressão clínica/comercial/sessão | 32 passaram: 16 desktop + 16 mobile | `logs/regression-chromium-clinical-commercial-security.log`, `logs/regression-mobile-chrome-clinical-commercial-security.log` |
| Regressão login/PCR/admin existente | 16 passaram: 8 desktop + 8 mobile | `logs/regression-chromium-system.log`, `logs/regression-mobile-chrome-system.log` |
| Migration e rollback | Aplicação, remoção em clone descartável e reaplicação passaram | `logs/migration.log`, `logs/rollback.log` |
| Gates, FK, rate limit, teclado e estados | Passaram | `gates-checks.json`, `logs/gates.log` |
| Responsividade/axe | 55 verificações, zero overflow, zero violações automáticas, zero alvos verificados abaixo de 44 px | `visual-checks.json` |
| Screenshots | 55 telas nas 5 larguras + 3 estados/interações = 58 | `screenshots/`, `review.html` |
| Preservação | 26 arquivos protegidos e 35 fontes do módulo clínico anterior idênticos; schema anterior preservado com adições Mentory | `protected-after.json`, `clinical-module-integrity.json`, `schema-integrity.json` |
| Patch | Aplicado em cópia isolada V3 + recursos clínicos anteriores; 29 hashes conferidos | `patch-verification.json`, `source-manifest.json` |

## Cobertura de segurança e comportamento

- Sem sessão: painel redireciona ao login e APIs privadas não editam nem consultam assinatura.
- Aluno: não acessa admin; não publica nem concede roles; origem externa e tentativa de gravar progresso para outro usuário são recusadas.
- A/B: assinatura/progresso só consultam o titular da sessão; PDF assinado para A é recusado para B; matrícula com contrato de outro usuário falha na FK composta.
- Expiração: vídeo, material, escrita de progresso e URL de PDF emitida anteriormente são bloqueados; progresso já salvo é preservado.
- Admin PCR: não recebe permissão Mentory automaticamente.
- Editor: prepara conteúdo e preview, sem publicar, registrar revisão, conceder roles ou consultar alunos/assinaturas.
- Conteúdo: CRUD persistente, publicação exige revisão, reordenação exige conjunto completo, edição de material invalida revisão/publicação, texto com tags é exibido literalmente.
- Upload/download: ativo privado, URL curta assinada, recusa de assinatura/expiração adulterada e revalidação de autorização.
- Publicação padrão fechada: HTTP 423 mesmo para admin enquanto não há autorização operacional.
- Comercial: checkout sempre HTTP 423; preço inicial em centavos, cotação de renovação preserva contrato, sem renovação automática presumida.
- Limite de requisições aplicado no banco, teste retorna HTTP 429 sem enfraquecer autenticação existente.

Os testes reais do adaptador de streaming e gateway ainda dependem da escolha/homologação dos provedores. A fixture de PDF usada no teste HTTP comprova transporte e autorização de bytes; não representa um material clínico homologado ou validação antivírus.

## Revisão visual

Larguras verificadas: **360, 390, 768, 1024 e 1440 px**. Telas: landing, login, dashboard, módulos, player, materiais, assinatura, admin dashboard, conteúdo, alunos e assinaturas. Estados adicionais: vazio, expirado e formulário administrativo. Inspeção manual das capturas confirmou hierarquia, legibilidade do player e composição desktop/mobile.

Foram preservadas a paleta marinho/azul clínico, navegação lateral desktop e inferior mobile, organização em cards e continuidade entre módulos/aulas/materiais do protótipo. O conceito com pessoas e números ilustrativos foi substituído por elementos gráficos e dados sintéticos explicitamente marcados. Os badges e textos auxiliares tiveram contraste ajustado; o link de gestão recebeu sublinhado e o botão do player recebeu cor explícita.

Axe automatizado sem violações **não** certifica integralmente WCAG AA. O player externo/legendas exige revisão quando houver provedor e conteúdo reais. Foco visível foi verificado no formulário via teclado. Controles de ação e navegação inferior avaliados têm altura mínima de 44 px; os links textuais são avaliados conforme seu contexto, não como botões.

## Ocorrências resolvidas durante a validação

- A origem interna normalizada do Next.js diferia do host recebido no ambiente local. A checagem CSRF foi corrigida para validar a origem esperada do host, com HTTPS fora do localhost de teste.
- Capturas/seletor de texto encontraram árvores transitórias ocultas durante streaming do App Router. A espera visual e o escopo semântico do seletor foram corrigidos; o E2E final passou nos dois projetos.
- Foram corrigidos contraste de textos auxiliares/badges, distinção visual de um link e texto do botão do player.
- Uma execução agrupada dos testes antigos excedeu o rate limit de login. As suítes foram repetidas com reinicialização entre grupos, sem alterar a proteção; os 48 cenários finais passaram. Logs iniciais são mantidos para rastreabilidade e não representam falhas pendentes.

## Limites e aprovação

Todas as verificações são locais, com contas e conteúdo sintéticos. Não houve acesso a dados de pacientes, deploy, transação financeira, criação de infraestrutura, commit, push ou merge. As pendências comerciais, clínicas, de privacidade, operação e provedores estão em `IMPLEMENTATION.md`. Os testes não substituem essas homologações.
