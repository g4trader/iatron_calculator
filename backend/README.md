# Backend

API FastAPI com motor de cálculo isolado em `app/services/calculation_engine.py`.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
pytest
```

Endpoints:

- `GET /health`
- `POST /calculate`
- `POST /calculate/pcr`

Deploy Cloud Run:

```bash
gcloud run deploy iatron-calculator-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars CORS_ORIGINS=https://SEU-PROJETO.vercel.app
```
