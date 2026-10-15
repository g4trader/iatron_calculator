# Vídeos privados — implementação de 15/10/2026

> Atualização: bucket exclusivo autorizado e integração publicada em 15/10/2026 às 14:42:52 de Brasília. Preflight real e 30 smoke checks aprovados. Estado atual em [relatório de publicação](../mentory-media-publicacao-2026-10-15/REPORT.md). O texto abaixo registra o estado anterior à autorização.

Alternativa ao Cloudflare: Google Cloud Storage privado, com prefixo fixo `iatron-mentory-media/` e bucket exclusivo configurado por `MENTORY_VIDEO_BUCKET`. Nenhuma chave é exposta ao navegador. A autorização de criação desse bucket está pendente após rejeição automática da tentativa de reutilizar o bucket de arquivos. A conta GCP operacional também exige reautenticação para criar/configurar infraestrutura.

## Implementado

- Upload de MP4 (até 2 GB) e WebVTT (até 1 MB) diretamente ao GCS em partes de 8 MiB, sem passar o vídeo pela Vercel.
- Servidor exige editor/admin Mentory, mesma origem, limites de requisição e tamanho. Destino aleatório, prefixo fixo e criação condicional impedem sobrescrever objetos existentes.
- Conclusão verifica autor do upload, tamanho, MIME, cabeçalho e geração do objeto. A aula só aceita mídia GCS verificada. Alterações invalidam revisão/publicação como antes.
- Reprodução HTML5 com controles, retomada de posição e legendas servidas por rota autenticada. Formato esperado H.264/AAC em MP4, sem transcodificação automática ou streaming adaptativo.
- GET assinado V4 por até cinco minutos e nunca além do vencimento da assinatura. Geração assinada impede troca silenciosa de objeto. Revalidação da sessão e da matrícula antes de cada emissão; suporte a Range para busca no vídeo. URL temporária é um bearer token, não DRM nem garantia contra compartilhamento durante sua validade.
- Auditoria registra operações/IDs/tamanho, nunca URLs de upload, links assinados, chaves ou conteúdo.
- Probe remoto opcional valida upload, CORS, leitura assinada por Range e recusa de acesso anônimo, removendo seu objeto temporário. Não usa pacientes nem cria usuários/contratos.

## Limites operacionais

Não foi criado bucket nem concedido IAM até autorização específica. Não foi executado probe real no GCP até essa conexão. O vídeo sintético local testa o player, não demonstra integração externa. Arquivos completos que não forem vinculados a aulas precisam de limpeza operacional; não há exclusão automática de mídia ativa. Formato do contêiner é verificado, mas o navegador valida compatibilidade dos codecs. Em caso de link vencido, reproduzir novamente renova o acesso e conserva a posição local.

Referências: [Google — URLs assinadas](https://docs.cloud.google.com/storage/docs/access-control/signing-urls-manually), [Google — uploads resumíveis](https://docs.cloud.google.com/storage/docs/performing-resumable-uploads). O uso de armazenamento/tráfego está sujeito à cobrança da conta GCP; a cobrança de assinaturas Mentory continua desativada.
