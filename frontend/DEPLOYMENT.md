# Deploy de Produção

Este guia prepara o primeiro deploy funcional com PostgreSQL real e Auth.js ativo. Stripe fica como etapa seguinte.

## 1. Banco PostgreSQL

Use Neon se a prioridade for simplicidade com Vercel. Use Supabase se quiser evoluir para Storage, policies, painel operacional e recursos adicionais da plataforma.

### Neon

1. Crie um projeto PostgreSQL.
2. Copie a connection string de produção.
3. Use a string pooled para runtime serverless quando disponível.
4. Garanta SSL na URL, normalmente com `sslmode=require`.
5. Configure `DATABASE_URL` na Vercel.

### Supabase

1. Crie um projeto PostgreSQL.
2. Copie a connection string em Project Settings > Database.
3. Para Vercel/serverless, prefira o pooler quando disponível para `DATABASE_URL`.
4. Use a conexão direta em `DIRECT_URL` para Prisma migrations.
5. Garanta SSL na URL, normalmente com `sslmode=require`.
6. Configure `DATABASE_URL` e `DIRECT_URL` na Vercel.

## 2. Variáveis na Vercel

Configure em Project Settings > Environment Variables para Production:

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
AUTH_URL=https://frontend-two-lovat-72.vercel.app
NEXTAUTH_URL=https://frontend-two-lovat-72.vercel.app
TEMP_LOGIN_EMAIL=
TEMP_LOGIN_PASSWORD=
TEMP_LOGIN_USERS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=https://iatron-calculator-api-609095880025.us-central1.run.app
```

Google e Meta podem ficar ausentes temporariamente. Nesse caso, use `TEMP_LOGIN_EMAIL` e `TEMP_LOGIN_PASSWORD` ou `TEMP_LOGIN_USERS` para o acesso por credenciais até a ativação final do OAuth.

Formato de `TEMP_LOGIN_USERS`:

```text
email@dominio.com=senha;outro@dominio.com=outra-senha
```

Stripe ainda pode ficar pendente:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PROFESSIONAL_ANNUAL=
STRIPE_PRICE_HOSPITAL_CUSTOM=
```

Antes do deploy, valide localmente ou no ambiente de CI:

```bash
npm run env:check
```

## 3. Migrations

Depois de configurar `DATABASE_URL` real:

```bash
cd frontend
npx prisma migrate deploy
npx prisma generate
```

Ou use o atalho:

```bash
cd frontend
npm run prisma:deploy
```

Nunca use `prisma migrate reset` em produção.
Não edite o schema manualmente no painel do banco. Toda mudança estrutural deve entrar como migration versionada no repositório e ser aplicada com `prisma migrate deploy`.

## 4. OAuth Google

No Google Cloud Console, configure:

Authorized JavaScript origin:

```text
https://frontend-two-lovat-72.vercel.app
```

Authorized redirect URI:

```text
https://frontend-two-lovat-72.vercel.app/api/auth/callback/google
```

## 5. OAuth Meta/Facebook

No Meta Developers, configure:

Valid OAuth Redirect URI:

```text
https://frontend-two-lovat-72.vercel.app/api/auth/callback/facebook
```

## 6. Promover ADMIN

Depois que o primeiro usuário fizer login:

```bash
cd frontend
npm run admin:promote -- email@dominio.com
```

O comando usa `DATABASE_URL` e não imprime secrets.

## 7. Testes Pós-Deploy

1. Abrir `/`.
2. Abrir `/login`.
3. Fazer login com Google.
4. Acessar `/dashboard`.
5. Executar um cálculo clínico.
6. Confirmar que o histórico foi salvo.
7. Abrir `/profile`.
8. Abrir `/billing`.
9. Abrir `/api/health` e verificar `database: "connected"` e `auth: "configured"`.
10. Promover o usuário para ADMIN.
11. Acessar `/admin`.
12. Acessar `/admin/system`.

## 8. Build da Vercel

O build já executa Prisma Client antes do Next.js:

```bash
prisma generate && next build
```

O `postinstall` também executa:

```bash
prisma generate
```

Isso garante que o Prisma Client seja gerado durante o build da Vercel.
