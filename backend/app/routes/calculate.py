from fastapi import APIRouter

from app.schemas.calculation import CalculationRequest, CalculationResponse, PcrCalculationResponse
from app.services.calculation_engine import calculate
from app.services.pcr_calculation_engine import calculate_pcr

router = APIRouter()


@router.post("/calculate", response_model=CalculationResponse)
def calculate_endpoint(payload: CalculationRequest) -> CalculationResponse:
    return calculate(payload)


@router.post("/calculate/pcr", response_model=PcrCalculationResponse)
def calculate_pcr_endpoint(payload: CalculationRequest) -> PcrCalculationResponse:
    return calculate_pcr(payload)
