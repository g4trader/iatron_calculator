# Calculadora de Emergência Pediátrica

Sistema web para cálculo de medicações, volumes, diluições, infusões contínuas, materiais de via aérea/acesso e desfibrilação/cardioversão pediátrica.

Disclaimer fixo do sistema:

> Ferramenta de apoio ao cálculo. Conferir dose, apresentação, concentração, protocolo institucional e avaliação clínica antes da administração.

## Estrutura

```text
frontend/  Next.js, React, TypeScript, Tailwind CSS
backend/   FastAPI, motor de cálculo separado, testes unitários, Dockerfile
```

## Produto SaaS

Rotas principais do frontend:

- `/` landing page premium
- `/login` autenticação social planejada para Auth.js
- `/checkout` checkout recorrente planejado para Stripe
- `/dashboard` área logada com calculadora clínica
- `/billing` gestão de assinatura
- `/profile` perfil do usuário
- `/admin` administração institucional

Próximas integrações reais:

- Auth.js com Google, Meta/Facebook e Apple
- PostgreSQL via Supabase/Neon com Prisma
- Stripe Checkout, Billing Portal e webhooks
- middleware de proteção de rotas e controle de acesso por assinatura

As regras ficam em funções explícitas em `backend/app/services/calculation_engine.py`, com metadados versionados em `backend/app/data/*.json` para futura migração para PostgreSQL/Supabase.

## Execução local

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Testes

```bash
cd backend
pytest
```

Os testes cobrem os cenários de 15 kg, 5 kg, 30 kg e 55 kg, incluindo limites máximos, doses menores que 1 ml, conversão para UI, via aérea, desfibrilação, glicose em menor de 12 meses e infusão contínua.

## Deploy Frontend na Vercel

1. Configure o projeto apontando para a pasta `frontend`.
2. Defina a variável:

```text
NEXT_PUBLIC_API_URL=https://SUA-API-GOOGLE-CLOUD-RUN
```

3. Build command: `npm run build`
4. Install command: `npm install`

## Deploy Backend no Google Cloud Run

O backend expõe `GET /health` e usa a porta `8080`.

Configure CORS para o domínio da Vercel:

```text
CORS_ORIGINS=https://SEU-PROJETO.vercel.app
```

Deploy:

```bash
cd backend
gcloud run deploy iatron-calculator-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars CORS_ORIGINS=https://SEU-PROJETO.vercel.app
```

Também é possível construir via Dockerfile:

```bash
docker build -t iatron-calculator-api ./backend
docker run -p 8080:8080 --env-file backend/.env.example iatron-calculator-api
```

## Regras suspeitas herdadas da planilha

- Ácido tranexâmico bolus: a planilha original parece usar referência `E2`. Implementado como `pesoKg * 0.3` e marcado com TODO técnico para validação clínica.
- Adenosina 2ª dose: a condição compara `pesoKg * 0.067 < 2`, mas quando excede aplica `4 ml`. Regra mantida e marcada com TODO técnico para validação clínica.
