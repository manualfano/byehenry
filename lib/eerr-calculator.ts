// Lógica de cálculo del EERR desde datos crudos de Google Sheets

import type {
  EgresosRow,
  ImpagasRow,
  EERRData,
  MonthData,
  SheetData,
} from "@/types/eerr";

// Convierte números argentinos: "38.665.706,50" → 38665706.50
export function parsePesosArg(value: string): number {
  if (!value || value.trim() === "" || value.trim() === "-") return 0;
  // Remover símbolo $ y espacios
  const clean = value.replace(/\$/g, "").replace(/\s/g, "").trim();
  if (!clean) return 0;
  // Formato argentino: punto = miles, coma = decimales
  // Reemplazar puntos de miles, luego coma decimal
  const normalized = clean.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

function importeEgreso(row: EgresosRow): number {
  return (
    parsePesosArg(row.efectivo) +
    parsePesosArg(row.banco) +
    parsePesosArg(row.cobro)
  );
}

// Filtrar egresos por mes y categoría
function filtrarEgresosPorMesYCategoria(
  egresos: EgresosRow[],
  mesExtr: string,
  categorias: string[]
): EgresosRow[] {
  const mesNorm = mesExtr.toLowerCase().trim();
  return egresos.filter((r) => {
    const mesFila = r.mesExtr.toLowerCase().trim();
    const catFila = r.categoria.toLowerCase().trim();
    return (
      mesFila === mesNorm &&
      categorias.some((c) => catFila === c.toLowerCase().trim())
    );
  });
}

// Suma impagas filtradas por mes, estado y categorías (usa columna DEUDA)
function sumarImpagasCMV(
  impagas: ImpagasRow[],
  mesImpagas: string,
  categorias: string[]
): number {
  const mesNorm = mesImpagas.toLowerCase().trim();
  return impagas
    .filter((r) => {
      const mesFila = r.mes.toLowerCase().trim();
      const estadoFila = r.estado.toLowerCase().trim();
      const catFila = r.categoria.toLowerCase().trim();
      return (
        mesFila === mesNorm &&
        estadoFila === "impaga" &&
        categorias.some((c) => catFila === c.toLowerCase().trim())
      );
    })
    .reduce((acc, r) => acc + parsePesosArg(r.deuda), 0);
}

// Sueldos agrupados por subcategoría
function calcularSueldos(
  egresos: EgresosRow[],
  mesExtr: string
): EERRData["gastosOperativos"]["sueldos"] {
  const filas = filtrarEgresosPorMesYCategoria(egresos, mesExtr, ["Sueldos"]);

  const sumBySubcat = (subcat: string) =>
    filas
      .filter(
        (r) => r.subcategoriaSubeldos.toLowerCase().trim() === subcat.toLowerCase().trim()
      )
      .reduce((acc, r) => acc + importeEgreso(r), 0);

  const general = sumBySubcat("General");
  const cocina = sumBySubcat("Cocina");
  const salon = sumBySubcat("Salón");
  const barSeguridad = sumBySubcat("Bar - Seguridad");
  const barRRPP = sumBySubcat("Bar - RRPP");
  const barDJ = sumBySubcat("Bar - DJ");
  const barSalonExtra30 = sumBySubcat("Bar - Salón Extra 30%");
  const barCocinaExtra30 = sumBySubcat("Bar - Cocina Extra 30%");
  const barGeneralExtra30 = sumBySubcat("Bar - General Extra 30%");
  const viandasCocina = sumBySubcat("Cocina-Viandas");
  const viandasLogistica = sumBySubcat("Logistica-Viandas");

  const total =
    general +
    cocina +
    salon +
    barSeguridad +
    barRRPP +
    barDJ +
    barSalonExtra30 +
    barCocinaExtra30 +
    barGeneralExtra30 +
    viandasCocina +
    viandasLogistica;

  return {
    total,
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
  };
}

// Servicios agrupados por proveedor
function calcularServicios(
  egresos: EgresosRow[],
  mesExtr: string
): EERRData["gastosOperativos"]["servicios"] {
  const filas = filtrarEgresosPorMesYCategoria(egresos, mesExtr, ["Servicios"]);

  const sumByProveedor = (proveedor: string) =>
    filas
      .filter(
        (r) => r.proveedor.toLowerCase().trim() === proveedor.toLowerCase().trim()
      )
      .reduce((acc, r) => acc + importeEgreso(r), 0);

  const electricidad = sumByProveedor("Edelap");
  const agua = sumByProveedor("Absa");
  const gas = sumByProveedor("Camuzzi");
  const emergenciasMedicas = sumByProveedor("Sum Sa");
  const seguros = sumByProveedor("Seguro Rivadavia");
  const seguridadEHigiene = sumByProveedor("Javier Spegni");
  const tiendaDePuntos = sumByProveedor("Tienda de puntos");
  const asesoriaOrdenFinanciero = sumByProveedor("Manuel Alfano");
  const contenedores = sumByProveedor("Esur");
  const internetYTelefonia = sumByProveedor("Flow");

  const total =
    electricidad +
    agua +
    gas +
    emergenciasMedicas +
    seguros +
    seguridadEHigiene +
    tiendaDePuntos +
    asesoriaOrdenFinanciero +
    contenedores +
    internetYTelefonia;

  return {
    total,
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
  };
}

// Lee las ventas desde la hoja EERR del sheet de análisis
function calcularVentasDesdeEERR(
  eerrRaw: string[][],
  mesKey: string
): EERRData["ventas"] & { ventasBrutas: number } {
  // La hoja EERR tiene una estructura con conceptos en filas y meses en columnas
  // Buscamos la columna del mes por su cabecera
  if (eerrRaw.length === 0) {
    return {
      ventasBrutas: 0,
      funcionamiento: 0,
      restaurantDelivery: 0,
      bar: 0,
      otrosIngresosOperativos: 0,
      senas: 0,
    };
  }

  // Encontrar columna del mes (primera fila es headers de meses)
  const headerRow = eerrRaw[0];
  const mesNorm = mesKey.toLowerCase().trim();

  // Buscar la columna que coincide con el mes (ej: "abr 2026", "abr_2026", "Abril 2026")
  let colIndex = -1;
  for (let i = 1; i < headerRow.length; i++) {
    const h = (headerRow[i] ?? "").toLowerCase().trim().replace(/\s+/g, "_");
    if (h.includes(mesNorm.replace(/\s+/g, "_"))) {
      colIndex = i;
      break;
    }
  }

  if (colIndex === -1) {
    // Intentar búsqueda parcial por mes corto (ej: "abr")
    const mesCorto = mesNorm.split(/[\s_]/)[0];
    for (let i = 1; i < headerRow.length; i++) {
      const h = (headerRow[i] ?? "").toLowerCase().trim();
      if (h.startsWith(mesCorto)) {
        colIndex = i;
        break;
      }
    }
  }

  const getValorFila = (conceptoBuscado: string): number => {
    if (colIndex === -1) return 0;
    for (const row of eerrRaw) {
      const concepto = (row[0] ?? "").toLowerCase().trim();
      if (concepto.includes(conceptoBuscado.toLowerCase())) {
        return parsePesosArg(row[colIndex] ?? "");
      }
    }
    return 0;
  };

  const restaurantDelivery = getValorFila("restaurant") || getValorFila("delivery");
  const bar = getValorFila("bar");
  const otrosIngresosOperativos = getValorFila("otros ingresos");
  const senas = getValorFila("seña") || getValorFila("sena");
  const funcionamiento = restaurantDelivery + bar;

  // Ventas brutas = suma de ingresos (excluimos "Ingresos Cuenta Corriente")
  const ventasBrutas = getValorFila("ventas brutas") || (funcionamiento + otrosIngresosOperativos + senas);

  return { ventasBrutas, funcionamiento, restaurantDelivery, bar, otrosIngresosOperativos, senas };
}

export function calcularEERR(data: SheetData, mes: MonthData): EERRData {
  const { egresos, impagas, eerr } = data;

  // --- Ventas desde EERR sheet ---
  const ventasData = calcularVentasDesdeEERR(eerr, mes.key);
  const ventasBrutas = ventasData.ventasBrutas;

  // --- CMV pagado por categoría (de Egresos) ---
  const catsCMV = ["Alimentos", "Bebidas sin alcohol", "Bebidas con alcohol", "Cervezas"];
  const sumCatEgresos = (cat: string) =>
    filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, [cat])
      .reduce((acc, r) => acc + importeEgreso(r), 0);

  const alimentos = sumCatEgresos("Alimentos");
  const bebidasSinAlcohol = sumCatEgresos("Bebidas sin alcohol");
  const bebidasConAlcohol = sumCatEgresos("Bebidas con alcohol");
  const cervezas = sumCatEgresos("Cervezas");

  // --- Saldo impagas CMV (usa columna DEUDA) ---
  const saldoImpagas = sumarImpagasCMV(impagas, mes.mesImpagas, catsCMV);
  const cmvNetoCuentaCorriente = alimentos + bebidasSinAlcohol + bebidasConAlcohol + cervezas - saldoImpagas;
  const cmvTotal = alimentos + bebidasSinAlcohol + bebidasConAlcohol + cervezas;

  const utilidadBruta = ventasBrutas - cmvTotal;

  // --- Gastos operativos ---
  const sueldos = calcularSueldos(egresos, mes.mesExtr);
  const servicios = calcularServicios(egresos, mes.mesExtr);

  const publicidad = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Publicidad ", "Publicidad"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  const produccion = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Gasto de producción", "Gasto de produccion"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  const gastosAdmin = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Gasto administrativo"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  const limpieza = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Limpieza"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  const mantenimiento = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Mantenimiento"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  // Otras deudas impagas (Limpieza + Mantenimiento de impagas)
  const otrasDeudas = sumarImpagasCMV(impagas, mes.mesImpagas, ["Limpieza", "Mantenimiento"]);

  const gastosOperativosTotal =
    sueldos.total +
    servicios.total +
    publicidad +
    produccion +
    gastosAdmin +
    limpieza +
    mantenimiento +
    otrasDeudas;

  // Impuestos desde egresos
  const impuestos = filtrarEgresosPorMesYCategoria(egresos, mes.mesExtr, ["Impuestos", "Impuesto"])
    .reduce((acc, r) => acc + importeEgreso(r), 0);

  const resultadoAntesDeImpuestos = utilidadBruta - gastosOperativosTotal;
  const resultadoNeto = resultadoAntesDeImpuestos - impuestos;

  return {
    mes,
    ventasBrutas,
    ventas: {
      funcionamiento: ventasData.funcionamiento,
      restaurantDelivery: ventasData.restaurantDelivery,
      bar: ventasData.bar,
      otrosIngresosOperativos: ventasData.otrosIngresosOperativos,
      senas: ventasData.senas,
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
      sueldos,
      servicios,
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

// Calcula variación porcentual entre dos valores
export function calcVariacion(actual: number, anterior: number): number | undefined {
  if (!anterior || anterior === 0) return undefined;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

// Lista de meses disponibles
export const MESES_DISPONIBLES: MonthData[] = [
  { label: "Febrero 2026", key: "feb_2026", mesExtr: "febrero 2026", mesImpagas: "Feb 26" },
  { label: "Marzo 2026", key: "mar_2026", mesExtr: "marzo 2026", mesImpagas: "Mar 26" },
  { label: "Abril 2026", key: "abr_2026", mesExtr: "abril 2026", mesImpagas: "Abr 26" },
];
