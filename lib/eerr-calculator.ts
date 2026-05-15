import type { EERRData, MonthData, SheetData } from "@/types/eerr";

// Convierte un valor de celda a número.
// Maneja: number, string con formato argentino ("38.665.706,50"), string plana ("38665706")
export function parsePesosArg(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const s = String(value).replace(/\$/g, "").replace(/\s/g, "").trim();
  if (!s || s === "-") return 0;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

function eerrVal(
  rows: (string | number | null)[][],
  rowIdx: number,
  colIdx: number
): number {
  const row = rows[rowIdx];
  if (!row) return 0;
  return parsePesosArg(row[colIdx] as string | number | null);
}

// Meses disponibles con índice de columna en el EERR sheet (0-based)
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

// Mapeo de filas (índice 0-based = fila en Sheets - 1):
//
// Fila 4  (idx 3):  VentasBrutas
// Fila 5  (idx 4):  Funcionamiento
// Fila 6  (idx 5):  Restaurant + Delivery
// Fila 7  (idx 6):  Bar
// Fila 8  (idx 7):  Otros ingresos operativos
// Fila 9  (idx 8):  Señas
// Fila 10 (idx 9):  CMV total
// Fila 11 (idx 10): Alimentos (Pagas)
// Fila 12 (idx 11): Bebidas sin alcohol (Pagas)
// Fila 13 (idx 12): Bebidas con alcohol (Pagas)
// Fila 14 (idx 13): Cervezas (Pagas)
// Fila 15 (idx 14): Saldo proveedores (Impagas)
// Fila 16 (idx 15): CMV Neto cuenta corriente
// Fila 17 (idx 16): Mercadería enviada a otros negocios
// Fila 18 (idx 17): Mercadería recibida de otros negocios
// Fila 19 (idx 18): (vacía)
// Fila 20 (idx 19): ContribMG / Utilidad Bruta
// Fila 21 (idx 20): SueldosTotal
// Fila 22 (idx 21): General
// Fila 23 (idx 22): Cocina
// Fila 24 (idx 23): Salón
// Fila 25 (idx 24): Bar - General Extra 30%
// Fila 26 (idx 25): Bar - Cocina Extra 30%
// Fila 27 (idx 26): Bar - Salón Extra 30%
// Fila 28 (idx 27): Bar - Seguridad
// Fila 29 (idx 28): Bar - RRPP
// Fila 30 (idx 29): Bar - DJ
// Fila 31 (idx 30): Viandas cocina
// Fila 32 (idx 31): Viandas logística
// Fila 33 (idx 32): Adelantos
// Fila 34 (idx 33): Seguridad Social (F931)
// Fila 35 (idx 34): Alquileres
// Fila 36 (idx 35): Servicios (total)
// Fila 37 (idx 36): Electricidad
// Fila 38 (idx 37): Agua
// Fila 39 (idx 38): Gas
// Fila 40 (idx 39): Emergencias médicas
// Fila 41 (idx 40): Seguros
// Fila 42 (idx 41): Seguridad e higiene
// Fila 43 (idx 42): Tienda de puntos
// Fila 44 (idx 43): Asesoría Orden Financiero
// Fila 45 (idx 44): Contenedores
// Fila 46 (idx 45): Grupo electrógeno
// Fila 47 (idx 46): Soft POS (Restosoft)
// Fila 48 (idx 47): Internet y telefonía
// Fila 49 (idx 48): Publicidad
// Fila 50 (idx 49): Producción
// Fila 51 (idx 50): Gastos admin
// Fila 52 (idx 51): Limpieza
// Fila 53 (idx 52): Mantenimiento
// Fila 54 (idx 53): Otras deudas impagas
// Fila 55 (idx 54): Ut neta antes de impuestos
// Fila 56 (idx 55): Impuestos
// Fila 62 (idx 61): Utneta

export function calcularEERR(data: SheetData, mes: MonthData): EERRData {
  const { eerr } = data;
  const c = mes.eerrCol;

  // VENTAS
  const ventasBrutas              = eerrVal(eerr, 3,  c);
  const funcionamiento            = eerrVal(eerr, 4,  c);
  const restaurantDelivery        = eerrVal(eerr, 5,  c);
  const bar                       = eerrVal(eerr, 6,  c);
  const otrosIngresosOperativos   = eerrVal(eerr, 7,  c);
  const senas                     = eerrVal(eerr, 8,  c);

  // CMV
  const cmvTotal                  = eerrVal(eerr, 9,  c);
  const alimentos                 = eerrVal(eerr, 10, c);
  const bebidasSinAlcohol         = eerrVal(eerr, 11, c);
  const bebidasConAlcohol         = eerrVal(eerr, 12, c);
  const cervezas                  = eerrVal(eerr, 13, c);
  const saldoImpagas              = eerrVal(eerr, 14, c);
  const cmvNetoCuentaCorriente    = eerrVal(eerr, 15, c);

  // UTILIDAD BRUTA (ya calculada en el sheet, incluye mercadería entre negocios)
  const utilidadBruta             = eerrVal(eerr, 19, c);

  // SUELDOS
  const sueldosTotal              = eerrVal(eerr, 20, c);
  const general                   = eerrVal(eerr, 21, c);
  const cocina                    = eerrVal(eerr, 22, c);
  const salon                     = eerrVal(eerr, 23, c);
  const barGeneralExtra30         = eerrVal(eerr, 24, c);
  const barCocinaExtra30          = eerrVal(eerr, 25, c);
  const barSalonExtra30           = eerrVal(eerr, 26, c);
  const barSeguridad              = eerrVal(eerr, 27, c);
  const barRRPP                   = eerrVal(eerr, 28, c);
  const barDJ                     = eerrVal(eerr, 29, c);
  const viandasCocina             = eerrVal(eerr, 30, c);
  const viandasLogistica          = eerrVal(eerr, 31, c);

  // ALQUILERES
  const alquileres                = eerrVal(eerr, 34, c);

  // SERVICIOS
  const serviciosTotal            = eerrVal(eerr, 35, c);
  const electricidad              = eerrVal(eerr, 36, c);
  const agua                      = eerrVal(eerr, 37, c);
  const gas                       = eerrVal(eerr, 38, c);
  const emergenciasMedicas        = eerrVal(eerr, 39, c);
  const seguros                   = eerrVal(eerr, 40, c);
  const seguridadEHigiene         = eerrVal(eerr, 41, c);
  const tiendaDePuntos            = eerrVal(eerr, 42, c);
  const asesoriaOrdenFinanciero   = eerrVal(eerr, 43, c);
  const contenedores              = eerrVal(eerr, 44, c);
  const grupoElectrogeno          = eerrVal(eerr, 45, c);
  const softPOS                   = eerrVal(eerr, 46, c);
  const internetYTelefonia        = eerrVal(eerr, 47, c);

  // OTROS RUBROS
  const publicidad                = eerrVal(eerr, 48, c);
  const produccion                = eerrVal(eerr, 49, c);
  const gastosAdmin               = eerrVal(eerr, 50, c);
  const limpieza                  = eerrVal(eerr, 51, c);
  const mantenimiento             = eerrVal(eerr, 52, c);
  const otrasDeudas               = eerrVal(eerr, 53, c);

  // RESULTADO
  const resultadoAntesDeImpuestos = eerrVal(eerr, 54, c);
  const impuestosTotal            = eerrVal(eerr, 55, c);
  const impOtros                  = eerrVal(eerr, 56, c);
  const impIIBB                   = eerrVal(eerr, 57, c);
  const impIVA                    = eerrVal(eerr, 58, c);
  const impCredito                = eerrVal(eerr, 59, c);
  const impDebito                 = eerrVal(eerr, 60, c);
  const resultadoNeto             = eerrVal(eerr, 61, c);

  const gastosOperativosTotal =
    sueldosTotal +
    alquileres +
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
    ventas: { funcionamiento, restaurantDelivery, bar, otrosIngresosOperativos, senas },
    cmv: { total: cmvTotal, alimentos, bebidasSinAlcohol, bebidasConAlcohol, cervezas, saldoImpagas, cmvNetoCuentaCorriente },
    utilidadBruta,
    gastosOperativos: {
      total: gastosOperativosTotal,
      sueldos: {
        total: sueldosTotal,
        general, cocina, salon,
        barGeneralExtra30, barCocinaExtra30, barSalonExtra30,
        barSeguridad, barRRPP, barDJ,
        viandasCocina, viandasLogistica,
      },
      alquileres,
      servicios: {
        total: serviciosTotal,
        electricidad, agua, gas, emergenciasMedicas, seguros,
        seguridadEHigiene, tiendaDePuntos, asesoriaOrdenFinanciero,
        contenedores, grupoElectrogeno, softPOS, internetYTelefonia,
      },
      publicidad, produccion, gastosAdmin, limpieza, mantenimiento, otrasDeudas,
    },
    resultadoAntesDeImpuestos,
    impuestos: {
      total: impuestosTotal,
      otros: impOtros,
      iibb: impIIBB,
      iva: impIVA,
      credito: impCredito,
      debito: impDebito,
    },
    resultadoNeto,
  };
}

export function calcVariacion(actual: number, anterior: number): number | undefined {
  if (!anterior || anterior === 0) return undefined;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}
