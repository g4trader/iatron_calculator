# Player de vídeo funcional — demonstração Mentory

Publicado em **15/10/2026 às 15:51:55 de Brasília**, commit `b688f017e27e94a9afe21290580bbae49fe13f41`, deployment `dpl_249W8sEPGVEB7q53MAVs4mSBuyCa`. URL: https://ped.iatron.com.br/mentory/admin/demonstracao → Sala de aula. Alias confirmado. Sem push ou merge.

## Entrega

O painel em slides foi substituído por um player HTML5 com vídeo real: apresentação original de 56 segundos, 1280×720, H.264/AAC, cerca de 878 KiB. Narração sintética em português (voz padrão Luciana do macOS), quatro capítulos, capa e legendas WebVTT com frases curtas. Conteúdo de apresentação da experiência, sem orientação clínica. A mesma amostra serve às 24 aulas do mockup; não representa 24 videoaulas gravadas.

Controles: reproduzir/pausar, barra de busca, volume, legendas e tela cheia nativos do navegador; botões de avanço/retorno de 10 segundos; velocidades 0,75× a 2×; acesso direto a capítulos; retomada independente por aula enquanto a demonstração está aberta. Erros de mídia exibem mensagem e botão para tentar novamente. Conclusão da aula permanece manual. Não há autoplay com áudio. O suporte a tela cheia e a outros controles nativos depende do navegador.

Legendas ajustadas para leitura em mobile. Screenshots finais capturados após decodificação de frames, sem estado transitório de carregamento. Prévia revisada visualmente em desktop e mobile. Galeria: `review.html`.

## Segurança e isolamento

Vídeo, capa e legendas ficam em `frontend/assets/mentory-demo`, fora de `public/`. São entregues somente pela rota `/api/mentory/demo-video`, com verificação de sessão e papel editorial no servidor. Arquivos permitidos são enumerados; não há caminho arbitrário. Respostas usam `private, no-store`, `nosniff` e suporte a GET/HEAD/Range; intervalos inválidos retornam 416. Alunos recebem 403 e visitantes 401, inclusive para capa e legendas.

A configuração de tracing inclui os três arquivos na função Next.js; inclusão verificada no manifesto real do build (`asset-bundling.json`). Sem novas dependências, banco, migrations, credenciais, objetos GCS ou mudanças de infraestrutura. Upload/reprodução das aulas reais por GCS, autenticação, assinaturas, regras clínicas e PCR preservados. O mockup não cria matrículas nem grava progresso real.

## Verificação

- Typecheck, lint, build local e build remoto: PASS.
- Dois testes unitários de Range: intervalos completos, limitados, abertos, sufixos, limites, múltiplos, malformados, invertidos e números inseguros.
- Oito E2E finais aprovados (4 desktop + 4 emulação mobile Chrome). Reprodução com avanço efetivo de tempo, pausa, velocidade, seek, retomada após sair/voltar, carregamento de legendas, HTTP 206/416/HEAD, recusa de caminhos arbitrários, bloqueio de visitante/aluno e recuperação de falha 503. Os demais fluxos do mockup, isolamento de progresso e responsividade continuam cobertos.
- 22 screenshots locais, incluindo o player desktop/mobile. Revisão responsiva do mockup em 360, 390, 768, 1024 e 1440 px. Não foi feita homologação em aparelhos físicos iOS/Android nem auditoria WCAG integral.
- 34 smoke checks de produção: PASS, incluindo bloqueio anônimo dos três ativos, proteção da demonstração, serviços/banco/autenticação, páginas públicas responsivas e resposta PCR idêntica à referência V3. Nenhum erro JavaScript capturado.
- Reprodução autenticada automatizada foi validada no ambiente local; a sessão real de produção permanece com o usuário, conforme combinado. Não foram usadas credenciais reais de aluno/admin para os testes.

## Artefatos e rollback

Manifesto de arquivos/hash, logs, screenshots, galeria e patch binário acompanham a entrega. `generate-video.py` registra a geração local do vídeo com FFmpeg e voz macOS. A duração por aula exibida no catálogo é estimativa do curso e não a duração da amostra.

Rollback: `vercel rollback dpl_Axq1D31tHMhzmhpW8gNW74oBU6Qi --scope luciano-terres-projects --yes`. Nenhuma reversão de banco necessária. Rollback não foi necessário nesta publicação.
