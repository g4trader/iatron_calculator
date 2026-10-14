# Verificação E2E — 16/09/2026

## Ambiente e escopo

Aplicação testada a partir do commit publicado `6a286c1da9c50f9f4ce705c782a62b38739aa46c`, baixado do GitHub em uma cópia temporária. Os testes atualizados deste repositório foram aplicados à cópia, sem modificar o código da aplicação. A cópia evita arquivos locais não materializados pelo iCloud.

Playwright com Chrome instalado, perfis Desktop Chrome e Pixel 5 (emulação, não aparelho físico), Node 22.23.1 e PostgreSQL 14.19 local. As 18 migrations Prisma foram aplicadas a um banco exclusivo de testes. Usuários e assinaturas são sintéticos. O frontend roda em modo `next dev`; não é uma execução do build Vercel.

A API de cálculo configurada é o Cloud Run do projeto `stg1-508713`. Rate limit usa memória e armazenamento administrativo usa diretório local nesta suíte. Nenhum seed ou migration foi executado no Supabase de produção.

## Cenários

Cada perfil executa 18 cenários:

- Acesso individual sem assinatura, com assinatura ativa e com pagamento pendente.
- Retorno de checkout aguardando confirmação e acesso institucional com/sem licença.
- Invalidação da sessão anterior, logout entre abas, bloqueio premium e bloqueio do admin para usuário comum.
- Login pelo formulário, cálculo PCR com entrada sintética de 15 kg, conferência de resposta e resultado exibido, validação de peso zero.
- Recusa de senha incorreta.
- Abertura autenticada das páginas `/admin`, `/admin/system`, `/admin/operations`, `/admin/exports`, `/admin/archive` e `/admin/retention`.

## Resultado

**36 cenários distintos aprovados após ajustes na suíte: 18 desktop + 18 mobile.**

| Execução | Aprovados | Falhas | Tempo |
| --- | ---: | ---: | --- |
| Desktop, suíte após ajustes | 18 | 0 | 1 min 47 s |
| Mobile, primeira suíte completa | 17 | 1 | 2 min 41 s |
| Mobile, logout corrigido e reexecutado | 1 | 0 | 34 s |

A falha mobile era o teste tentando clicar em “Sair” sem abrir o menu. Uma primeira correção ainda selecionava o texto oculto para leitores de tela; a correção final clica no controle `summary` visível. A repetição isolada aprovou logout e revogação da sessão na outra aba. Não houve uma segunda execução completa dos 18 testes mobile após esse ajuste; os demais 17 passaram na execução completa.

No desktop, as tentativas anteriores encontraram expectativas antigas de URLs/títulos e preenchimento antes da hidratação no teste novo; a execução completa posterior aprovou os 18 cenários. Nenhum teste foi ignorado e não restou falha funcional reproduzida no escopo exercitado.

Evidências locais em `frontend/test-results/e2e-2026-09-16/`: `summary.json`, resultados JSON de cada execução, `production-smoke.json`, logs e capturas/traces das tentativas com falha. O diretório de resultados é ignorado pelo Git. Os ambientes herdados foram removidos dos relatórios JSON para não armazenar variáveis de ambiente. O PostgreSQL temporário foi encerrado e o arquivo temporário de variáveis/segredo de autenticação foi removido após os testes.

## Verificação do site publicado

Em `https://ped.iatron.com.br`, a rodada registrada em `production-smoke.json` passou em 10 verificações: página inicial, login, health do frontend, proteção anônima de quatro rotas, health do Cloud Run, cálculo direto na API e cálculo pelo frontend. A chamada final pelo frontend retornou `x-pcr-calculation-source: backend`.

Uma chamada anterior retornou HTTP 200 com `local-fallback`; as seguintes usaram o backend. O proxy tem contingência local e timeout de 5 segundos. A causa dessa ocorrência não foi comprovada: a consulta de logs GCP foi impedida por sessão expirada. Não confundir resposta 200 com prova de que toda chamada alcançou o Cloud Run.

## Ajustes na suíte

Foram corrigidas expectativas antigas de títulos e redirecionamentos (`/dashboard` → `/dashboard/pcr`, login com `callbackUrl`). O novo teste aguarda a data inicializada pelo efeito do cliente antes de preencher a calculadora, evitando preenchimento antes da hidratação. O teste de logout móvel passou a abrir o controle visível do menu antes de clicar em “Sair”. Foi incluído um usuário administrativo no seed de testes e oito novos cenários. Código funcional e deployment não foram alterados por esta verificação.

## Limites e reprodução

Estes testes não comprovam pagamento real Stripe, entrega de emails, recuperação de senha por email, login social, todas as calculadoras, impressão/PDF, operações administrativas de escrita ou um fluxo autenticado no domínio de produção. As páginas administrativas foram abertas, mas seus jobs/exportações/retenção não foram executados. O resultado do cálculo é uma regressão técnica, não validação clínica abrangente.

Para repetir: usar Node 22 ou compatível, Chrome, dependências instaladas, banco PostgreSQL descartável, migrations e `.env.e2e.local` com `IATRON_ENV=e2e`, URLs locais e segredo próprio de teste. Conferir que `DATABASE_URL` e `DIRECT_URL` apontam ao banco descartável antes do seed automático. Não usar credenciais/banco de produção.

Executar os perfis separadamente, encerrando o servidor entre eles, para evitar que o rate limit de login acumule tentativas dos mesmos usuários entre projetos:

```bash
cd frontend
npm run e2e:check
npx playwright test --project=chromium --timeout=60000
npx playwright test --project=mobile-chrome --timeout=60000
```

O timeout de 60 segundos acomoda compilação sob demanda no ambiente local. Não desabilitamos a autenticação, a validação de sessão ou os bloqueios de acesso.
