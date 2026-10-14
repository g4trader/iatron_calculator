# IATRON.PED — recursos clínicos documentais

Implementação local concluída na branch `feat/clinical-resources`, sobre a V3 publicada (`6dbd7a1ec2f4879700be697a704c223f394d22b6`). **Sem commit, push, merge ou deploy destes recursos.** Nenhuma configuração ou dado de produção foi alterado.

[Galeria desktop/mobile](review.html) · [Inconsistências por célula](INCONSISTENCIES.md) · [Roteiro de revisão médica](MEDICAL_REVIEW.md) · [Especificação](SPECIFICATION.md) · [Integridade V3](integrity.json)

## Entrega funcional

- Biblioteca com **69 apresentações, 16 categorias**, busca imediata por nome/categoria/apresentação/via, normalização somente para pesquisa, filtros combináveis, contagem, limpeza, vazio, carregamento e recuperação de erro.
- Desktop com lista e painel de ficha; mobile com drawer de filtros e ficha em página dedicada. Apresentações do mesmo medicamento são navegáveis sem fundir registros. Ceftriaxona 1g/pó das linhas 47 e 56 permanece separada por contexto e via EV/IM versus IM.
- Ficha com todos os campos originais, marcadores de ausência explícitos, alertas, pendências, fonte, aba, linha, célula, hash, versão, importação e situação de revisão. O texto bruto também pode ser consultado, incluindo espaços, acentos, marcadores e quebras de linha.
- Infusão contínua com as seis drogas originais, seleção documental e fórmula/preparo/concentração/macete transcritos. Peso, dose, concentração e taxa permanecem vazios e desabilitados. Vasopressina tem alerta específico de unidades e não recebe conversão silenciosa.
- Nenhum cálculo novo, prescrição, cópia de dose calculada ou exportação de recomendação. Não existe ação/API de cálculo para estes catálogos. Remover `disabled` no navegador não produz saída nem requisição de cálculo.

Todos os **75 registros permanecem pendentes**. Isso inclui as 41 fichas “Padrão PALS/SBP (validar)” e as outras 28 associadas ao Ebook. A homologação anterior da V3 não foi aplicada às novas fontes. Não há mecanismo de aprovação nesta entrega, nem para administradores. A implementação de cálculo após homologação é explicitamente futura e exige os critérios da especificação.

## Arquitetura, fontes e governança

O importador `scripts/import_clinical_resources.py` lê OOXML com a biblioteca padrão Python, sem instalar dependências, editar XLSX, executar fórmulas Excel ou interpretar expressões clínicas. Os originais de `docs/` foram preservados byte a byte e incluídos no patch/pacote; cada fonte possui versão por SHA-256 e data de importação. As cópias fornecidas em `iatron_clinical_resources/` têm os mesmos hashes.

O snapshot `frontend/data/clinical-resources.json` contém fontes, registros, pendências, inventário de células e lista vazia de aprovações. Cada registro tem ID estável por fonte/linha, status, campos brutos, índice normalizado, hash, versão, revisores e timestamps. Reimportar não duplica nem altera timestamps/bytes. Fonte modificada, divergência de contagens ou aprovação preexistente bloqueia a importação; a gravação é atômica e o arquivo anterior permanece íntegro.

O catálogo é carregado no servidor somente depois da política existente de autenticação e entitlement, incluindo a exceção administrativa já usada pelo produto. Os hashes das fontes não aparecem nos chunks JavaScript públicos. Não há nova regra comercial, alteração de autenticação, migração de banco, endpoint público de dados ou telemetria adicionada. Busca e filtros permanecem em estado local; URLs contêm apenas IDs documentais, sem dados de pacientes.

A prévia Top 100 continua independente. O motor completo já possui cálculos de infusão, mas não foi substituído, alimentado por estas planilhas ou alterado. A única alteração no shell V3 é a inclusão dos dois links e de suas chaves de navegação. Estilos novos são restritos a `.clinical-resources`; a landing, os tokens V3 e a Folha PCR foram preservados.

## Auditoria das fontes

**164 pendências rastreáveis**, que não equivalem a 164 erros de dose:

| Tipo | Quantidade |
| --- | ---: |
| Homologação não documentada | 75 |
| Fichas com campos vazios/marcadores de ausência | 68 |
| Revisão das apresentações de dipirona | 2 |
| Volume final da mistura não inequívoco | 6 |
| Relação volume/24h versus ml/h não homologada | 6 |
| Duplo sinal de igualdade na noradrenalina | 1 |
| Unidades da vasopressina | 1 |
| Observações da legenda: referência, exemplo e cache de fórmula | 3 |
| Mesma apresentação em contextos de ceftriaxona distintos | 2 |

[Lista completa](INCONSISTENCIES.md), [CSV](validation-issues.csv), [JSON](validation-issues.json) e [inventário resumido](inventory-summary.json). A fórmula `COUNTA` da Legenda B8 foi registrada, não executada; o cache estava vazio. As contagens foram verificadas diretamente nos registros. Nenhuma dose, unidade, concentração, diluição ou macete foi “corrigido”.

## Testes e evidências finais

| Verificação | Resultado |
| --- | --- |
| Importação Python | 11 testes passaram: contagens, células exatas, hashes, idempotência, multiline, ausência, fórmula, conflitos e atomicidade |
| Frontend | 192 testes passaram: 185 existentes + 7 novos |
| Backend | 5 testes passaram |
| E2E novos recursos | 12 passaram: seis cenários em desktop e mobile |
| E2E V3 existentes | 36 passaram: 18 desktop + 18 mobile |
| Build | `npm run build` passou, incluindo Prisma generate e Next build |
| Typecheck / lint | Passaram; nenhum erro ou aviso de lint |
| Layout e alvos dos novos módulos | 28 verificações sem overflow ou alvos interativos menores que 44 × 44 px |
| Larguras | 320, 375, 390, 768 e 1440 px |
| Axe dos novos módulos | 13 verificações sem violações nas regras WCAG A/AA executadas |
| Teclado | Drawer contém foco; Escape fecha, devolve foco e restaura scroll |
| V3 visual e acessibilidade | PCR, landing, módulos existentes, estados inválido/erro/loading, menu, âncoras, textos ampliados e axe reexecutados |
| WebKit V3 | Cálculo, responsividade em 320/390/430, chamada de impressão e presença de resultados/avisos passaram |
| Integridade | 27 arquivos protegidos intactos, além dos 19 arquivos clínicos da auditoria V3 original |
| Resposta PCR | JSON completo exatamente igual à evidência V3 aprovada |
| PDF PCR | Texto e imagem renderizada exatamente iguais à V3 aprovada |

A rota PCR conserva first load de 118 kB no relatório do build. Os testes usaram PostgreSQL descartável e contas sintéticas locais. Os catálogos novos contêm os dados reais das fontes documentais, sem dados de pacientes. Capturas inspecionadas visualmente, incluindo ficha mobile, infusão bloqueada e PDF.

Os logs das tentativas iniciais foram preservados: correções de tipagem para o target ES5, sincronização dos testes com hidratação/fechamento assíncrono e expectativa de 404 ajustada ao `notFound()` em resposta streaming do Next. Uma expectativa de teste de ceftriaxona omitia “/IM”; foi corrigida pela leitura literal da fonte, sem alterar dado clínico. As execuções finais passaram. Credenciais sintéticas do cabeçalho do seed foram ocultadas nos logs de entrega.

Limites: axe não é certificação WCAG; os relatórios V3 mantêm verificações de contraste marcadas como incompletas pela ferramenta. Não houve teste com leitor de tela humano, dispositivo iOS físico nem diálogo de impressão do sistema. Homologação médica e validação dimensional das novas fórmulas não foram realizadas por automação e continuam pendentes.

## Reprodução e revisão

Na raiz do repositório:

```sh
python3 scripts/import_clinical_resources.py --check
python3 scripts/test_clinical_import.py
python3 scripts/clinical_resource_report.py
```

No frontend com Node 24 e ambiente **local descartável**, usar os mesmos comandos registrados nos logs: `npm run build`, `npx tsc --noEmit`, `npm run lint`, `node --test --import tsx tests/*.test.ts`. Carregar as variáveis do ambiente local conforme a documentação existente. Backend: `PYTHONPATH=backend python3 -m pytest backend/app/tests -q`.

E2E novos: `npx playwright test e2e/clinical-resources.spec.ts --project=chromium --project=mobile-chrome`. E2E V3: executar `commercial-funnel.spec.ts`, `security-session.spec.ts` e `system-flow.spec.ts` em cada projeto. Reiniciar o servidor local entre suítes para não acumular limites de login; os limites de segurança não foram enfraquecidos. Nunca apontar seed/E2E para produção.

Capturas: `frontend/scripts/clinical-resources-review.mjs`, com `PLAYWRIGHT_BASE_URL` local, `CLINICAL_EVIDENCE_DIR` para a saída e `AXE_PLAYWRIGHT_MODULE` apontando ao axe Playwright instalado no ambiente de QA. Os scripts V3 da entrega anterior foram reutilizados com saída em `v3-regression/`, sem sobrescrever a auditoria aprovada.

O pacote inclui `feature.patch` sobre a V3, os fontes correspondentes e `supporting-v3-tests.patch` separado. Este último preserva o harness E2E pré-existente no workspace (seletores V3, fixture de administrador e fluxo de sistema) necessário para reproduzir a regressão; não integra código de produção. Alterações anteriores de infraestrutura e documentação operacional ficaram fora dos patches.

Para revisão do médico, seguir [MEDICAL_REVIEW.md](MEDICAL_REVIEW.md). A entrega está pronta para aprovação técnica/documental, **não para ativação de cálculos ou publicação automática**.
