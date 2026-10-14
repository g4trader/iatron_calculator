# CODEX — IATRON.PED MENTORY — ESPECIFICAÇÃO DE INTEGRAÇÃO V1

## Missão
Integrar o produto Mentory ao repositório existente `ped.iatron.com.br`, com rota pública `/mentory`, ambiente do aluno `/mentory/aprender`, módulos `/mentory/modulos`, materiais `/mentory/materiais`, assinatura `/mentory/assinatura`, login `/mentory/login` e painel administrativo `/mentory/admin`. Use o código deste diretório como base visual e funcional de protótipo, não como implementação pronta para produção. Inspecione a stack e as rotas atuais antes de migrar. Preserve integralmente o sistema PCR e os demais recursos clínicos existentes.

## Direção de design aprovada
Interface SaaS premium de educação médica, azul-marinho, azul clínico, branco e cinza claro; tipografia contemporânea; navegação lateral no desktop, inferior no mobile; cards com pouca ornamentação; hierarquia explícita entre vídeo, módulo, aula, material e progresso. Use `public/images/conceito-ux-v1.png` SOMENTE como referência. Não reutilize pessoas/fotografias do mockup como se fossem imagens reais. Não invente depoimentos, números de alunos, credenciais ou conteúdo clínico.

## Arquitetura e funcionalidades obrigatórias
1. Reutilize a autenticação segura do sistema principal quando possível. Crie roles/permissões distintas: `mentory_admin`, `mentory_editor`, `mentory_student`. Toda rota e API privada deve ter verificação server-side, não só ocultação no frontend. A conta administrativa do sistema PCR não deve receber permissões de Mentory automaticamente.
2. Modele entidades persistentes: `mentory_modules` (id, title, description, position, status), `mentory_lessons` (id, module_id, title, description, position, duration, video_asset_id, status), `mentory_materials` (id, lesson_id, title, type, storage_key, body, position), `mentory_enrollments` (user_id, subscription_id, status), `mentory_lesson_progress` (user_id, lesson_id, completed_at, last_position_seconds), `mentory_subscriptions` (id, user_id, price_cents, currency, started_at, expires_at, renewal_price_cents, renewal_terms_version, status, payment_provider_id), `mentory_audit_logs` (actor_id, action, entity_id, timestamp, metadata). Criar migrations reversíveis, índices, FKs e isolamento por usuário.
3. Admin: CRUD de módulos, aulas e materiais; reordenação determinística; rascunho, preview e publicação; upload de PDFs/slides por armazenamento privado com URLs assinadas; cadastro de links de vídeo em provedor de streaming seguro; listagem/filtro de alunos, status e datas de assinatura; trilha de auditoria para ações sensíveis. Não implementar upload direto público ou vídeos sensíveis em `/public`.
4. Aluno: dashboard com progresso calculado no servidor, continuar aula, lista de módulos, player com acessibilidade/legendas quando disponíveis, materiais autorizados, marcação de conclusão, assinatura e data de vencimento. Acesso expirado deve bloquear vídeo/material premium no backend e mostrar CTA de renovação, sem apagar progresso.
5. Comercial: preço inicial de R$ 3.500,00 por seis meses. Registrar `350000` centavos BRL e data de início/vencimento com semântica clara de fuso. A renovação deve preservar o preço contratual fixo para o assinante conforme termos homologados; não assumir renovação automática, parcelamento, impostos, reembolso ou condições de elegibilidade. Antes de cobrar, solicitar decisão sobre gateway, termos, renovação automática/manual, política de cancelamento e emissão fiscal. Não criar pagamentos falsos.
6. Segurança e privacidade: autorização por recurso, proteção de vídeos e PDFs, logs sem dados sensíveis, rate limiting, CSRF onde aplicável, sanitização de conteúdo, prevenção de IDOR, backups, LGPD, termos e política de privacidade. Não inserir casos de pacientes identificáveis. Conteúdo clínico é responsabilidade do médico e requer revisão antes de publicar.
7. Responsividade: testar 360, 390, 768, 1024, 1440 px; sem overflow, navegação mobile com áreas de toque adequadas, estados vazios/loading/erro, contraste WCAG AA, foco visível, labels e navegação por teclado.

## Escopo de entrega e gates
Fase A: integrar rotas e componentes, criar modelos/migrations e autenticação/RBAC; deixar publicação de conteúdo e cobrança em modo seguro até credenciais/decisões reais.
Fase B: construir gestão de módulos/aulas/materiais, player e progresso persistente, com testes unitários, integração e E2E.
Fase C: preparar assinatura/renovação e checkout com adaptador de pagamento, sem transações reais antes de homologação comercial.

Não publique este protótipo com o painel `/admin` aberto: no pacote atual ele é acessível sem login e armazena dados apenas no navegador. Se não houver backend seguro implementado, exponha somente uma preview protegida em staging e sinalize bloqueio de produção.

## Evidências exigidas
- Inventário da stack real, estratégia de integração e arquivos modificados.
- Screenshots desktop/mobile de LP, login, dashboard, lista de módulos, player, materiais, assinatura, admin dashboard, admin conteúdo, admin alunos e admin assinaturas.
- Testes de isolamento: aluno A não acessa progresso, vídeo, material nem assinatura de B; aluno não acessa admin; expiração bloqueia ativos premium; usuário não autenticado não consegue editar/publicar.
- Testes de reordenação, publicação, progresso, materiais, permissões, renovação contratual e rollback.
- Relatório de pendências comerciais, clínicas e de provedores, sem alegar integração que não existe.
- Não fazer push/merge/deploy em produção sem autorização explícita do responsável pelo repositório.

## Aceite
UX aprovada visualmente, rotas consistentes, backend persistente e seguro, testes passando, conteúdos fictícios identificados, ausência de cobranças reais sem homologação e zero regressão no PCR.
