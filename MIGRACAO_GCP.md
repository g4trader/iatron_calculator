# Migração GCP do Iatron — stg1-508713

Atualizado em 15/09/2026. **Infraestrutura da aplicação migrada e validada em produção.** Cloud Run, Firestore e GCS usam o destino; dois objetos antigos de teste não puderam ser copiados por bloqueio de billing da origem.

## Recursos do destino verificados

| Recurso | Valor |
| --- | --- |
| Projeto / número | `stg1-508713` / `832112125521` |
| Conta operadora | `operacional@southmedia.com.br` |
| Billing | `billingEnabled=true`, confirmado via API |
| Cloud Run | `iatron-calculator-api`, `us-central1` |
| URL pública validada | `https://iatron-calculator-api-832112125521.us-central1.run.app` |
| URL canônica | `https://iatron-calculator-api-kvz7unmcta-uc.a.run.app` |
| Revisão | `iatron-calculator-api-00001-wjd` — 100% do tráfego |
| Cloud Build | `c0c8b081-f2a1-4e3b-8f54-fe1e77519e39` — SUCCESS |
| Imagem | `us-central1-docker.pkg.dev/stg1-508713/cloud-run-source-deploy/iatron-calculator-api@sha256:3fba5b124a9ed15eb2f97400a114eb8539759c6c0e1a67c919c2f0f4fdce3e50` |
| Runtime API | `iatron-api-runtime@stg1-508713.iam.gserviceaccount.com` |
| Identidade frontend | `iatron-vercel-admin@stg1-508713.iam.gserviceaccount.com` |
| GCS | `iatron-admin-archives-stg1-508713`, `southamerica-east1` |
| Firestore | `(default)`, Native, `southamerica-east1` |

Cloud Run: 1 CPU, 512 MiB, porta 8080, mínimo 0 e máximo 20 instâncias. Identidade runtime exclusiva, sem papéis extras de acesso a dados. Build usa `832112125521-compute@developer.gserviceaccount.com`, com `roles/run.builder`.

A política de domínio da organização impede bindings `allUsers`. O acesso público foi habilitado somente nesse serviço com `--no-invoker-iam-check`, mecanismo [documentado pelo Google](https://docs.cloud.google.com/run/docs/authenticating/public), sem alterar a política organizacional.

O bucket novo tem acesso uniforme, prevenção de acesso público e soft delete de 7 dias. A identidade do frontend tem `roles/storage.objectAdmin` somente nesse bucket e `roles/datastore.user` no projeto novo. Foi criada uma chave para a integração existente, que exige `GCP_PRIVATE_KEY`; seu conteúdo não está no repositório. A chave foi instalada na variável GCP_PRIVATE_KEY da Vercel após autorização explícita; a cópia temporária foi removida após validar o deployment.

## Testes concluídos

- 5 testes locais do backend passaram: `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest app/tests -q`, a partir de `backend/`.
- API nova: `/health` HTTP 200, `status=ok`.
- `/calculate/pcr`: resultados remotos idênticos ao motor local para 5, 15, 30 e 55 kg.
- Entrada inválida: HTTP 422.
- Preflight CORS permite `https://ped.iatron.com.br`.
- Credencial real do frontend: escrita, leitura e exclusão de dados sintéticos em GCS e Firestore passaram; os dados sintéticos foram removidos.
- YAML do workflow, sintaxe do script CORS e exclusões do upload verificados.

## Vercel: alteração autorizada e aplicada

Conta autenticada: `lucianoterresrosa@gmail.com`, usuário CLI `lucianoterresrosa-6245`.
Projeto: `https://vercel.com/luciano-terres-projects/frontend`.
IDs: projeto `prj_YX76LlKY69d14VDmpc8w5RjuzFeo`, equipe `team_kUYX6H6pwY37noInqpTdByP0`.
Root Directory remoto corrigido para `frontend`, install `npm ci`, build `npm run build`, output padrão Next.js; Node remoto `24.x`. O primeiro redeploy usou a raiz do repositório e falhou com `No Next.js version detected`; nenhum tráfego foi promovido para essa tentativa.

Deployment de produção anterior à troca: `dpl_e3iZ2dyJ3ovAGpYkYTfgPiygDkyJ`, `frontend-ajg2fqd99-luciano-terres-projects.vercel.app`, READY.

A leitura autenticada das variáveis confirmou:

| Variável | Antes da troca | Destino validado |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://iatron-calculator-api-629034331372.us-central1.run.app` | `https://iatron-calculator-api-832112125521.us-central1.run.app` |
| `GCP_PROJECT_ID` | `automatizar-452311` | `stg1-508713` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `iatron-vercel-admin@automatizar-452311.iam.gserviceaccount.com` | `iatron-vercel-admin@stg1-508713.iam.gserviceaccount.com` |
| `GCP_PRIVATE_KEY` | Chave da identidade anterior — não registrar | Chave da identidade nova — transferir somente por canal autenticado |
| `ARCHIVE_GCS_BUCKET` | `iatron-admin-archives-automatizar-452311` | `iatron-admin-archives-stg1-508713` |

Preservar: `ARCHIVE_STORAGE_PROVIDER=gcs`, `ARCHIVE_GCS_PREFIX=iatron-admin-archives`, `RATE_LIMIT_PROVIDER=firestore`, `FIRESTORE_DATABASE_ID=(default)`, `RATE_LIMIT_FIRESTORE_COLLECTION=iatronRateLimits` e as variáveis de banco, autenticação e Stripe.

O responsável autorizou explicitamente enviar a chave e atualizar as cinco variáveis de produção. A alteração foi aplicada: quatro valores legíveis foram relidos e conferidos; a Vercel confirmou o update da chave, cujo valor é mascarado na leitura. A chave anterior também é mascarada; ela não foi exportada para rollback.

Deployment final de produção: **`dpl_BGHSxM32hzfQ5g8U9eZZa7nbBaD9`**, `https://frontend-2e4l90ugx-luciano-terres-projects.vercel.app`, **READY**. Usa o código do deployment anterior (commit `6a286c1`) e as novas variáveis. `ped.iatron.com.br` e `frontend-two-lovat-72.vercel.app` foram conferidos pela API Vercel e apontam para esse deployment.

A tentativa `dpl_CjsT22VuYS5w7Q8TAFA9VhyBtX8j` falhou por Root Directory incorreto; foi substituída pela tentativa final com `frontend/`. A versão antiga permaneceu disponível até a promoção bem-sucedida.

Verificações pelo domínio público concluídas:

- `/` e `/login`: HTTP 200.
- `/admin` sem sessão: redireciona para login.
- `/api/health`: `ok=true`, `database=connected`, `auth=configured`.
- `/api/calculate/pcr`: HTTP 200, header `x-pcr-calculation-source=backend`, resultado idêntico ao motor local para 15 kg. Não usou fallback local.
- Token sintético inválido em `/api/auth/verify-email`: rejeitado com HTTP 400; a aplicação gravou o contador na coleção do Firestore novo, comprovando o uso da chave instalada na Vercel. O contador sintético foi removido depois do teste.
- GCS já havia passado em escrita/leitura/exclusão com a mesma identidade instalada. Fluxos admin autenticados de exportação/restauração não foram executados com usuário real nesta migração.

As cópias temporárias da chave e dos valores/configurações de rollback foram removidas. A chave ativa permanece na Vercel e no registro IAM da identidade; não foi revogada, pois é usada em produção. O deployment anterior continua disponível na Vercel.

## Dados antigos e limites da migração

Projeto de storage/rate limit anterior: `automatizar-452311`, conta de consulta `g4trader.news@gmail.com`.

- Coleção `iatronRateLimits`: 12 documentos, todos expirados no momento da consulta; sem paginação restante. Não foram copiados contadores expirados. O destino começará novos contadores.
- Bucket anterior: `iatron-admin-archives-automatizar-452311`, 2 objetos de smoke/debug, total 47 bytes, sob `iatron-admin-archives-smoke/`. Nenhum objeto foi listado sob o prefixo ativo `iatron-admin-archives/`.
- A cópia dos dois objetos antigos foi tentada, mas a leitura retornou HTTP 403: `The billing account for the owning project is disabled in state closed`. Testar cobrança no destino também não liberou a leitura. **Os objetos não foram copiados nem apagados**; recuperar esses arquivos de teste depende da regularização da origem.
- O Cloud Run documentado anteriormente em `automatizar-452311` não corresponde à URL efetivamente encontrada nas variáveis Vercel em 15/09. A URL com número `609095880025` era uma cópia local antiga. Preservar a URL real acima ao avaliar rollback.
- Supabase, Stripe, usuários e dados comerciais não foram migrados nem modificados.

Destino intermediário descartado: `stg1-508620`, conta `easywayconsultoria@gmail.com`, bloqueado por quota de vínculo de billing. Esse bloqueio não se aplica ao destino atual.

## CI/CD

Pool `iatron-github`, provider `github`, localização `global`:

```text
projects/832112125521/locations/global/workloadIdentityPools/iatron-github/providers/github
```

Identidade de deploy: `iatron-github-deploy@stg1-508713.iam.gserviceaccount.com`.
A condição exige repository ID `1249548644`, nome `g4trader/iatron_calculator` e ref `refs/heads/main`. Nenhuma chave privada de CI foi criada.

Papéis: `roles/run.sourceDeveloper` e `roles/serviceusage.serviceUsageConsumer` no projeto; `roles/iam.serviceAccountUser` somente na identidade runtime; `roles/run.admin` somente no serviço Iatron. Binding `roles/iam.workloadIdentityUser` limitado ao repository ID do pool.

Secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` e `GCP_DEPLOY_SERVICE_ACCOUNT`, e variável `CORS_ORIGINS`, configurados no environment GitHub existente `Production`. Conta GitHub ativa `g4trader`, com acesso admin confirmado.

Workflow `.github/workflows/backend-cloud-run-deploy.yml`: projeto e runtime explícitos, acesso público compatível com a organização, CORS por arquivo. Publicado em `main` no commit `4561bd384ae0d0d2daea00a5f0688a09b74d786f` (somente o workflow). `target=staging` ainda exige environment e serviço próprios; não usar o serviço de produção para staging.

Última execução anterior consultada: `29027311721`, falhou em 09/07/2026 por bloqueio de billing GitHub, antes das etapas. A federação ainda não foi validada por uma execução real de GitHub Actions. Não tratar configuração de secrets como comprovação de pipeline funcionando.

## Comandos para retomar

```bash
gcloud billing projects describe stg1-508713 \
  --account=operacional@southmedia.com.br --format='json(projectId,billingEnabled)'
gcloud run services describe iatron-calculator-api \
  --project=stg1-508713 --account=operacional@southmedia.com.br \
  --region=us-central1 --format='json(status.url,status.latestReadyRevisionName,status.conditions)'
curl --fail-with-body --max-time 30 https://iatron-calculator-api-832112125521.us-central1.run.app/health
```

Redeploy do backend, após alterações revisadas e testadas:

```bash
gcloud run deploy iatron-calculator-api \
  --project=stg1-508713 --account=operacional@southmedia.com.br \
  --source backend --region=us-central1 \
  --port=8080 --cpu=1 --memory=512Mi --min-instances=0 --max-instances=20 \
  --service-account=iatron-api-runtime@stg1-508713.iam.gserviceaccount.com \
  --no-invoker-iam-check --env-vars-file=backend/cloud-run.env.yaml
```

Não remover serviços, contas ou dados da origem antes de finalizar a troca e revisar recursos compartilhados. Rollback da Vercel requer os valores anteriores e um deployment anterior; a saúde da API anterior deve ser testada, não presumida.
