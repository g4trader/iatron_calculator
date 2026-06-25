from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.calculate import router as calculate_router
from app.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Calculadora de Emergencia Pediatrica API",
    version="1.0.0",
    description="API REST para calculos de medicacoes, via aerea e choque pediatrico.",
)

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(calculate_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

