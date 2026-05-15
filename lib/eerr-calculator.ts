// Lógica de cálculo del EERR
// Ventas y totales: se leen directo del EERR sheet (ya calculados)
// Viandas: se calculan desde Egresos (no están en el EERR)

import type { EgresosRow, EERRData, MonthData, SheetData } from "@/types/eerr";

// Convierte un valor de celda a número.
// Maneja: number, string con formato argentino ("38.665.706,50"), string plana ("38665706")
export function parsePesosArg(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const s = String(value).replace(/\$/g, "").replace(/\s/g, "").trim();
  if (!s || s === "-") return 0;
  // Formato argentino: punto = miles, coma = decimal → normalizar
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

// Lee una celda del EERR por fila (0-based) y columna (0-based)
function eerrVal(
  rows: (string | number | null)[][],
  rowIdx: number,
  colIdx: number
): number {
  const row = rows[rowIdx];
  if (!row) return 0;
  return parsePesosArg(row[colIdx] as string | number | null);
}

// Suma importe de egresos (efectivo + banco + cobro) para una fila
function importeEgreso(row: EgresosRow): number {
  return (
    parsePesosArg(row.efectivo) +
    parsePesosArg(row.banco) +
    parsePesosArg(row.cobro)
  );
}

// Calcula viandas desde Egresos (no están en el EERR sheet)
function calcularViandas(
  egresos: EgresosRow[],
  mesExtr: string
): { viandasCocina: number; viandasLogistica: number } {
  const mesNorm = mesExtr.toLowerCase().trim();
  const filasViandas = egresos.filter((r) => {
    return (
      r.mesExtr.toLowerCase().trim() === mesNorm &&
      r.categoria.toLowerCase().trim() === "sueldos"
    );
  });

  const sumSubcat = (subcat: string) =>
    filasViandas
      .filter(
        (r) =>
          r.subcategoriaSubeldos.toLowerCase().trim() ===
          subcat.toLowerCase().trim()
      )
      .reduce((acc, r) => acc + importeEgreso(r), 0);

  return {
    viandasCocina: sumSubcat("Cocina-Viandas"),
    viandasLogistica: sumSubcat("Logistica-Viandas"),
  };
}

// Meses disponibles con índice de columna en el EERR sheet
// eerrCol = índice 0-based de la columna "EERR en $" para ese mes
// Estructura: Feb→col D (3), Mar→col G (6), Abr→col J (9)
export const MESES_DISPONIBLES: MonthData[] = [
  {
    label: "Febrero 2026",
    key: "feb_2026",
    mesExtr: "febrero 2026",
    mesImpagas: "Feb 26",
    eerrCol: 3,
  },
  {
    label: "Marzo 2026",
    key: "mar_2026",
    mesExtr: "marzo 2026",
    mesImpagas: "Mar 26",
    eerrCol: 6,
  },
  {
    label: "Abril 2026",
    key: "abr_2026",
    mesExtr: "abril 2026",
    mesImpagas: "Abr 26",
    eerrCol: 9,
  },
];

export function calcularEERR(data: SheetData, mes: MonthData): EERRData {
  const { egresos, eerr } = data;
  const c = mes.eerrCol; // columna EERR en $ para este mes

  // --- VENTAS (filas 4-9, índices 3-8) ---
  const ventasBrutas = eerrVal(eerr, 3, c);
  const funcionamiento = eerrVal(eerr, 4, c);
  const restaurantDelivery = eerrVal(eerr, 5, c);
  const bar = eerrVal(eerr, 6, c);
  const otrosIngresosOperativos = eerrVal(eerr, 7, c);
  const senas = eerrVal(eerr, 8, c);

  // --- CMV (filas 10-16, índices 9-15) ---
  const cmvTotal = eerrVal(eerr, 9, c);
  const alimentos = eerrVal(eerr, 10, c);
  const bebidasSinAlcohol = eerrVal(eerr, 11, c);
  const bebidasConAlcohol = eerrVal(eerr, 12, c);
  const cervezas = eerrVal(eerr, 13, c);
  const saldoImpagas = eerrVal(eerr, 14, c);
  const cmvNetoCuentaCorriente = eerrVal(eerr, 15, c);

  // --- UTILIDAD BRUTA (fila 20, índice 19) ---
  const utilidadBruta = eerrVal(eerr, 19, c);

  // --- SUELDOS (filas 21-30, índices 20-29) ---
  const sueldosTotal = eerrVal(eerr, 20, c);
  const general = eerrVal(eerr, 21, c);
  const cocina = eerrVal(eerr, 22, c);
  const salon = eerrVal(eerr, 23, c);
  const barGeneralExtra30 = eerrVal(eerr, 24, c);
  const barCocinaExtra30 = eerrVal(eerr, 25, c);
  const barSalonExtra30 = eerrVal(eerr, 26, c);
  const barSeguridad = eerrVal(eerr, 27, c);
  const barRRPP = eerrVal(eerr, 28, c);
  const barDJ = eerrVal(eerr, 29, c);

  // Viandas vienen de Egresos (no están en el EERR sheet)
  const { viandasCocina, viandasLogistica } = calcularViandas(egresos, mes.mesExtr);

  // --- SERVICIOS (filas 34-46, índices 33-45) ---
  const serviciosTotal = eerrVal(eerr, 33, c);
  const electricidad = eerrVal(eerr, 34, c);
  const agua = eerrVal(eerr, 35, c);
  const gas = eerrVal(eerr, 36, c);
  const emergenciasMedicas = eerrVal(eerr, 37, c);
  const seguros = eerrVal(eerr, 38, c);
  const seguridadEHigiene = eerrVal(eerr, 39, c);
  const tiendaDePuntos = eerrVal(eerr, 40, c);
  const asesoriaOrdenFinanciero = eerrVal(eerr, 41, c);
  const contenedores = eerrVal(eerr, 42, c);
  // fila 44 = Grupo electrógeno, fila 45 = Soft POS (no en el spec del EERR display)
  const internetYTelefonia = eerrVal(eerr, 45, c);

  // --- OTROS RUBROS (filas 47-52, índices 46-51) ---
  const publicidad = eerrVal(eerr, 46, c);
  const produccion = eerrVal(eerr, 47, c);
  const gastosAdmin = eerrVal(eerr, 48, c);
  const limpieza = eerrVal(eerr, 49, c);
  const mantenimiento = eerrVal(eerr, 50, c);
  const otrasDeudas = eerrVal(eerr, 51, c);

  // --- RESULTADO (filas 53-60) ---
  const resultadoAntesDeImpuestos = eerrVal(eerr, 52, c);
  const impuestos = eerrVal(eerr, 53, c);
  const resultadoNeto = eerrVal(eerr, 59, c);

  // Gastos operativos total = lo que está en EERR
  // (sueldos + viandas + servicios + publicidad + produccion + admin + limpieza + mantenimiento + otras)
  const gastosOperativosTotal =
    sueldosTotal +
    viandasCocina +
    viandasLogistica +
    serviciosTotal +
    publicidad +
    produccion +
    gastosAdmin +
    limpieza +
    mantenimiento +
    otrasDeudas;

  return {
    mes,
    ventasBrutas,
    ventas: {
      funcionamiento,
      restaurantDelivery,
      bar,
      otrosIngresosOperativos,
      senas,
    },
    cmv: {
      total: cmvTotal,
      alimentos,
      bebidasSinAlcohol,
      bebidasConAlcohol,
      cervezas,
      saldoImpagas,
      cmvNetoCuentaCorriente,
    },
    utilidadBruta,
    gastosOperativos: {
      total: gastosOperativosTotal,
      sueldos: {
        total: sueldosTotal + viandasCocina + viandasLogistica,
        general,
        cocina,
        salon,
        barSeguridad,
        barRRPP,
        barDJ,
        barSalonExtra30,
        barCocinaExtra30,
        barGeneralExtra30,
        viandasCocina,
        viandasLogistica,
      },
      servicios: {
        total: serviciosTotal,
        electricidad,
        agua,
        gas,
        emergenciasMedicas,
        seguros,
        seguridadEHigiene,
        tiendaDePuntos,
        asesoriaOrdenFinanciero,
        contenedores,
        internetYTelefonia,
      },
      publicidad,
      produccion,
      gastosAdmin,
      limpieza,
      mantenimiento,
      otrasDeudas,
    },
    resultadoAntesDeImpuestos,
    impuestos,
    resultadoNeto,
  };
}

export function calcVariacion(
  actual: number,
  anterior: number
): number | undefined {
  if (!anterior || anterior === 0) return undefined;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}
