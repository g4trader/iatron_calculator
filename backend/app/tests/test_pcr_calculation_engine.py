from app.schemas.calculation import CalculationRequest
from app.services.pcr_calculation_engine import calculate_pcr


def test_pcr_sheet_reference_case_15kg_5y_2m():
    result = calculate_pcr(CalculationRequest(pesoKg=15, idadeAnos=5, idadeMeses=2))

    airway = {item.id: item for item in result.airway}
    arrest = {item.id: item for item in result.cardiacArrest}
    intubation = {item.id: item for item in result.intubation}
    shock = {item.id: item for item in result.shock}

    assert airway["superficie-corporal"].value == "0,64"
    assert airway["ambu"].value == "médio"
    assert airway["fluxo-o2"].value == "10-15L"
    assert airway["lamina"].value == "média"
    assert airway["tubo"].value == "5 - 5,5 - 6"
    assert airway["distancia-oral"].value == "14 - 16"
    assert airway["distancia-nasal"].value == "16 - 18"

    assert arrest["epinefrina"].volume == "1,5 ml"
    assert arrest["amiodarona"].volume == "1,5 ml"
    assert arrest["bicarbonato"].volume == "30 ml"
    assert intubation["midazolam"].volume == "0,6 ml"
    assert intubation["fentanil"].volume == "0,6 ml"
    assert intubation["fentanil"].isLessThan1Ml is True
    assert shock["desfibrilacao-1"].value == "30"
    assert shock["desfibrilacao-2"].value == "60"
