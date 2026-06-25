from collections.abc import Callable

from app.schemas.calculation import (
    AirwayMaterials,
    CalculationInput,
    CalculationRequest,
    CalculationResponse,
    MedicationResult,
    Shock,
)

DISCLAIMER = (
    "Ferramenta de apoio ao cálculo. Conferir dose, apresentação, concentração, "
    "protocolo institucional e avaliação clínica antes da administração."
)


def r2(value: float) -> float:
    return round(value + 1e-12, 2)


def with_small_dose_fields(result: MedicationResult, raw_dose_volume: float | None = None) -> MedicationResult:
    dose_volume = raw_dose_volume
    if dose_volume is None:
        dose_volume = result.administeredVolumeMl if result.administeredVolumeMl is not None else result.volumeMl
    if dose_volume is not None and dose_volume < 1:
        result.isLessThan1Ml = True
        result.ui100 = r2(dose_volume * 100)
        result.notes.append(
            f"Atenção: dose menor que 1 ml — equivalente aproximado: {result.ui100:g} UI em seringa de 100 UI"
        )
    return result


def med(
    id: str,
    name: str,
    presentation: str,
    category: str = "medication",
    route: str | None = None,
    volumeMl: float | None = None,
    dilutionMl: float | None = None,
    finalVolumeMl: float | None = None,
    administeredVolumeMl: float | None = None,
    infusionRateMlH: float | None = None,
    notes: list[str] | None = None,
) -> MedicationResult:
    raw_dose_volume = administeredVolumeMl if administeredVolumeMl is not None else volumeMl
    return with_small_dose_fields(
        MedicationResult(
            id=id,
            name=name,
            presentation=presentation,
            category=category,
            route=route,
            volumeMl=r2(volumeMl) if volumeMl is not None else None,
            dilutionMl=r2(dilutionMl) if dilutionMl is not None else None,
            finalVolumeMl=r2(finalVolumeMl) if finalVolumeMl is not None else None,
            administeredVolumeMl=r2(administeredVolumeMl) if administeredVolumeMl is not None else None,
            infusionRateMlH=r2(infusionRateMlH) if infusionRateMlH is not None else None,
            notes=notes or [],
        ),
        raw_dose_volume,
    )


def calculate_medications(peso: float, idade_total_meses: int) -> list[MedicationResult]:
    txa_volume = peso * 0.3
    glicose_volume = peso
    glicose_diluicao = glicose_volume * 4 if idade_total_meses < 12 else glicose_volume
    fenitoina_volume = peso * 0.3
    fenobarbital_volume = peso * 0.15

    return [
        med(
            "acido-tranexamico-bolus",
            "Ácido tranexâmico",
            "50 mg/ml",
            route="Bolus",
            volumeMl=txa_volume,
            notes=[
                "TODO validação clínica: planilha original parece referenciar E2; implementado como pesoKg * 0,3."
            ],
        ),
        med(
            "acido-tranexamico-infusao-8h",
            "Ácido tranexâmico",
            "50 mg/ml",
            category="continuous_infusion",
            route="Infusão contínua 8h",
            volumeMl=txa_volume,
            dilutionMl=txa_volume * 4,
            finalVolumeMl=txa_volume * 5,
            infusionRateMlH=(txa_volume * 5) / 8,
        ),
        med("adenosina-primeira-dose", "Adenosina", "6 mg/2 ml", route="1ª dose", volumeMl=min(peso * 0.034, 2)),
        med(
            "adenosina-segunda-dose",
            "Adenosina",
            "6 mg/2 ml",
            route="2ª dose",
            volumeMl=peso * 0.067 if peso * 0.067 < 2 else 4,
            notes=["TODO validação clínica: condição usa 2 ml, mas limite aplicado é 4 ml."],
        ),
        med("adrenalina-1000", "Adrenalina", "1:1000", volumeMl=10 if peso > 50 else peso * 0.1),
        med("amiodarona-bolus", "Amiodarona", "50 mg/ml", route="Bolus", volumeMl=min(peso * 0.1, 6)),
        med(
            "amiodarona-infusao",
            "Amiodarona",
            "50 mg/ml",
            category="continuous_infusion",
            route="Infusão",
            volumeMl=peso * 10 / 3,
        ),
        med("atropina-025", "Atropina", "0,25 mg/ml", volumeMl=min(peso * 0.08, 2)),
        med("atropina-05", "Atropina", "0,5 mg/ml", volumeMl=min(peso * 0.04, 1)),
        med(
            "bicarbonato-sodio-84",
            "Bicarbonato de Sódio",
            "8,4%",
            volumeMl=peso,
            dilutionMl=peso,
            finalVolumeMl=peso * 2,
        ),
        med("cetamina", "Cetamina", "50 mg/ml", volumeMl=2 if peso > 50 else peso * 0.04),
        med("cisatracurio", "Cisatracúrio", "2 mg/ml", volumeMl=2 if peso > 40 else peso * 0.05),
        med(
            "cloreto-calcio-10",
            "Cloreto de Cálcio",
            "10%",
            volumeMl=min(peso * 0.2, 3.5),
            dilutionMl=min(peso * 0.6, 16.5),
        ),
        med(
            "cloreto-sodio-20-diluida",
            "Cloreto de sódio",
            "20% diluída",
            volumeMl=15,
            dilutionMl=85,
            finalVolumeMl=100,
            administeredVolumeMl=100 if peso > 20 else peso * 5,
        ),
        med(
            "dobutamina",
            "Dobutamina",
            "250 mg/20 ml",
            category="continuous_infusion",
            volumeMl=2,
            dilutionMl=48,
            finalVolumeMl=50,
            infusionRateMlH=peso * 0.6,
        ),
        med("etomidato", "Etomidato", "20 mg/10 ml", volumeMl=peso * 0.1),
        med("fenitoina", "Fenitoína", "50 mg/ml", volumeMl=fenitoina_volume, dilutionMl=(50 if fenitoina_volume > 4 else 20) - fenitoina_volume),
        med("fenobarbital", "Fenobarbital", "100 mg/ml", volumeMl=fenobarbital_volume, dilutionMl=(50 if fenobarbital_volume > 4 else 20) - fenobarbital_volume),
        med("fentanil-bolus", "Fentanil", "50 mcg/ml", route="Bolus", volumeMl=2 if peso > 50 else peso * 2 / 50),
        med(
            "fentanil-infusao",
            "Fentanil",
            "50 mcg/ml",
            category="continuous_infusion",
            route="Infusão contínua",
            volumeMl=2,
            dilutionMl=48,
            finalVolumeMl=50,
            infusionRateMlH=peso,
        ),
        med("glicose-50", "Glicose", "50%", volumeMl=glicose_volume, dilutionMl=glicose_diluicao, finalVolumeMl=glicose_volume + glicose_diluicao),
        med("gluconato-calcio-10", "Gluconato de Cálcio", "10%", volumeMl=min(peso * 0.6, 10), dilutionMl=min(peso * 0.6, 10)),
        med("lidocaina-1", "Lidocaína", "1%", volumeMl=peso * 0.1),
        med("manitol-20", "Manitol", "20%", volumeMl=peso * 2.5),
        med("midazolam-bolus", "Midazolam", "15 mg/3 ml", route="Bolus", volumeMl=2 if peso > 50 else peso * 0.04),
        med(
            "midazolam-infusao",
            "Midazolam",
            "15 mg/3 ml",
            category="continuous_infusion",
            route="Infusão contínua",
            volumeMl=5,
            dilutionMl=45,
            finalVolumeMl=50,
            infusionRateMlH=peso * 0.12,
        ),
        med(
            "milrinona",
            "Milrinona",
            "1 mg/ml",
            category="continuous_infusion",
            volumeMl=10,
            dilutionMl=90,
            finalVolumeMl=100,
            infusionRateMlH=peso * 0.15,
        ),
        med("morfina", "Morfina", "10 mg/ml", volumeMl=1, dilutionMl=9, finalVolumeMl=10, administeredVolumeMl=5 if peso > 50 else peso * 0.1),
        med("naloxona", "Naloxona", "0,4 mg/ml", volumeMl=5 if peso > 20 else peso * 0.25),
        med("fenilefrina-im-sc", "Fenilefrina", "10 mg/ml", route="IM ou SC", volumeMl=peso * 0.01),
        med("fenilefrina-iv", "Fenilefrina", "10 mg/ml", route="IV", volumeMl=1, dilutionMl=9, finalVolumeMl=10, administeredVolumeMl=peso * 5 / 1000),
        med(
            "fenilefrina-infusao",
            "Fenilefrina",
            "10 mg/ml",
            category="continuous_infusion",
            route="Infusão contínua",
            volumeMl=5,
            infusionRateMlH=peso * 0.1 / 0.833,
        ),
        med("propofol", "Propofol", "200 mg/20 ml", volumeMl=peso * 0.25),
        med("rocuronio", "Rocurônio", "10 mg/ml", volumeMl=5 if peso > 50 else peso * 0.1),
        med("succinilcolina", "Succinilcolina", "100 mg/10 ml", volumeMl=peso * 0.1),
    ]


Rule = tuple[Callable[[float, int], bool], str]


def choose(rules: list[Rule], peso: float, idade_anos: int) -> str:
    for condition, value in rules:
        if condition(peso, idade_anos):
            return value
    raise RuntimeError("No matching airway rule")


def calculate_airway(peso: float, idade_anos: int) -> AirwayMaterials:
    return AirwayMaterials(
        tuboTraqueal=choose([
            (lambda p, a: p < 11, "3,0"),
            (lambda p, a: a < 2, "3,5"),
            (lambda p, a: a < 4, "4,0"),
            (lambda p, a: a < 6, "4,5"),
            (lambda p, a: a < 8, "5,0"),
            (lambda p, a: a < 10, "5,5"),
            (lambda p, a: a < 12, "6,0"),
            (lambda p, a: a < 14, "6,5"),
            (lambda p, a: True, "7,0-8,0"),
        ], peso, idade_anos),
        lamina=choose([
            (lambda p, a: p < 3, "reta 0-1"),
            (lambda p, a: p < 10, "reta 1"),
            (lambda p, a: a < 2, "curva 1-2"),
            (lambda p, a: a < 6, "curva 2"),
            (lambda p, a: a < 12, "curva 2-3"),
            (lambda p, a: True, "curva 3"),
        ], peso, idade_anos),
        fixacaoProfundidade=choose([
            (lambda p, a: p < 3, "7-8"),
            (lambda p, a: p < 10, "9-10"),
            (lambda p, a: a < 2, "11"),
            (lambda p, a: a < 4, "12"),
            (lambda p, a: a < 6, "14"),
            (lambda p, a: a < 8, "15"),
            (lambda p, a: a < 10, "16"),
            (lambda p, a: a < 12, "17"),
            (lambda p, a: True, "18-20"),
        ], peso, idade_anos),
        jelcoDescompressaoToracica=choose([
            (lambda p, a: p < 3, "20"),
            (lambda p, a: a < 4, "18"),
            (lambda p, a: a < 8, "16"),
            (lambda p, a: True, "14"),
        ], peso, idade_anos),
        sondaAspiracao=choose([
            (lambda p, a: p < 3, "5-6"),
            (lambda p, a: p < 10, "6-8"),
            (lambda p, a: a < 4, "8"),
            (lambda p, a: a < 10, "10"),
            (lambda p, a: True, "12"),
        ], peso, idade_anos),
        drenoTorax=choose([
            (lambda p, a: p < 3, "8-10"),
            (lambda p, a: p < 10, "10-12"),
            (lambda p, a: a < 4, "16-20"),
            (lambda p, a: a < 8, "20-28"),
            (lambda p, a: a < 14, "28-32"),
            (lambda p, a: True, "32-38"),
        ], peso, idade_anos),
        cateterVenosoCentral=choose([
            (lambda p, a: p < 3, "3F/24G"),
            (lambda p, a: p < 10, "3F/22G"),
            (lambda p, a: a < 2, "4F/20-22G"),
            (lambda p, a: a < 4, "5F/20G"),
            (lambda p, a: a < 8, "5F/18G"),
            (lambda p, a: a < 12, "6F/16-18G"),
            (lambda p, a: a < 14, "6F/16G"),
            (lambda p, a: True, "6F/14-16G"),
        ], peso, idade_anos),
        jelcoPia=choose([
            (lambda p, a: p < 3, "24"),
            (lambda p, a: a < 2, "22-24"),
            (lambda p, a: a < 8, "22"),
            (lambda p, a: a < 12, "20-22"),
            (lambda p, a: True, "20"),
        ], peso, idade_anos),
        svd=choose([
            (lambda p, a: p < 3, "4-6"),
            (lambda p, a: p < 10, "6-8"),
            (lambda p, a: a < 6, "8-10"),
            (lambda p, a: a < 14, "10-12"),
            (lambda p, a: True, "14"),
        ], peso, idade_anos),
        bougie=choose([
            (lambda p, a: a < 2, "6Fr"),
            (lambda p, a: a < 12, "10Fr"),
            (lambda p, a: True, "15Fr"),
        ], peso, idade_anos),
    )


def calculate_shock(peso: float) -> Shock:
    return Shock(
        desfibrilacaoPrimeiraDoseJ=r2(200 if peso > 50 else peso * 2),
        desfibrilacaoSegundaDoseJ=r2(200 if peso > 50 else peso * 4),
        cardioversaoJ=r2(peso),
    )


def calculate(payload: CalculationRequest) -> CalculationResponse:
    idade_total_meses = payload.idadeAnos * 12 + payload.idadeMeses
    medications = calculate_medications(payload.pesoKg, idade_total_meses)
    small_dose_count = sum(1 for item in medications if item.isLessThan1Ml)
    warnings = [DISCLAIMER]
    if small_dose_count:
        warnings.append(f"{small_dose_count} dose(s) menor(es) que 1 ml exigem atenção e conversão para seringa de 100 UI.")

    return CalculationResponse(
        input=CalculationInput(
            pesoKg=payload.pesoKg,
            idadeAnos=payload.idadeAnos,
            idadeMeses=payload.idadeMeses,
            idadeTotalMeses=idade_total_meses,
        ),
        medications=medications,
        airwayMaterials=calculate_airway(payload.pesoKg, payload.idadeAnos),
        shock=calculate_shock(payload.pesoKg),
        warnings=warnings,
    )
