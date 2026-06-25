from pydantic import BaseModel, Field


class CalculationRequest(BaseModel):
    pesoKg: float = Field(gt=0)
    idadeAnos: int = Field(ge=0)
    idadeMeses: int = Field(ge=0, le=11)


class CalculationInput(BaseModel):
    pesoKg: float
    idadeAnos: int
    idadeMeses: int
    idadeTotalMeses: int


class MedicationResult(BaseModel):
    id: str
    name: str
    presentation: str
    category: str
    route: str | None = None
    volumeMl: float | None = None
    dilutionMl: float | None = None
    finalVolumeMl: float | None = None
    administeredVolumeMl: float | None = None
    infusionRateMlH: float | None = None
    ui100: float | None = None
    isLessThan1Ml: bool = False
    notes: list[str] = []


class AirwayMaterials(BaseModel):
    tuboTraqueal: str
    lamina: str
    fixacaoProfundidade: str
    jelcoDescompressaoToracica: str
    sondaAspiracao: str
    drenoTorax: str
    cateterVenosoCentral: str
    jelcoPia: str
    svd: str
    bougie: str


class Shock(BaseModel):
    desfibrilacaoPrimeiraDoseJ: float
    desfibrilacaoSegundaDoseJ: float
    cardioversaoJ: float


class CalculationResponse(BaseModel):
    input: CalculationInput
    medications: list[MedicationResult]
    airwayMaterials: AirwayMaterials
    shock: Shock
    warnings: list[str]


class PcrMetric(BaseModel):
    id: str
    label: str
    value: str
    unit: str | None = None
    note: str | None = None


class PcrDrug(BaseModel):
    id: str
    section: str
    name: str
    presentation: str
    dose: str
    volume: str
    dilution: str | None = None
    note: str | None = None
    isLessThan1Ml: bool = False
    ui100: float | None = None


class PcrCalculationResponse(BaseModel):
    input: CalculationInput
    calculator: str
    airway: list[PcrMetric]
    cardiacArrest: list[PcrDrug]
    intubation: list[PcrDrug]
    reversal: list[PcrDrug]
    usefulDrugs: list[PcrDrug]
    shock: list[PcrMetric]
    warnings: list[str]
