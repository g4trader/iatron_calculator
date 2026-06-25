export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
    maximumFractionDigits: 2
  }).format(value);
}

export function ml(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${formatNumber(value)} ml`;
}

export function mlh(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${formatNumber(value)} ml/h`;
}

export function joule(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${formatNumber(value)} J`;
}

