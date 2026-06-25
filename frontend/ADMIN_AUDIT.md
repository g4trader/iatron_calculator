# Auditoria Administrativa

O módulo `/admin/audit` permite rastrear ações administrativas e eventos relevantes de governança. A rota exige `admin.audit.view`.

## Recursos

- Timeline e tabela paginada server-side.
- Filtros por ator, ação, resourceType, outcome e data.
- Detalhe do evento em `/admin/audit/[id]`.
- Exportação em `/admin/audit/export?format=csv` ou `format=json`.
- Metadata JSON sanitizada.

## Sanitização

Chaves contendo termos como `secret`, `token`, `password`, `authorization`, `signature`, `cookie`, `session`, `hash`, `raw` ou `payload` são exibidas como `[redacted]`.

## Limites

Exportações são limitadas a até 1000 eventos por requisição para evitar carga excessiva. A auditoria exibe trilha administrativa do banco local; logs estruturados externos seguem fora deste módulo.
