# Publicação de mídia privada do Mentory — 15/10/2026

## Resultado

Publicado em **produção**, https://ped.iatron.com.br, em **15/10/2026 às 14:42:52 de Brasília** (17:42:52 UTC).

- Branch: `feat/clinical-resources`.
- Commit publicado: `634204f2035da3d9b3f753b6b3594b4bf379fbc2`.
- Deployment: `dpl_HrNmYiua1RMWHi63xgrriYMenZQ5` — READY.
- URL imutável: https://frontend-m291xvnp6-luciano-terres-projects.vercel.app.
- Alias principal confirmado pela API de aliases da Vercel, em `domain-alias.json`.
- Fonte exportada via `git archive` e 366 arquivos conferidos por hash Git em `release-manifest.json`; arquivos locais não rastreados não foram enviados. A Vercel recebeu 303 arquivos após exclusões de testes e ferramentas locais.
- Rollback documentado em `ROLLBACK.md`; não foi necessário executá-lo. Nenhum push ou merge realizado.

## Infraestrutura autorizada

Bucket exclusivo `gs://iatron-mentory-media-stg1-508713`, projeto `stg1-508713`, região `southamerica-east1`, classe Standard. Acesso público bloqueado (`enforced`) e acesso uniforme habilitado. Nenhum binding `allUsers`/`allAuthenticatedUsers`. A identidade existente da Vercel recebeu `roles/storage.objectAdmin` somente no novo bucket. Os bindings padrão de administração do projeto foram preservados. O bucket de arquivos existente não foi alterado.

CORS configurado para `https://ped.iatron.com.br`. Variável de produção `MENTORY_VIDEO_BUCKET` configurada; `MENTORY_STREAM_APPROVED=true` normalizada. Nenhuma chave extraída ou criada. Acesso utiliza as credenciais GCP existentes. Armazenamento e tráfego seguem os custos autorizados pelo usuário. Soft delete padrão do GCP: sete dias; nenhum objeto de teste ativo restou após a verificação.

## Implementação publicada

Upload de MP4 e legendas WebVTT pelo editor/admin autenticado; upload direto em partes para armazenamento privado; verificação de autor, formato, tamanho e geração antes de vincular à aula; reprodução HTML5 por URLs assinadas temporárias; legendas por rota autenticada; permissões e auditoria no servidor. UI e player desktop/mobile já testados e fotografados. Nenhum refinamento V4.

A publicação inclui V3, recursos clínicos, Mentory e correções de referência anteriormente publicadas. Esta etapa não alterou fórmulas PCR, schema/migrations, autenticação, licenciamento, pagamentos ou backend. O único ajuste posterior ao código de mídia foi diagnóstico não sensível do preflight.

## Verificações

- Preflight real dentro do build Vercel: PASS para criação/upload privado, CORS, validação de cabeçalho, URL assinada V4, leitura Range HTTP 206 e recusa de leitura anônima. Objeto temporário excluído; listagem posterior do bucket sem objetos ativos.
- Build remoto e typecheck: PASS. Typecheck adicional após diagnóstico: PASS.
- Mesma implementação visual/funcional previamente validada: 209 testes unitários; 14 E2E Mentory (7 desktop, 7 mobile); 12 E2E recursos clínicos (6 por formato); lint e build local aprovados. Logs em `prior-validation/`. Backend: cinco testes aprovados na entrega anterior, sem alterações desde então.
- **30 smoke checks de produção aprovados**, concluídos às 14:43:26 de Brasília; nenhum erro JavaScript capturado. Banco/autenticação e backend saudáveis, cálculo PCR sintético idêntico à resposta V3 auditada e ao motor local, entrada inválida rejeitada, oito screenshots públicos desktop/mobile sem overflow e rotas privadas/API protegidas, incluindo start/finish de upload e legendas.
- Screenshots de upload e player em `screenshots/` são evidências locais com dados sintéticos, não sessões de produção. O player local reproduziu MP4 válido com legendas; o preflight remoto utiliza um pequeno fixture de cabeçalho MP4 para testar transporte/assinatura, não decodificação de vídeo completo.

## Ocorrências e limites

Duas tentativas anteriores foram interrompidas pelo preflight, antes da promoção. Os valores não secretos de bucket e autorização de streaming foram normalizados via API para evitar espaços/quebras de linha do stdin. Foi acrescentado diagnóstico por etapa, sem chaves ou URLs, e a terceira tentativa passou. Logs anteriores preservados. O domínio permaneceu no deployment estável durante as falhas.

Testes autenticados no domínio continuam sob responsabilidade do usuário, conforme combinado; nenhuma conta, matrícula ou aula sintética foi criada em produção. A verificação de infraestrutura não substitui o teste de upload de uma aula real pelo administrador. MP4 deve usar codecs compatíveis (H.264/AAC); não há transcodificação automática, streaming adaptativo ou DRM. URLs são válidas por até cinco minutos; o player permite renovar acesso conservando a posição. Arquivos concluídos e não vinculados exigem limpeza operacional.

**Cobranças reais Mentory permanecem desativadas**, aguardando provedor de pagamento. Os novos cálculos clínicos dependentes de protocolos ambíguos permanecem bloqueados: anotações bibliográficas não equivalem à homologação médica de um protocolo completo. As restrições existentes foram preservadas.

O npm ci informou 28 achados de auditoria de dependências (2 moderados, 22 altos, 4 críticos) no conjunto instalado, já presente no lockfile. Esta publicação não atualizou dependências; a classificação e remediação desses achados não foi realizada nesta etapa.

## Acesso administrativo

https://ped.iatron.com.br/mentory/admin — conta `aristoteles.pires@hmv.org.br`, com a senha existente do iatron. O papel `mentory_admin` já havia sido concedido e auditado na etapa anterior; nenhuma senha foi alterada ou exposta.
