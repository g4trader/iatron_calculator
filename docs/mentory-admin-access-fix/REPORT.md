# Correção do acesso administrativo Mentory

Publicado em produção em **15/10/2026, 14:55:52 de Brasília**, no commit `8d6763e251e647a2fc242f0743834ed031c0a486`, branch `feat/clinical-resources`.

Deployment Ready: `dpl_4pp5LbFz6KRKgWMmhzzZy23jkUGx`, https://frontend-9aqtecd6y-luciano-terres-projects.vercel.app. Alias https://ped.iatron.com.br confirmado pela API da Vercel.

## Problema e correção

O login Mentory encaminhava todas as contas a `/mentory/aprender`. Essa área verifica matrícula de aluno e mostrava acesso premium inativo a administradores sem matrícula, apesar de sua permissão administrativa válida.

Agora o servidor encaminha administradores/editores sem acesso de aluno para `/mentory/admin`. As entradas `/mentory/modulos` e `/mentory/materiais` encaminham esses usuários para gestão de conteúdo; `/mentory/assinatura` encaminha para gestão. Equipe com matrícula ativa mantém a área do aluno. O painel continua protegido por sessão e papel Mentory no servidor; nenhuma matrícula, assinatura, pagamento ou permissão foi criada/alterada. Prévia editorial permanece disponível pelo painel, sem gravar progresso de aluno.

## Validação

- 8 E2E desktop + 8 mobile aprovados, incluindo caso novo de administrador/editor sem assinatura, navegação pelas quatro entradas, prévia/material editorial permitidos e acesso premium normal negado. Testes existentes de aluno ativo/expirado e isolamento de permissões aprovados.
- Typecheck, lint e build remoto aprovados.
- 30 smoke checks no domínio aprovados, concluídos às 14:56:15 de Brasília: serviços/banco/autenticação, cálculo sintético PCR idêntico à V3, proteção de páginas e APIs, responsividade desktop/mobile e nenhum erro JavaScript capturado. Screenshots públicos em `production/screenshots/`.
- Testes autenticados usam contas sintéticas exclusivamente locais; não foi usada a senha da conta real. O usuário confere sua sessão real, conforme combinado.
- Sem alteração clínica, de dados de produção, mídia, schema, infraestrutura ou pagamentos. Sem push/merge. Fontes verificadas por hash no manifesto.

## Rollback

Se necessário: `vercel rollback dpl_HrNmYiua1RMWHi63xgrriYMenZQ5 --scope luciano-terres-projects --yes`. Não há migration ou dado a reverter. Rollback não necessário nesta publicação.

Acesso direto: https://ped.iatron.com.br/mentory/admin, com a conta e senha existentes.
