# Revisão médica dos recursos documentais

Nenhum dos 75 registros possui homologação cadastrada. A homologação informada para a V3/Folha PCR não foi reutilizada para estas novas fontes. A consulta está disponível somente com a política de acesso existente; mesmo administradores não podem liberar cálculos nesta entrega.

## Roteiro de conferência

1. Conferir os dois XLSX originais em `docs/` contra os SHA-256 do relatório. As cópias em `iatron_clinical_resources/` têm os mesmos bytes. Não editar os originais; eventuais correções devem constituir uma nova versão revisada.
2. Abrir Biblioteca de medicamentos. Buscar `dipirona`, conferir as três apresentações separadas e navegar entre elas. Comparar todos os campos com Fichas, linhas 2–4. Abrir “Fonte e rastreabilidade” e “Texto bruto de cada célula”.
3. Revisar todas as 69 fichas, não apenas as 41 marcadas PALS/SBP. A referência Ebook das outras 28 não é homologação institucional. Para campos ausentes, registrar explicitamente se são não aplicáveis ou se exigem complementação; o sistema não inventa valores.
4. Conferir as inconsistências dimensionais apontadas para as duas apresentações de dipirona separadamente. Revisar também o exemplo da Legenda, B4. Os textos originais não foram corrigidos.
5. Abrir Infusão contínua e conferir cada uma das seis drogas, linhas 4–9 de Página1. Verificar apresentação, faixa de dose, fórmula textual, diluição, concentração e macete. Definir inequivocamente volume final, concentração e base temporal antes de qualquer implementação futura.
6. Revisar noradrenalina B5 (duplo “=”) e vasopressina B9/C9/D9/F9 (ui/mui/mUI). Nenhuma conversão de unidades ou aplicação de fórmula genérica foi implementada.
7. Documentar para cada registro/protocolo: responsável habilitado e identificação profissional, instituição, decisão, data, evidência externa, arquivo/aba/linha/células, hash e versão revisados, justificativa e alterações propostas. “Rejeitado” e “pendente” não podem ser tratados como aprovados.
8. Para uma futura calculadora, fornecer casos de referência homologados, limites por protocolo, unidades explícitas e conferência independente de dimensão/concentração. Não fornecer dados reais de pacientes nos casos de teste.

## Limite desta entrega

Não há tela, API, seed ou botão de aprovação. A importação não sobrescreve registros com status revisado nem registros de aprovação. O servidor recusa snapshots com aprovação alterada, e a política de capacidade mantém cálculo, prescrição e exportação de recomendação desativados, inclusive quando uma flag de status é adulterada. A ativação futura exige trabalho separado, evidência externa e autorização explícita; alterar um JSON não libera a calculadora.

Campos da calculadora de infusão ficam vazios e desabilitados. Textos numéricos da planilha são apresentados apenas como transcrição documental com aviso, nunca como saída calculada. A impressão pelo próprio navegador conserva um aviso documental; não há ação de exportação ou prescrição no produto.

## Rotas para revisão local

- `/dashboard/biblioteca-medicamentos`
- `/dashboard/biblioteca-medicamentos/medications-002` (exemplo de ficha real da fonte)
- `/dashboard/biblioteca-medicamentos/[id]` (cada apresentação tem ID estável por fonte/linha)
- `/dashboard/infusao-continua`

Não há alterações nas rotas ou motores existentes. Os testes automatizados comprovam integridade técnica e bloqueios, não homologam conteúdo clínico.
