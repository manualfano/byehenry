// Formateo de números en formato argentino

export function formatPesos(value: number): string {
  if (isNaN(value)) return "$0";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatPorcentaje(value: number, decimals = 1): string {
  if (isNaN(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
}

export function formatVariacion(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return "";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
