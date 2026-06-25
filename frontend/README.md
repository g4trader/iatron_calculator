# Frontend

Next.js com React, TypeScript e Tailwind CSS.

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Variável obrigatória:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Na Vercel, configure o root directory como `frontend` e aponte `NEXT_PUBLIC_API_URL` para a URL do Cloud Run.

