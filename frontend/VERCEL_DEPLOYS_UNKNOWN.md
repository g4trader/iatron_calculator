# Deploys Vercel em estado UNKNOWN

Verificacao operacional em 2026-07-09 via `vercel ls`:

- O projeto remoto identificado foi `luciano-terres-projects/frontend`.
- A producao atual estava em `Ready`.
- Os deploys `UNKNOWN` encontrados eram URLs tecnicas antigas `frontend-*.vercel.app`, sem alias de dominio exibido na listagem.
- O dominio de revisao/producao deve continuar apontando apenas para o deploy `Ready` atual.

## Decisao

Nao remover automaticamente esses deploys neste momento.

Motivos:

- remocao de deploy antigo pode apagar evidencia util para auditoria;
- deploy `UNKNOWN` sem alias nao e rota principal de usuario;
- a producao atual valida permanece intacta;
- rollback e historico ficam preservados ate haver politica formal de retencao de deploys.

## Como limpar manualmente com seguranca

1. Abra o projeto `frontend` na Vercel.
2. Entre em `Deployments`.
3. Filtre os deploys com status `UNKNOWN`.
4. Confirme que nenhum deles possui alias ativo, especialmente `ped.iatron.com.br`.
5. Confirme que nao sao candidatos de rollback.
6. Remova apenas os deploys sem alias, sem uso e fora da janela de auditoria definida.

Condicao de abortar: se qualquer deploy `UNKNOWN` tiver alias, aparecer em logs recentes de trafego, ou for necessario para investigacao, nao remova.
