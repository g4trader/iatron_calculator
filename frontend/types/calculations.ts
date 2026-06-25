export type CalculationInput = {
  pesoKg: number;
  idadeAnos: number;
  idadeMeses: number;
  idadeTotalMeses: number;
};

export type MedicationResult = {
  id: string;
  name: string;
  presentation: string;
  category: string;
  route?: string | null;
  volumeMl?: number | null;
  dilutionMl?: number | null;
  finalVolumeMl?: number | null;
  administeredVolumeMl?: number | null;
  infusionRateMlH?: number | null;
  ui100?: number | null;
  isLessThan1Ml: boolean;
  notes: string[];
};

export type AirwayMaterials = {
  tuboTraqueal: string;
  lamina: string;
  fixacaoProfundidade: string;
  jelcoDescompressaoToracica: string;
  sondaAspiracao: string;
  drenoTorax: string;
  cateterVenosoCentral: string;
  jelcoPia: string;
  svd: string;
  bougie: string;
};

export type Shock = {
  desfibrilacaoPrimeiraDoseJ: number;
  desfibrilacaoSegundaDoseJ: number;
  cardioversaoJ: number;
};

export type CalculationResponse = {
  input: CalculationInput;
  medications: MedicationResult[];
  airwayMaterials: AirwayMaterials;
  shock: Shock;
  warnings: string[];
};

export type CalculationRequest = {
  pesoKg: number;
  idadeAnos: number;
  idadeMeses: number;
};

export type PcrMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string | null;
  note?: string | null;
};

export type PcrDrug = {
  id: string;
  section: string;
  name: string;
  presentation: string;
  dose: string;
  volume: string;
  dilution?: string | null;
  note?: string | null;
  isLessThan1Ml: boolean;
  ui100?: number | null;
};

export type PcrCalculationResponse = {
  input: CalculationInput;
  calculator: string;
  airway: PcrMetric[];
  cardiacArrest: PcrDrug[];
  intubation: PcrDrug[];
  reversal: PcrDrug[];
  usefulDrugs: PcrDrug[];
  shock: PcrMetric[];
  warnings: string[];
};
