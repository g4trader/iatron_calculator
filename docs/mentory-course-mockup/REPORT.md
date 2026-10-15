# Curso demonstrativo completo — Mentory

Disponível em https://ped.iatron.com.br/mentory/admin/demonstracao, ou Administração → Curso demonstrativo. Requer conta com papel `mentory_admin` ou `mentory_editor` verificado no servidor.

Publicado em **15/10/2026 às 15:13:12 de Brasília**, commit `ce95ef717a6be7fe4a56d82f24cee05e83d79417`, deployment `dpl_Axq1D31tHMhzmhpW8gNW74oBU6Qi`. Alias confirmado. Sem push ou merge.

## Experiência entregue

- Visão geral com seis módulos, 24 aulas, progresso inicial claramente simulado e ação de continuar aula.
- Programa completo com títulos, descrições, durações de planejamento e estado de conclusão.
- Sala de aula com prévia interativa em quatro slides por aula, objetivos, roteiro, reflexão, anotação temporária, pergunta de revisão e navegação entre aulas.
- Biblioteca com 48 materiais demonstrativos (24 roteiros + 24 fichas), busca, leitor acessível com foco e download em texto.
- Tela de assinatura simulada com valor e vigência de referência; nenhuma contratação, data fictícia de contrato ou cobrança.
- Conclusão/reabertura de aulas, progresso compartilhado entre as telas da demonstração e botão para reiniciar.

Módulos: fundamentos da emergência pediátrica; vias aéreas e ventilação; circulação e monitorização; segurança no cuidado pediátrico; discussões e raciocínio clínico; integração e continuidade. Conteúdo editorial fictício, identificado permanentemente e sem validade clínica. Não contém doses, condutas, diagnósticos ou casos de pacientes. Os slides são uma prévia visual, não gravações de aulas. Durações são estimativas de planejamento.

## Isolamento e implementação

Next.js/React/TypeScript existentes; mesma identidade/autorização Mentory. Nova rota protegida, componente interativo e catálogo demonstrativo estático. Um link adicionado à navegação administrativa; estilos novos limitados ao mockup. Nenhuma nova dependência, API de escrita, migration, matrícula, pagamento, objeto GCS ou registro de conteúdo no banco. Não foi atribuído acesso premium a contas de equipe. Progresso/anotações existem somente em memória da página e reiniciam ao sair/recarregar; anotação também reinicia ao mudar de aula.

Arquivos: `frontend/app/mentory/admin/demonstracao/page.tsx`, `frontend/components/mentory/CourseDemo.tsx`, `frontend/lib/mentory/demo-course.ts`, navegação em `Admin.tsx`, CSS Mentory e `frontend/e2e/mentory-demo.spec.ts`. Manifesto por hash e patch acompanham a entrega. PCR, dados clínicos, autenticação e regras comerciais preservados.

## Validação

- Typecheck, lint e build remoto: PASS.
- 6 E2E aprovados (3 desktop + 3 mobile), cobrindo visitante e aluno bloqueados, equipe autorizada, 24 aulas, 48 materiais, leitura/download, foco acessível, slides, reflexão, progresso/reset, ausência de mutações de API e ausência de gravação de progresso/assinatura reais.
- Responsividade verificada em 360, 390, 768, 1024 e 1440 px, sem overflow. 20 screenshots locais em `screenshots/`, galeria `review.html`. Capturas locais incluem conta sintética e indicador de desenvolvimento do Next.js; não são sessões autenticadas de produção.
- 31 smoke checks em produção: PASS, incluindo proteção da nova rota, serviços, banco, cálculo PCR idêntico à referência V3, entrada inválida, páginas desktop/mobile e APIs privadas. Nenhum erro JavaScript capturado. Screenshots públicos adicionais em `production/screenshots/`.
- O teste autenticado com a conta real permanece com o usuário; nenhuma senha real foi utilizada. Não houve auditoria WCAG completa nesta etapa.

## Rollback

`vercel rollback dpl_4pp5LbFz6KRKgWMmhzzZy23jkUGx --scope luciano-terres-projects --yes`

Sem dados a reverter. Não necessário durante esta publicação. Cobranças reais e cálculos novos ainda não homologados mantêm seus bloqueios anteriores.
