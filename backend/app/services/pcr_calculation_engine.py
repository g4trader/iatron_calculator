from app.schemas.calculation import CalculationInput, CalculationRequest, PcrCalculationResponse, PcrDrug, PcrMetric
from app.services.calculation_engine import DISCLAIMER, r2


def fmt_number(value: float, decimals: int = 1) -> str:
    rounded = round(value + 1e-12, decimals)
    if rounded == int(rounded):
        return str(int(rounded))
    return f"{rounded:.{decimals}f}".replace(".", ",")


def fmt_ml(value: float, decimals: int = 1) -> str:
    return f"{fmt_number(value, decimals)} ml"


def pcr_drug(
    id: str,
    section: str,
    name: str,
    presentation: str,
    dose: str,
    volume_value: float | None = None,
    volume_text: str | None = None,
    dilution: str | None = None,
    note: str | None = None,
) -> PcrDrug:
    volume = volume_text if volume_text is not None else fmt_ml(volume_value or 0)
    is_less_than_1ml = volume_value is not None and volume_value < 1
    ui100 = r2(volume_value * 100) if is_less_than_1ml else None

    return PcrDrug(
        id=id,
        section=section,
        name=name,
        presentation=presentation,
        dose=dose,
        volume=volume,
        dilution=dilution,
        note=note,
        isLessThan1Ml=is_less_than_1ml,
        ui100=ui100,
    )


def surface_area(peso: float) -> float:
    return round(((peso * 4) + 7) / (peso + 90), 2)


def ambu_size(idade_anos: int, idade_meses: int) -> str:
    if idade_anos == 0:
        return "pequeno" if idade_meses < 3 else "médio"
    if idade_anos < 10:
        return "médio"
    if idade_anos < 19:
        return "grande"
    return "grande"


def oxygen_flow(idade_anos: int, idade_meses: int) -> str:
    if idade_anos == 0:
        return "10L" if idade_meses < 3 else "10-15L"
    if idade_anos < 10:
        return "10-15L"
    if idade_anos < 19:
        return "15L"
    return "15L"


def blade_size(idade_anos: int, idade_meses: int) -> str:
    if idade_anos == 0:
        return "pequena" if idade_meses < 6 else "média"
    return "média" if idade_anos < 12 else "grande"


def oral_depth_base(idade_anos: int, idade_meses: int) -> int:
    if idade_anos == 0:
        if idade_meses < 4:
            return 10
        if idade_meses < 9:
            return 11
        return 13
    if idade_anos in (1, 2, 3):
        return 13
    if idade_anos in (4, 5):
        return 15
    if idade_anos in (6, 7):
        return 17
    if idade_anos == 8:
        return 18
    if idade_anos in (9, 10, 11):
        return 19
    if idade_anos in (12, 13):
        return 20
    return 21


def tube_size(idade_anos: int, idade_meses: int) -> str:
    if idade_anos == 0:
        if idade_meses < 9:
            return "3,5"
        return "4,0" if idade_meses < 12 else "4,5"
    if idade_anos == 1:
        return "4,5"
    if idade_anos in (2, 3):
        return "5,0"
    if idade_anos in (4, 5):
        return "5,5"
    if idade_anos in (6, 7):
        return "6,0"
    if idade_anos in (8, 9, 10, 11):
        return "6,5"
    if idade_anos in (12, 13):
        return "7,0"
    return "7,5"


def nasal_depth_base(idade_anos: int, idade_meses: int) -> int:
    if idade_anos == 0:
        if idade_meses < 4:
            return 11
        if idade_meses < 9:
            return 13
        return 14
    if idade_anos < 4:
        return 16
    if idade_anos < 6:
        return 17
    if idade_anos < 8:
        return 19
    if idade_anos < 11:
        return 22
    if idade_anos < 14:
        return 23
    return 24


def calculate_pcr(payload: CalculationRequest) -> PcrCalculationResponse:
    peso = payload.pesoKg
    idade_anos = payload.idadeAnos
    idade_meses = payload.idadeMeses
    idade_total_meses = idade_anos * 12 + idade_meses

    tubo = tube_size(idade_anos, idade_meses)
    oral_base = oral_depth_base(idade_anos, idade_meses)
    nasal_base = nasal_depth_base(idade_anos, idade_meses)

    epinephrine_volume = peso * 0.1
    epinephrine_text = "1SD" if peso > 40 else fmt_ml(round(epinephrine_volume, 1))
    amiodarone_volume = 6 if peso > 40 else peso * 5 / 50
    calcium_base = min(peso, 30)

    return PcrCalculationResponse(
        input=CalculationInput(
            pesoKg=peso,
            idadeAnos=idade_anos,
            idadeMeses=idade_meses,
            idadeTotalMeses=idade_total_meses,
        ),
        calculator="Folha de PCR",
        airway=[
            PcrMetric(id="superficie-corporal", label="SC", value=str(surface_area(peso)).replace(".", ","), unit="m²"),
            PcrMetric(id="ambu", label="Ambu", value=ambu_size(idade_anos, idade_meses)),
            PcrMetric(id="fluxo-o2", label="Fluxo de O2", value=oxygen_flow(idade_anos, idade_meses)),
            PcrMetric(id="lamina", label="Lâmina", value=blade_size(idade_anos, idade_meses)),
            PcrMetric(id="tubo", label="Tubo", value=f"{fmt_number(float(tubo.replace(',', '.')) - 0.5)} - {tubo} - {fmt_number(float(tubo.replace(',', '.')) + 0.5)}"),
            PcrMetric(id="distancia-oral", label="Distância oral", value=f"{oral_base - 1} - {oral_base + 1}", unit="cm"),
            PcrMetric(id="distancia-nasal", label="Distância nasal", value=f"{nasal_base - 1} - {nasal_base + 1}", unit="cm"),
        ],
        cardiacArrest=[
            pcr_drug("epinefrina", "Parada cardíaca", "Epinefrina", "1 mg/ml", "0,01 mg/kg", epinephrine_volume, epinephrine_text, "Diluída 1 ml + 9 ml AD - 1:10.000"),
            pcr_drug("amiodarona", "Parada cardíaca", "Amiodarona", "50 mg/ml", "5 mg/kg", amiodarone_volume),
            pcr_drug("gluconato-calcio", "Parada cardíaca", "Gluco de Ca 10%", "100 mg/ml", "0,5 mEq/kg", min(peso * 2, 60), dilution=f"{fmt_ml(calcium_base)} GluCa + {fmt_ml(calcium_base)} AD"),
            pcr_drug("bicarbonato", "Parada cardíaca", "Bicarbonato 8,4%", "84 mg/ml", "1 mEq/kg", peso * 2, dilution=f"{fmt_ml(peso)} BICA + {fmt_ml(peso)} AD"),
        ],
        intubation=[
            pcr_drug("atropina", "Entubação", "Atropina", "0,25 mg/ml", "0,02 mg/kg", min(max(peso * 0.02 / 0.25, 0.2), 1)),
            pcr_drug("lidocaina-2", "Entubação", "Lidocaína a 2%", "20 mg/ml", "1 mg/kg", peso / 20),
            pcr_drug("midazolam", "Entubação", "Midazolam", "5 mg/ml", "0,2 mg/kg", min(peso * 0.2 / 5, 1)),
            pcr_drug("fentanil", "Entubação", "Fentanil", "50 µg/ml", "2 µg/kg", min(peso * 2 / 50, 1)),
            pcr_drug("thiopental", "Entubação", "Thiopental", "20 mg/ml", "2 mg/kg", peso * 2 / 20),
            pcr_drug("quetamina", "Entubação", "Quetamina", "50 mg/ml", "2 mg/kg", peso * 2 / 50),
            pcr_drug("etomidato", "Entubação", "Etomidato", "2 mg/ml", "0,2 mg/kg", peso * 0.2 / 2),
            pcr_drug("pancuronio", "Entubação", "Pancurônio", "2 mg/ml", "0,1 mg/kg", peso * 0.1 / 2),
            pcr_drug("atracurio", "Entubação", "Atracúrio", "10 mg/ml", "0,4 mg/kg", peso * 0.4 / 10),
        ],
        reversal=[
            pcr_drug("flumazenil", "Agentes de reversão", "Flumazenil", "0,1 mg/ml", "0,01 mg/kg", min(peso * 0.01 / 0.1, 2)),
            pcr_drug("naloxone", "Agentes de reversão", "Naloxone", "0,4 mg/ml", "0,01 mg/kg", min(peso * 0.01 / 0.4, 1)),
        ],
        usefulDrugs=[
            pcr_drug("morfina", "Outras drogas úteis", "Morfina", "10 mg/ml", "0,1 mg/kg", min(peso * 0.1, 4), dilution="Diluída 1 ml + 9 ml - 1 mg/ml"),
            pcr_drug("diazepam", "Outras drogas úteis", "Diazepam", "5 mg/ml", "0,5 mg/kg", min(peso * 0.5 / 5, 2)),
            pcr_drug("adenosina", "Outras drogas úteis", "Adenosina", "3 mg/ml", "0,1 mg/kg", min(peso * 0.1 / 3, 2)),
        ],
        shock=[
            PcrMetric(id="desfibrilacao-1", label="Desfibrilação 1º", value=fmt_number(peso * 2, 0), unit="J"),
            PcrMetric(id="desfibrilacao-2", label="Desfibrilação 2º", value=fmt_number(peso * 4, 0), unit="J"),
            PcrMetric(id="desfibrilacao-3", label="Desfibrilação 3º", value=fmt_number(peso * 4, 0), unit="J"),
        ],
        warnings=[DISCLAIMER, "Réplica técnica da planilha Folha de PCR. Conferir protocolo institucional antes da administração."],
    )
