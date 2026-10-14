# Publicação dos recursos clínicos e Mentory

Autorização explícita do usuário: fazer commit e deploy de todo o desenvolvimento pendente. Escopo de aplicação: biblioteca de medicamentos, consulta de infusão contínua e Mentory integrado. V3/PCR e regras existentes permanecem preservados. Não habilitar cálculos não homologados, conteúdo clínico Mentory, streaming não homologado ou cobranças reais.

As alterações documentais e o workflow anteriores de reconexão GCP serão versionados; o backend atual não requer novo deploy porque seu código de execução não mudou. Não executar mudanças de IAM, serviços ou infraestrutura fora desse escopo.

## Publicação

- Testes já concluídos: build/typecheck/lint, 197 frontend, 5 backend, 11 importador, 60 E2E, 55 verificações visuais e rollback em clone local. Quatro testes adicionais cobrem o guard da migration desta publicação.
- Commit de fontes, testes, migration, planilhas originais rastreáveis e documentação. Excluir credenciais/configuração local, ZIPs, screenshots e protótipos independentes do pacote de runtime.
- Pacote isolado a partir do frontend V3 e fontes versionados; verificar todos os arquivos contra o índice do commit.
- `vercel.release.json` é um perfil explícito de publicação. O build remoto usa as credenciais sensíveis já existentes na Vercel; elas não são extraídas nem exibidas.
- O guard compara checksums/histórico, recusa migrations pendentes não relacionadas, aplica apenas `20261015000100_mentory`, compara fingerprint das colunas existentes e verifica dez tabelas Mentory. SQL aditivo e transacional, sem UPDATE/DELETE em dados existentes e sem seed.
- Criar deployment de produção com `--skip-domain`, mantendo o domínio no artefato anterior. Promover somente após build/migration e verificações do novo artefato. Não configurar gateway, contas de teste ou permissões administrativas automáticas em produção.

## Restauração

Deployment atual confirmado: `dpl_9WrRqyTpse91ZSRSvNyfgf9sdrDx`, https://frontend-lnrmkoau4-luciano-terres-projects.vercel.app, commit V3 `6dbd7a1ec2f4879700be697a704c223f394d22b6`.

Se houver falha crítica após promoção:

```
vercel rollback dpl_9WrRqyTpse91ZSRSvNyfgf9sdrDx --scope luciano-terres-projects --yes
```

Manter as tabelas Mentory inativas durante rollback de código; são aditivas e compatíveis com a V3. Não executar rollback destrutivo do banco automaticamente. Não é necessária exportação de dados de pacientes: nenhuma tabela/linha existente é alterada pela migration autorizada. O fingerprint de schema anterior, histórico Prisma e o artefato V3 preservam o ponto de restauração desta mudança aditiva. Se futuramente for necessário remover dados Mentory, fazer backup consistente e aprovação específica antes de usar `docs/mentory/rollback.sql`.

Verificações autenticadas de produção continuam sob responsabilidade do usuário, conforme instrução anterior. Smoke automático usa apenas dados sintéticos em requisições de cálculo e não cria usuários, contratos, progresso ou conteúdo em produção.
