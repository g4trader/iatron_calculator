# IATRON.PED — Implementação dos recursos clínicos adicionais

## Papel e objetivo
Você é o engenheiro frontend/fullstack responsável por implementar, na interface V3 aprovada, dois módulos baseados nos arquivos XLSX em `/docs/`: (1) Biblioteca de doses pediátricas e (2) Drogas de choque / infusão contínua. Esta é uma entrega fechada de interface e importação segura; não reabrir redesign V3 nem alterar cálculos clínicos existentes.

## Inspeção inicial obrigatória
1. Inspecione a estrutura real do repositório, rotas, menu, componentes, testes, autenticação e permissões. Não presuma stack nem nomes de arquivos.
2. Localize os dois XLSX pelo conteúdo/nome na pasta `/docs`. Preserve os originais intactos e versionados. Extraia e registre checksum SHA-256 e data de importação.
3. Verifique recursos já existentes (cálculo de doses Top 100, infusão, protocolos) para evitar duplicação. Os novos dados não substituem automaticamente o catálogo atual.
4. Construa inventário de linhas, colunas, fórmulas, unidades, campos vazios e divergências, mantendo o identificador da linha de origem.

## Escopo funcional — biblioteca
- Criar rota e entrada lateral `Biblioteca de medicamentos` (ou integrar à navegação existente se houver nomenclatura equivalente), mantendo o menu V3.
- Busca imediata por nome, categoria, apresentação e via, com filtros acessíveis e contagem de resultados; empty state e loading state.
- Exibir cada apresentação como registro separado e agrupar apresentações do mesmo medicamento em detalhe navegável.
- Ficha: medicamento, categoria, apresentação, dose habitual ORIGINAL, intervalo, dose máxima, via, preparo/diluição, macete, alertas/restrições, fonte e estado de homologação; campos ausentes exibidos como 'Não informado na fonte'.
- Preservar texto original e manter também versão normalizada para pesquisa; não reescrever unidades nem arredondar dados clínicos.
- Badge textual explícito `Pendente de validação` em toda ficha não homologada, inclusive aquelas com fonte 'Ebook'; não equiparar fonte bibliográfica à aprovação clínica.
- Não oferecer cálculo automático, copiar dose calculada, gerar prescrição ou exportar recomendação clínica de registros não homologados. Consulta documental pode permanecer acessível com aviso de conteúdo não validado.
- Se houver base existente de medicamentos homologados, exibir separadamente a origem e a versão e não misturar sem mapeamento e aprovação.

## Escopo funcional — infusão contínua
- Criar rota `Infusão contínua` acessível pelo menu existente, sem alterar a Folha PCR.
- Catálogo documental das seis drogas da planilha, com apresentação, faixa de dose, fórmula textual original, diluição textual original, concentração textual original, macete textual original e origem/linha.
- Interface futura da calculadora: seleção de droga, peso (kg), dose com unidade, concentração/preparo e taxa com unidade; estado bloqueado `Aguardando homologação clínica` até liberação explícita de cada fórmula e preparo.
- Nunca inferir ou aplicar automaticamente a fórmula genérica da planilha a todas as drogas; tratar vasopressina separadamente por unidades mUI/UI, sem conversão silenciosa.
- Não oferecer números de ml/h, volume de preparo ou instruções executáveis enquanto não houver protocolo validado. Não usar dados fictícios em telas de produção.
- Após homologação futura, exigir cálculo dimensional independente, limites configurados por protocolo, testes de casos de referência fornecidos pelo médico, dupla conferência de concentração, unidades explícitas e identificação da versão do protocolo; isso NÃO faz parte desta entrega.

## Governança e qualidade dos dados
- Modelo sugerido: `clinical_source`, `medication_entry`, `infusion_entry`, `validation_issue`, `clinical_approval` (adaptar à arquitetura existente).
- Cada registro: id estável, arquivo, aba, linha, hash de origem, texto bruto, campos normalizados para busca, status `pending_review|approved|rejected`, versão, revisores, timestamps; somente aprovação por perfil autorizado após validação externa documentada.
- Importador idempotente; sem duplicação em reexecuções; relatório de conflitos; falhas de importação não podem afetar módulos existentes.
- Não armazenar dados identificáveis de pacientes em analytics, logs ou URLs. Não criar telemetria de conteúdo clínico sensível.
- A fonte 'Padrão PALS/SBP (validar)' aparece em 41 de 69 fichas: preservar indicação de pendência. Há outras 28 fichas que também precisam de homologação institucional antes de cálculos.

## Alertas de qualidade para registrar em issue list, sem corrigir automaticamente
- Fichas, linha 2: dipirona gotas 500 mg/ml, dose 10–12 mg/kg/dose, macete 'peso × 0,4 (ml)' — aparente incompatibilidade dimensional.
- Fichas, linha 3: dipirona solução 50 mg/ml, dose 10–12 mg/kg/dose, macete 'peso × 0,2 (ml)' — verificar separadamente.
- Infusão, linha 5: noradrenalina '1 mg/ml = = 1.000 mcg/ml' (erro de digitação na origem).
- Infusão: 'volume/24h' e macetes ml/h não são intercambiáveis sem concentração e definição inequívoca do volume final da mistura; várias concentrações finais declaradas não podem ser deduzidas inequivocamente de 'X ml + SF Y ml'.
- Infusão, linha 9: vasopressina expressa em mUI/kg/min; não aplicar fórmula para mcg/kg/min.
- Não corrigir doses, concentrações, diluições ou unidades sem revisão do médico.

## Design V3 — critérios verificáveis
- Reutilizar tipografia, cores, tokens, componentes, sidebar, cabeçalho, espaçamento e padrões de foco da V3.
- Desktop: busca no topo, filtros laterais ou chips, lista de resultados e painel de detalhes sem poluição visual. Mobile: busca sticky quando útil, filtros em drawer, cards de fácil leitura e detalhes em página dedicada; alvos de toque >=44px.
- Informação clínica primeiro; destacar via, apresentação, alertas e status de validação com texto, não só cor.
- WCAG 2.2 AA como objetivo, teclado e leitor de tela, contraste adequado, sem truncamento de doses/unidades e sem scroll horizontal em 320/375/390/768/1440px.
- Não reproduzir XLSX como tabela gigante no mobile. Não introduzir marketing ou banners dentro da ferramenta clínica.

## Testes e entrega
- Testes de importação, contagens (69 fichas, 16 categorias, 6 drogas), idempotência, caracteres acentuados, multiline, campos vazios, status pendente, filtros, busca, permissões e estados bloqueados.
- Testes E2E desktop/mobile para consulta e tentativa de calcular: nenhuma saída numérica clínica não homologada deve ser gerada.
- Reexecutar todos os testes de regressão V3, inclusive PDF e Folha PCR; comprovar que os arquivos de lógica clínica preexistentes não foram alterados.
- Entregar screenshots de catálogo e ficha desktop/mobile, tela de infusão bloqueada, relatório de divergências por arquivo/aba/linha, diff, logs, lista de rotas e instruções de revisão pelo médico.
- Não fazer deploy, push ou merge desta funcionalidade sem aprovação posterior. O deploy da V3 já em andamento é processo independente; não misturar branches ou releases.

## Critérios de aceite
1. Catálogos consultáveis e fiéis às duas fontes, com rastreabilidade por linha.
2. Nenhum cálculo ou prescrição de dados não homologados.
3. UI V3 preservada e adaptada aos dois fluxos.
4. Testes e screenshots entregues.
5. Pendências clínicas explícitas, sem 'correções' inventadas.
