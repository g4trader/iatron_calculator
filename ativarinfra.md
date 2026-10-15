# Retomar infraestrutura — iatron.PED

Última atualização: **14/10/2026**. A aplicação está usando a infraestrutura migrada para **stg1-508713**. Leia este arquivo primeiro ao voltar ao projeto.

## Contas e recursos atuais

| Serviço | Conta / recurso |
| --- | --- |
| GCP | `operacional@southmedia.com.br` |
| Projeto GCP / número | `stg1-508713` / `832112125521`, billing ativo confirmado |
| Cloud Run | `iatron-calculator-api`, região `us-central1` |
| API pública | `https://iatron-calculator-api-832112125521.us-central1.run.app` |
| Revisão Cloud Run validada | `iatron-calculator-api-00001-wjd` |
| Runtime API | `iatron-api-runtime@stg1-508713.iam.gserviceaccount.com` |
| Identidade GCP usada pela Vercel | `iatron-vercel-admin@stg1-508713.iam.gserviceaccount.com` |
| GCS privado | `iatron-admin-archives-stg1-508713`, região `southamerica-east1` |
| Firestore | `(default)`, Native, `southamerica-east1`; coleção `iatronRateLimits` |
| Vercel | `lucianoterresrosa@gmail.com`, usuário CLI `lucianoterresrosa-6245` |
| Projeto Vercel | `https://vercel.com/luciano-terres-projects/frontend` |
| Vercel project ID | `prj_YX76LlKY69d14VDmpc8w5RjuzFeo` |
| Vercel team ID | `team_kUYX6H6pwY37noInqpTdByP0` |
| Site | `https://ped.iatron.com.br` |
| Alias adicional | `https://frontend-two-lovat-72.vercel.app` |
| Deployment Vercel validado | `dpl_BGHSxM32hzfQ5g8U9eZZa7nbBaD9` — READY |
| GitHub | `g4trader.news@gmail.com`, usuário `g4trader`, acesso admin confirmado |
| Repositório / branch | `https://github.com/g4trader/iatron_calculator`, `main` |
| Supabase | `g4trader.news@gmail.com`; projeto específico não consultado no painel nesta migração |

Vercel: **Root Directory `frontend`**, install `npm ci`, build `npm run build`, output padrão Next.js, Node `24.x`. O source do deploy Git é o repositório inteiro; configurar a raiz do repo como Root Directory causou `No Next.js version detected`. A configuração antiga de `vercel.json` na raiz não deve ser usada como referência para substituir esses valores.

## Estado validado

- Site e login HTTP 200; admin sem sessão redireciona para login.
- Health frontend: `ok=true`, banco conectado e autenticação configurada.
- API nova saudável, CORS funcional, entrada inválida rejeitada.
- Cálculo via site usa `x-pcr-calculation-source=backend`; resultado comparado com o motor local.
- Firestore novo recebe o contador de rate limiting gerado pela aplicação em produção.
- Identidade GCP do frontend passou em escrita/leitura/exclusão no bucket privado e Firestore.
- 5 testes backend passaram; build frontend de produção passou.
- Chave GCP instalada na Vercel após autorização explícita. Cópias temporárias de chave/rollback removidas.

A migração não alterou Supabase, Stripe, usuários ou dados comerciais. E2E de compra, login real e operações admin de exportação/restauração não foram executados nesta sessão.

## Reconectar as ferramentas

Na raiz local do repositório:

```bash
git remote -v
git status --short
gh auth status
gh api repos/g4trader/iatron_calculator --jq '{full_name,permissions}'
gcloud auth list
vercel whoami
vercel teams ls
```

Se precisar autenticar novamente:

```bash
gcloud auth login operacional@southmedia.com.br --no-activate
gh auth switch --hostname github.com --user g4trader
vercel login
```

No login Vercel, selecionar `lucianoterresrosa@gmail.com`; o CLI pode usar código de dispositivo. Na sessão de migração, o gcloud exigiu reautenticação da conta Southmedia. Erros do sandbox/keychain não significam necessariamente token expirado; revalidar com as permissões de execução adequadas.

Usar sempre projeto e conta explícitos nos comandos GCP para evitar atingir outro produto:

```bash
gcloud billing projects describe stg1-508713 \
  --account=operacional@southmedia.com.br --format='json(projectId,billingEnabled)'
gcloud run services describe iatron-calculator-api \
  --project=stg1-508713 --account=operacional@southmedia.com.br \
  --region=us-central1 --format='json(status.url,status.conditions,status.latestReadyRevisionName)'
curl --fail-with-body --max-time 30 https://iatron-calculator-api-832112125521.us-central1.run.app/health
curl --fail-with-body --max-time 30 https://ped.iatron.com.br/api/health
```

Em `frontend/`:

```bash
vercel project inspect frontend --scope luciano-terres-projects
vercel env ls production --scope luciano-terres-projects
```

Não criar outro projeto `frontend` se a conta atual não enxergar o original. Supabase deve ser acessado com `g4trader.news@gmail.com`; identificar o projeto correto antes de obter connection strings.

## Variáveis e desenvolvimento local

Nomes e opções: [frontend/.env.example](frontend/.env.example) e [backend/.env.example](backend/.env.example). Segredos ficam no provedor ou em arquivo local ignorado pelo Git, nunca neste documento.

Produção Vercel usa API nova, `GCP_PROJECT_ID=stg1-508713`, identidade `iatron-vercel-admin`, bucket novo, `ARCHIVE_STORAGE_PROVIDER=gcs`, prefixo `iatron-admin-archives`, `RATE_LIMIT_PROVIDER=firestore` e database `(default)`.

As cópias locais antigas `.env.production.local`/`.env.vercel.production` têm valores essenciais vazios e URLs antigas; não representam a configuração remota atual. `.env.local` contém apenas a API local. Não sobrescrever configuração existente com `env pull` e não usar produção para seed/E2E.

Backend em um terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Frontend, após configurar `.env.local` com banco isolado, autenticação e URLs locais:

```bash
cd frontend
npm ci
node --env-file=.env.local scripts/check-env.mjs
npm run dev
```

O script `env:check` não carrega `.env.local` sozinho. Scripts operacionais que usam `loadOperationalEnv` leem `.env.e2e.local` antes de `.env.local` e preservam variáveis já exportadas: conferir essas fontes antes de migrations/seed. Nunca usar `migrate reset` em produção.

## Deploy e CI/CD

Backend: seguir os comandos e recursos de [MIGRACAO_GCP.md](MIGRACAO_GCP.md). O acesso público usa `--no-invoker-iam-check`; o binding `allUsers` é bloqueado pela política de domínio da organização. Não alterar a política organizacional para contornar isso.

GitHub environment `Production` contém WIF/deploy e `CORS_ORIGINS` do destino. Provider restrito a `g4trader/iatron_calculator`, ID `1249548644`, branch `main`. Workflow atualizado em `main` no commit `4561bd384ae0d0d2daea00a5f0688a09b74d786f`.

Pipeline não foi executado após a migração. Última execução anterior observada foi bloqueada por billing GitHub; configuração de WIF/secrets não comprova execução bem-sucedida. Staging ainda exige environment/serviço próprios.

Migrations são um passo separado do build, via `.github/workflows/prisma-migrate-deploy.yml` ou `npm run prisma:deploy`, com ambiente e banco confirmados. Produção exige `APPLY PRODUCTION MIGRATIONS` no workflow.

## Pendências e histórico importante

- Dois objetos antigos de smoke/debug, total 47 bytes, ficaram no bucket `iatron-admin-archives-automatizar-452311`. Leitura bloqueada por billing encerrado da origem. Nenhum objeto foi listado sob o prefixo ativo de arquivos da aplicação; os dois objetos não foram copiados nem apagados.
- A coleção antiga de rate limit tinha 12 contadores expirados; não foram copiados. O destino iniciou contadores novos.
- `automatizar-452311` é origem histórica, compartilhada com outros produtos. Não excluir seus recursos automaticamente.
- `stg1-508620` foi descartado por quota de billing. Não é o destino atual.
- `app.iatron.com.br` é domínio de planejamento antigo; usar `ped.iatron.com.br`.
- URL de API anterior efetivamente lida na Vercel: `https://iatron-calculator-api-629034331372.us-central1.run.app`. URLs com `609095880025` vieram de cópias locais antigas. Não usá-las automaticamente para rollback.
- Deployment anterior permanece disponível; detalhes de recuperação e limites em [MIGRACAO_GCP.md](MIGRACAO_GCP.md).

Ao encerrar uma próxima sessão, atualizar data, deploys/revisões, verificações e pendências deste arquivo.

## Testes E2E — 16/09/2026

Relatório de escopo, resultados, limitações e reprodução em [RELATORIO_E2E.md](RELATORIO_E2E.md). A suíte usa banco descartável e dados sintéticos; não executar seu seed contra o Supabase de produção. A verificação pública inclui health, proteção de rotas e comunicação com o Cloud Run atual.

## Reconexão — 14/10/2026

- GitHub CLI reconectado como `g4trader`, com acesso admin confirmado ao repositório.
- Health público do Cloud Run retornou `status=ok`; frontend retornou `ok=true`, banco conectado e autenticação configurada. Provedores Google/Facebook constam como não configurados.
- GCP: reautenticação pelo navegador concluída com `operacional@southmedia.com.br`; acesso ao projeto `stg1-508713` validado, billing ativo e Cloud Run Ready na revisão `iatron-calculator-api-00001-wjd`.
- Vercel: login por dispositivo concluído como `lucianoterresrosa-6245`; acesso ao projeto `prj_YX76LlKY69d14VDmpc8w5RjuzFeo` no scope `luciano-terres-projects` confirmado.
- Deployment de produção `dpl_BGHSxM32hzfQ5g8U9eZZa7nbBaD9` revalidado como Ready, associado a `ped.iatron.com.br`. Root Directory `frontend`, Node `24.x`, install `npm ci` e build `npm run build` confirmados.
- GitHub, GCP e Vercel reconectados. Nenhum deploy, migration ou alteração de configuração de produção realizado.


## Publicação V3 — 14/10/2026

- UX/UI V3 aprovada, sem novos refinamentos. Homologação clínica declarada pelo usuário: Luciano Terres, 14/10/2026.
- Usuário dispensou expressamente staging e autorizou publicação direta; assumiu os testes autenticados em produção.
- Commit local publicado: `6dbd7a1ec2f4879700be697a704c223f394d22b6`, branch `feat/iatron-ped-ux-redesign`, acumulando V1/V2/V3 sobre `6a286c1`. Sem push/merge.
- Deployment `dpl_9WrRqyTpse91ZSRSvNyfgf9sdrDx`, Ready em 14/10/2026 às 19:15:53 de Brasília. URL imutável `https://frontend-lnrmkoau4-luciano-terres-projects.vercel.app`; alias principal `https://ped.iatron.com.br` confirmado.
- Build local/remoto, typecheck, lint, 185 testes frontend, 5 backend e 36 E2E passaram. Smoke público: 12 verificações aprovadas, incluindo health, cálculo sintético idêntico à resposta auditada V3, entrada inválida, login público, proteção de rotas e landing responsiva em quatro larguras.
- Backend, banco, migrations, variáveis, autenticação e pagamentos não foram alterados. `AUTH_URL`/`NEXTAUTH_URL` preservam o alias adicional existente.
- Login efetivo, área autenticada, medicamentos/alertas e impressão no domínio ficam para conferência do usuário. Nenhum dado real de paciente utilizado.
- Rollback pronto para `dpl_BGHSxM32hzfQ5g8U9eZZa7nbBaD9`; não necessário durante os smoke tests. Relatório, logs, manifesto, screenshots e comandos: [docs/publicacao-v3/REPORT.md](docs/publicacao-v3/REPORT.md) e [rollback](docs/publicacao-v3/ROLLBACK.md).


## Mentory — mídia privada publicada em 15/10/2026

- Conta GCP `operacional@southmedia.com.br` reautenticada. Bucket exclusivo autorizado e criado: `iatron-mentory-media-stg1-508713`, Standard, `southamerica-east1`, acesso uniforme e bloqueio público enforced. Bucket de arquivos existente preservado.
- Identidade Vercel existente com `roles/storage.objectAdmin` no novo bucket. `MENTORY_VIDEO_BUCKET` configurada e `MENTORY_STREAM_APPROVED=true`; sem novas chaves.
- Commit publicado `634204f2035da3d9b3f753b6b3594b4bf379fbc2`, branch `feat/clinical-resources`, deployment `dpl_HrNmYiua1RMWHi63xgrriYMenZQ5`, domínio `ped.iatron.com.br`, promoção em 15/10/2026 às 14:42:52 de Brasília.
- Preflight real de upload, assinatura, Range, CORS, bloqueio anônimo e cleanup aprovado; build Ready; 30 smoke checks aprovados. Sem migration, push ou merge. Testes autenticados em produção seguem com o usuário.
- Admin Mentory: `aristoteles.pires@hmv.org.br`, senha existente. Cobranças reais aguardam provedor; novos cálculos com protocolos ainda ambíguos continuam bloqueados.
- Relatório/evidências: [docs/mentory-media-publicacao-2026-10-15/REPORT.md](docs/mentory-media-publicacao-2026-10-15/REPORT.md). Rollback: `dpl_6DnonYnupReXhccZpHg3pVgjq1e3`.
