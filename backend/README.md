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

Deploy Cloud Run a partir de `backend/`, após reautenticar, confirmar o billing e preparar a identidade de execução conforme [MIGRACAO_GCP.md](../MIGRACAO_GCP.md):

```bash
gcloud run deploy iatron-calculator-api \
  --project stg1-508713 \
  --account operacional@southmedia.com.br \
  --source . \
  --region us-central1 \
  --no-invoker-iam-check \
  --port 8080 \
  --service-account iatron-api-runtime@stg1-508713.iam.gserviceaccount.com \
  --env-vars-file cloud-run.env.yaml
```
