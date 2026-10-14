# Inconsistências e pendências por origem

Consulta documental: nenhuma correção clínica foi aplicada. Os 75 registros permanecem `pending_review`. Fonte bibliográfica não é homologação.

## Fontes imutáveis

- `docs/Base-Conhecimento-Pediatria-Doses (1).xlsx` — SHA-256 `54e81afad928e9944cb180e4ffa8b3165a1cf27a1ebd1b67e4c9abea7d484f3e`; importado em `2026-10-14T22:23:20.031336+00:00`; versão `xlsx-54e81afad928`.
- `docs/Drogas choque _ infusão contínua (1).xlsx` — SHA-256 `f149f420ecbc461711a50c0717c70e082378cc356e00bd829c29b48263024839`; importado em `2026-10-14T22:23:20.031336+00:00`; versão `xlsx-f149f420ecbc`.

## Inventário

| Fonte / aba | Linhas armazenadas / não vazias | Células | Fórmulas | Vazias | Marcadores de ausência | Multiline |
| --- | --- | --- | --- | --- | --- | --- |
| medications / Fichas | 70 / 70 | 770 | 0 | 0 | 144 | 0 |
| medications / Legenda | 8 / 8 | 15 | 1 | 0 | 0 | 1 |
| infusions / Página1 | 999 / 7 | 26973 | 0 | 26924 | 0 | 3 |

O inventário completo de células, tipos e fórmulas está em `frontend/data/clinical-resources.json` (`inventory`). As 11 colunas de Fichas e as sete de Página1 estão mapeadas com seus cabeçalhos originais em `clinicalSources.columns`. A fórmula de contagem na legenda não foi executada; não há cache numérico. Fórmulas clínicas estão armazenadas como texto. Unidades observadas são listadas literalmente em `inventory-summary.json`; não foram convertidas.

41 fichas indicam `Padrão PALS/SBP (validar)`. As outras 28 referem Ebook e também aguardam homologação. A legenda contém afirmações de referência validada e um exemplo de macete que não constituem autorização clínica.

Ceftriaxona 1g/pó aparece em Fichas 47 e 56, com vias EV/IM e IM em categorias distintas. As duas fichas mantêm IDs, dados e rótulos de navegação separados; não houve deduplicação clínica.

## Resumo de pendências

- `HOMOLOGATION_REQUIRED`: 75.
- `MISSING_SOURCE_FIELDS`: 68.
- `DIPYRONE_DIMENSION_REVIEW`: 2.
- `FINAL_VOLUME_UNDEFINED`: 6.
- `TIME_BASIS_UNVERIFIED`: 6.
- `SOURCE_TYPO`: 1.
- `VASOPRESSIN_UNITS`: 1.
- `BIBLIOGRAPHY_NOT_APPROVAL`: 1.
- `LEGEND_MNEMONIC_REVIEW`: 1.
- `FORMULA_CACHE_ABSENT`: 1.
- `SAME_PRESENTATION_CONTEXT`: 2.

## Lista rastreável

| Arquivo / aba / linha | Células | Pendência |
| --- | --- | --- |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 2 | K2 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 2 | H2, J2 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 2 | C2, D2, I2 | **DIPYRONE_DIMENSION_REVIEW**: Conferir separadamente a relação entre apresentação, dose habitual e macete. Aparente incompatibilidade dimensional na linha 2; a linha 3 requer revisão própria. Nenhum valor foi corrigido. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 3 | K3 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 3 | H3, J3 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 3 | C3, D3, I3 | **DIPYRONE_DIMENSION_REVIEW**: Conferir separadamente a relação entre apresentação, dose habitual e macete. Aparente incompatibilidade dimensional na linha 2; a linha 3 requer revisão própria. Nenhum valor foi corrigido. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 4 | K4 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 4 | I4, J4 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 5 | K5 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 5 | H5 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 6 | K6 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 6 | H6, I6, J6 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 7 | K7 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 7 | I7 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 8 | K8 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 8 | H8, I8, J8 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 9 | K9 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 9 | I9, J9 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 10 | K10 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 10 | I10 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 11 | K11 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 11 | H11, I11 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 12 | K12 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 12 | H12, I12 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 13 | K13 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 13 | I13 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 14 | K14 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 14 | H14, I14 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 15 | K15 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 15 | F15, H15, I15, J15 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 16 | K16 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 16 | F16, I16 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 17 | K17 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 17 | H17, I17, J17 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 18 | K18 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 18 | H18, I18, J18 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 19 | K19 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 19 | I19, J19 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 20 | K20 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 20 | H20, I20, J20 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 21 | K21 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 21 | I21, J21 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 22 | K22 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 22 | F22, I22, J22 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 23 | K23 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 23 | I23, J23 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 24 | K24 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 24 | J24 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 25 | K25 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 26 | K26 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 26 | H26 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 27 | K27 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 27 | H27, J27 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 28 | K28 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 28 | J28 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 29 | K29 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 29 | F29, H29 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 30 | K30 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 30 | F30, H30, J30 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 31 | K31 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 31 | H31 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 32 | K32 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 32 | H32, J32 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 33 | K33 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 33 | H33, I33, J33 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 34 | K34 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 34 | H34, I34, J34 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 35 | K35 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 35 | H35, I35, J35 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 36 | K36 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 36 | F36, H36, I36, J36 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 37 | K37 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 37 | H37, I37, J37 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 38 | K38 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 38 | F38, H38, I38 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 39 | K39 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 39 | F39, H39, I39, J39 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 40 | K40 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 40 | F40, H40, I40, J40 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 41 | K41 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 41 | H41, I41, J41 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 42 | K42 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 42 | H42, I42, J42 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 43 | K43 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 43 | H43, I43, J43 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 44 | K44 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 44 | H44, I44, J44 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 45 | K45 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 45 | I45 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 46 | K46 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 46 | F46, I46, J46 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 47 | K47 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 47 | I47 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 48 | K48 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 48 | I48 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 49 | K49 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 49 | I49 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 50 | K50 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 50 | F50, I50 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 51 | K51 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 51 | I51 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 52 | K52 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 52 | I52 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 53 | K53 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 53 | I53 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 54 | K54 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 54 | F54, I54 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 55 | K55 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 55 | I55 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 56 | K56 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 56 | I56 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 57 | K57 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 57 | I57 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 58 | K58 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 58 | I58 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 59 | K59 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 59 | I59 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 60 | K60 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 60 | I60 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 61 | K61 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 61 | F61, I61, J61 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Dose máxima, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 62 | K62 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 62 | E62, F62, H62, I62 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Intervalo, Dose máxima, Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 63 | K63 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 63 | E63, H63, I63, J63 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Intervalo, Preparo/Diluição, Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 64 | K64 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 64 | I64 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 65 | K65 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 65 | E65, F65, H65, I65 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Intervalo, Dose máxima, Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 66 | K66 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 66 | E66, H66, I66 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Intervalo, Preparo/Diluição, Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 67 | K67 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 67 | H67 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Preparo/Diluição |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 68 | K68 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 68 | I68, J68 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator), Alertas/Restrições |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 69 | K69 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 69 | I69 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 70 | K70 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 70 | I70 | **MISSING_SOURCE_FIELDS**: Campos não informados ou com marcador de ausência na fonte: Macete (fator) |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 4 | D4, E4 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 4 | E4, F4 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 4 | D4, G4 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 5 | D5, E5 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 5 | E5, F5 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 5 | D5, G5 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 5 | B5 | **SOURCE_TYPO**: Duplo sinal de igualdade na apresentação original: '1 mg/ml = = 1.000 mcg/ml'. Texto mantido. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 6 | D6, E6 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 6 | E6, F6 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 6 | D6, G6 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 7 | D7, E7 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 7 | E7, F7 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 7 | D7, G7 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 8 | D8, E8 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 8 | E8, F8 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 8 | D8, G8 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 9 | D9, E9 | **HOMOLOGATION_REQUIRED**: Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 9 | E9, F9 | **FINAL_VOLUME_UNDEFINED**: A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 9 | D9, G9 | **TIME_BASIS_UNVERIFIED**: Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados. |
| Drogas choque _ infusão contínua (1).xlsx / Página1 / 9 | B9, C9, D9, F9 | **VASOPRESSIN_UNITS**: Vasopressina usa ui/mui/mUI na fonte. Não aplicar fórmula de mcg/kg/min nem converter unidades silenciosamente. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Legenda / 3 | B3 | **BIBLIOGRAPHY_NOT_APPROVAL**: A legenda menciona validação por referência padrão. Isso não documenta homologação institucional das 28 fichas relacionadas ao Ebook. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Legenda / 4 | B4 | **LEGEND_MNEMONIC_REVIEW**: A legenda repete o macete de dipirona gotas e um exemplo de volume. Conferir junto à ficha da linha 2; não executar nem usar o exemplo como caso homologado. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Legenda / 8 | B8 | **FORMULA_CACHE_ABSENT**: A fórmula COUNTA foi preservada como texto; não há valor em cache. A contagem 69 foi obtida contando registros, sem executar fórmulas Excel. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 47 | A47, B47, C47, G47 | **SAME_PRESENTATION_CONTEXT**: Mesmo nome/apresentação em mais de um contexto de categoria/via. Registros mantidos separados, sem fusão de doses ou indicação de equivalência. |
| Base-Conhecimento-Pediatria-Doses (1).xlsx / Fichas / 56 | A56, B56, C56, G56 | **SAME_PRESENTATION_CONTEXT**: Mesmo nome/apresentação em mais de um contexto de categoria/via. Registros mantidos separados, sem fusão de doses ou indicação de equivalência. |
