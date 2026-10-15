# Rollback da publicação de mídia Mentory

Ponto de restauração anterior: `dpl_6DnonYnupReXhccZpHg3pVgjq1e3`, commit `546c4cc7eb6d4324d1cf6e3c391b49732cb09ae8`.

```sh
vercel rollback dpl_6DnonYnupReXhccZpHg3pVgjq1e3 --scope luciano-terres-projects --yes
```

Verificar `/api/health`, landing, proteção de `/mentory/admin` e cálculo PCR sintético após rollback. A publicação de mídia não altera schema, dados clínicos, autenticação ou pagamentos. O bucket privado permanece preservado: não excluir aulas ou arquivos para reverter frontend. A versão anterior não utiliza `MENTORY_VIDEO_BUCKET`. Se houver upload em andamento, pausar novos envios até concluir a investigação.
