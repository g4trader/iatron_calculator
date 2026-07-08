import type { CalculationRequest, PcrCalculationResponse, PcrDrug, PcrMetric } from "@/types/calculations";

const DISCLAIMER =
  "Ferramenta de apoio ao cálculo. Conferir dose, apresentação, concentração, protocolo institucional e avaliação clínica antes da administração.";

function r2(value: number) {
  return Math.round((value + 1e-12) * 100) / 100;
}

function fmtNumber(value: number, decimals = 1) {
  const rounded = Number((value + 1e-12).toFixed(decimals));
  if (rounded === Math.trunc(rounded)) {
    return String(Math.trunc(rounded));
  }
  return rounded.toFixed(decimals).replace(".", ",");
}

function fmtMl(value: number, decimals = 1) {
  return `${fmtNumber(value, decimals)} ml`;
}

function pcrDrug(
  id: string,
  section: string,
  name: string,
  presentation: string,
  dose: string,
  volumeValue?: number | null,
  volumeText?: string | null,
  dilution?: string | null,
  note?: string | null
): PcrDrug {
  const volume = volumeText ?? fmtMl(volumeValue ?? 0);
  const isLessThan1Ml = typeof volumeValue === "number" && volumeValue < 1;
  return {
    id,
    section,
    name,
    presentation,
    dose,
    volume,
    dilution,
    note,
    isLessThan1Ml,
    ui100: isLessThan1Ml && typeof volumeValue === "number" ? r2(volumeValue * 100) : null
  };
}

function surfaceArea(peso: number) {
  return Number((((peso * 4) + 7) / (peso + 90)).toFixed(2));
}

function ambuSize(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) return idadeMeses < 3 ? "pequeno" : "médio";
  if (idadeAnos < 10) return "médio";
  return "grande";
}

function oxygenFlow(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) return idadeMeses < 3 ? "10L" : "10-15L";
  if (idadeAnos < 10) return "10-15L";
  return "15L";
}

function bladeSize(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) return idadeMeses < 6 ? "pequena" : "média";
  return idadeAnos < 12 ? "média" : "grande";
}

function oralDepthBase(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) {
    if (idadeMeses < 4) return 10;
    if (idadeMeses < 9) return 11;
    return 13;
  }
  if ([1, 2, 3].includes(idadeAnos)) return 13;
  if ([4, 5].includes(idadeAnos)) return 15;
  if ([6, 7].includes(idadeAnos)) return 17;
  if (idadeAnos === 8) return 18;
  if ([9, 10, 11].includes(idadeAnos)) return 19;
  if ([12, 13].includes(idadeAnos)) return 20;
  return 21;
}

function tubeSize(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) {
    if (idadeMeses < 9) return "3,5";
    return idadeMeses < 12 ? "4,0" : "4,5";
  }
  if (idadeAnos === 1) return "4,5";
  if ([2, 3].includes(idadeAnos)) return "5,0";
  if ([4, 5].includes(idadeAnos)) return "5,5";
  if ([6, 7].includes(idadeAnos)) return "6,0";
  if ([8, 9, 10, 11].includes(idadeAnos)) return "6,5";
  if ([12, 13].includes(idadeAnos)) return "7,0";
  return "7,5";
}

function nasalDepthBase(idadeAnos: number, idadeMeses: number) {
  if (idadeAnos === 0) {
    if (idadeMeses < 4) return 11;
    if (idadeMeses < 9) return 13;
    return 14;
  }
  if (idadeAnos < 4) return 16;
  if (idadeAnos < 6) return 17;
  if (idadeAnos < 8) return 19;
  if (idadeAnos < 11) return 22;
  if (idadeAnos < 14) return 23;
  return 24;
}

function metric(id: string, label: string, value: string, unit?: string): PcrMetric {
  return { id, label, value, unit };
}

export function calculatePcrLocally(payload: CalculationRequest): PcrCalculationResponse {
  const peso = payload.pesoKg;
  const idadeAnos = payload.idadeAnos;
  const idadeMeses = payload.idadeMeses;
  const idadeTotalMeses = idadeAnos * 12 + idadeMeses;

  const tubo = tubeSize(idadeAnos, idadeMeses);
  const tuboNumber = Number(tubo.replace(",", "."));
  const oralBase = oralDepthBase(idadeAnos, idadeMeses);
  const nasalBase = nasalDepthBase(idadeAnos, idadeMeses);
  const epinephrineVolume = peso * 0.1;
  const epinephrineText = peso > 40 ? "1SD" : fmtMl(Number(epinephrineVolume.toFixed(1)));
  const amiodaroneVolume = peso > 40 ? 6 : (peso * 5) / 50;
  const calciumBase = Math.min(peso, 30);

  return {
    input: {
      pesoKg: peso,
      idadeAnos,
      idadeMeses,
      idadeTotalMeses
    },
    calculator: "Folha de PCR",
    airway: [
      metric("superficie-corporal", "SC", String(surfaceArea(peso)).replace(".", ","), "m²"),
      metric("ambu", "Ambu", ambuSize(idadeAnos, idadeMeses)),
      metric("fluxo-o2", "Fluxo de O2", oxygenFlow(idadeAnos, idadeMeses)),
      metric("lamina", "Lâmina", bladeSize(idadeAnos, idadeMeses)),
      metric("tubo", "Tubo", `${fmtNumber(tuboNumber - 0.5)} - ${tubo} - ${fmtNumber(tuboNumber + 0.5)}`),
      metric("distancia-oral", "Distância oral", `${oralBase - 1} - ${oralBase + 1}`, "cm"),
      metric("distancia-nasal", "Distância nasal", `${nasalBase - 1} - ${nasalBase + 1}`, "cm")
    ],
    cardiacArrest: [
      pcrDrug("epinefrina", "Parada cardíaca", "Epinefrina", "1 mg/ml", "0,01 mg/kg", epinephrineVolume, epinephrineText, "Diluída 1 ml + 9 ml AD - 1:10.000"),
      pcrDrug("amiodarona", "Parada cardíaca", "Amiodarona", "50 mg/ml", "5 mg/kg", amiodaroneVolume),
      pcrDrug("gluconato-calcio", "Parada cardíaca", "Gluco de Ca 10%", "100 mg/ml", "0,5 mEq/kg", Math.min(peso * 2, 60), null, `${fmtMl(calciumBase)} GluCa + ${fmtMl(calciumBase)} AD`),
      pcrDrug("bicarbonato", "Parada cardíaca", "Bicarbonato 8,4%", "84 mg/ml", "1 mEq/kg", peso * 2, null, `${fmtMl(peso)} BICA + ${fmtMl(peso)} AD`)
    ],
    intubation: [
      pcrDrug("atropina", "Entubação", "Atropina", "0,25 mg/ml", "0,02 mg/kg", Math.min(Math.max((peso * 0.02) / 0.25, 0.2), 1)),
      pcrDrug("lidocaina-2", "Entubação", "Lidocaína a 2%", "20 mg/ml", "1 mg/kg", peso / 20),
      pcrDrug("midazolam", "Entubação", "Midazolam", "5 mg/ml", "0,2 mg/kg", Math.min((peso * 0.2) / 5, 1)),
      pcrDrug("fentanil", "Entubação", "Fentanil", "50 µg/ml", "2 µg/kg", Math.min((peso * 2) / 50, 1)),
      pcrDrug("thiopental", "Entubação", "Thiopental", "20 mg/ml", "2 mg/kg", (peso * 2) / 20),
      pcrDrug("quetamina", "Entubação", "Quetamina", "50 mg/ml", "2 mg/kg", (peso * 2) / 50),
      pcrDrug("etomidato", "Entubação", "Etomidato", "2 mg/ml", "0,2 mg/kg", (peso * 0.2) / 2),
      pcrDrug("pancuronio", "Entubação", "Pancurônio", "2 mg/ml", "0,1 mg/kg", (peso * 0.1) / 2),
      pcrDrug("atracurio", "Entubação", "Atracúrio", "10 mg/ml", "0,4 mg/kg", (peso * 0.4) / 10)
    ],
    reversal: [
      pcrDrug("flumazenil", "Agentes de reversão", "Flumazenil", "0,1 mg/ml", "0,01 mg/kg", Math.min((peso * 0.01) / 0.1, 2)),
      pcrDrug("naloxone", "Agentes de reversão", "Naloxone", "0,4 mg/ml", "0,01 mg/kg", Math.min((peso * 0.01) / 0.4, 1))
    ],
    usefulDrugs: [
      pcrDrug("morfina", "Outras drogas úteis", "Morfina", "10 mg/ml", "0,1 mg/kg", Math.min(peso * 0.1, 4), null, "Diluída 1 ml + 9 ml - 1 mg/ml"),
      pcrDrug("diazepam", "Outras drogas úteis", "Diazepam", "5 mg/ml", "0,5 mg/kg", Math.min((peso * 0.5) / 5, 2)),
      pcrDrug("adenosina", "Outras drogas úteis", "Adenosina", "3 mg/ml", "0,1 mg/kg", Math.min((peso * 0.1) / 3, 2))
    ],
    shock: [
      metric("desfibrilacao-1", "Desfibrilação 1º", fmtNumber(peso * 2, 0), "J"),
      metric("desfibrilacao-2", "Desfibrilação 2º", fmtNumber(peso * 4, 0), "J"),
      metric("desfibrilacao-3", "Desfibrilação 3º", fmtNumber(peso * 4, 0), "J")
    ],
    warnings: [DISCLAIMER, "Réplica técnica da planilha Folha de PCR. Conferir protocolo institucional antes da administração."]
  };
}
