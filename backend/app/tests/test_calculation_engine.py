from app.schemas.calculation import CalculationRequest
from app.services.calculation_engine import calculate


def medication(response, medication_id: str):
    return next(item for item in response.medications if item.id == medication_id)


def test_case_15kg_4y_1m_limits_airway_shock_and_infusion():
    response = calculate(CalculationRequest(pesoKg=15, idadeAnos=4, idadeMeses=1))

    assert response.input.idadeTotalMeses == 49
    assert medication(response, "adenosina-primeira-dose").volumeMl == 0.51
    assert medication(response, "atropina-025").volumeMl == 1.2
    assert medication(response, "midazolam-infusao").infusionRateMlH == 1.8
    assert response.airwayMaterials.tuboTraqueal == "4,5"
    assert response.airwayMaterials.lamina == "curva 2"
    assert response.shock.desfibrilacaoPrimeiraDoseJ == 30
    assert response.shock.desfibrilacaoSegundaDoseJ == 60


def test_case_5kg_0y_6m_small_doses_and_neonate_glicose():
    response = calculate(CalculationRequest(pesoKg=5, idadeAnos=0, idadeMeses=6))

    atropina = medication(response, "atropina-05")
    glicose = medication(response, "glicose-50")
    fenilefrina_iv = medication(response, "fenilefrina-iv")

    assert atropina.volumeMl == 0.2
    assert atropina.isLessThan1Ml is True
    assert atropina.ui100 == 20
    assert fenilefrina_iv.administeredVolumeMl == 0.03
    assert fenilefrina_iv.ui100 == 2.5
    assert glicose.volumeMl == 5
    assert glicose.dilutionMl == 20
    assert glicose.finalVolumeMl == 25
    assert response.airwayMaterials.tuboTraqueal == "3,0"
    assert response.shock.cardioversaoJ == 5


def test_case_30kg_9y_0m_airway_and_continuous_infusion():
    response = calculate(CalculationRequest(pesoKg=30, idadeAnos=9, idadeMeses=0))

    assert medication(response, "adenosina-primeira-dose").volumeMl == 1.02
    assert medication(response, "adenosina-segunda-dose").volumeMl == 4
    assert medication(response, "dobutamina").infusionRateMlH == 18
    assert response.airwayMaterials.tuboTraqueal == "5,5"
    assert response.airwayMaterials.jelcoPia == "20-22"
    assert response.shock.desfibrilacaoPrimeiraDoseJ == 60
    assert response.shock.desfibrilacaoSegundaDoseJ == 120


def test_case_55kg_14y_0m_maximum_doses_and_adult_airway():
    response = calculate(CalculationRequest(pesoKg=55, idadeAnos=14, idadeMeses=0))

    assert medication(response, "adenosina-primeira-dose").volumeMl == 1.87
    assert medication(response, "adrenalina-1000").volumeMl == 10
    assert medication(response, "amiodarona-bolus").volumeMl == 5.5
    assert medication(response, "rocuronio").volumeMl == 5
    assert response.airwayMaterials.tuboTraqueal == "7,0-8,0"
    assert response.airwayMaterials.bougie == "15Fr"
    assert response.shock.desfibrilacaoPrimeiraDoseJ == 200
    assert response.shock.desfibrilacaoSegundaDoseJ == 200

