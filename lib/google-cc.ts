import { google } from "googleapis";
import type { CCData, Cuenta, Movimiento, ResumenCuenta } from "@/types/cc";
import { CUENTAS } from "@/types/cc";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

// Cache simple en memoria (5 min TTL)
let _cache: { data: CCData; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("Faltan credenciales de Google");
  return new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: [READONLY_SCOPE] });
}

// Parsea valores como "5,828,772" o "(4,706,674)" → número
function parseImporte(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val).trim();
  const negativo = s.startsWith("(") && s.endsWith(")");
  const limpio = s.replace(/[(),\s]/g, "");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : negativo ? -n : n;
}

// Convierte número serial de Sheets/Excel a "DD/MM"
function serialToFecha(val: string | number | null): string {
  const n = typeof val === "number" ? val : parseFloat(String(val ?? ""));
  if (isNaN(n) || n <= 0) return String(val ?? "").trim();
  // Epoch de Google Sheets: 30 de diciembre de 1899
  const ms = (n - 25569) * 86400 * 1000; // 25569 = días entre 1899-12-30 y 1970-01-01
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function parseRow(row: (string | number | null)[]): Movimiento | null {
  // Cols: 0=Fecha, 1=Mes, 2=Cuenta, 3=Tipo, 4=Categoría, 5=Descripción, 6=Cantidad, 7=PrecioUnit, 8=Importe, 9=SaldoAcumulado
  const fecha = serialToFecha(row[0]);
  const mes   = String(row[1] ?? "").trim();
  const cuenta = String(row[2] ?? "").trim() as Cuenta;
  const tipo  = String(row[3] ?? "").trim() as "Sale" | "Entra";

  if (!fecha || !mes || !CUENTAS.includes(cuenta) || !["Sale", "Entra"].includes(tipo)) return null;

  return {
    fecha,
    mes,
    cuenta,
    tipo,
    categoria:      String(row[4] ?? "").trim(),
    descripcion:    String(row[5] ?? "").trim(),
    cantidad:       parseImporte(row[6]),
    precioUnit:     parseImporte(row[7]),
    importe:        parseImporte(row[8]),
    saldoAcumulado: parseImporte(row[9]),
  };
}


function buildForMes(base: CCData, mes?: string): CCData {
  // Necesitamos los movimientos — los volvemos a leer del cache (almacenamos todo)
  // Para simplificar, buildForMes recibe la base y los movimientos están en el cache
  // Rediseño: guardamos movimientos en cache también
  if (!_movCache) return base;

  const mesTarget = mes ?? base.mesesDisponibles[base.mesesDisponibles.length - 1];
  const movDelMes = _movCache.filter(m => m.mes === mesTarget);

  const resumenPorCuenta: ResumenCuenta[] = CUENTAS.map(cuenta => {
    const filas = movDelMes.filter(m => m.cuenta === cuenta);
    const saleDelMes  = filas.filter(m => m.tipo === "Sale").reduce((s, m) => s + m.importe, 0);
    const entraDelMes = filas.filter(m => m.tipo === "Entra").reduce((s, m) => s + Math.abs(m.importe), 0);
    return {
      cuenta,
      saldoActual: base.saldosActuales[cuenta],
      saleDelMes,
      entraDelMes,
      variacionNeta: saleDelMes - entraDelMes,
    };
  });

  const totalSale     = resumenPorCuenta.reduce((s, r) => s + r.saleDelMes, 0);
  const totalEntra    = resumenPorCuenta.reduce((s, r) => s + r.entraDelMes, 0);

  return {
    ...base,
    mes: mesTarget,
    resumenPorCuenta,
    totalSale,
    totalEntra,
    totalVariacion: totalSale - totalEntra,
    movimientos: movDelMes.sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

// Cache separado para los movimientos crudos
let _movCache: Movimiento[] | null = null;

export async function getCCDataFull(mes?: string, forceRefresh = false): Promise<CCData> {
  const now = Date.now();

  if (!forceRefresh && _cache && _movCache && now - _cache.ts < CACHE_TTL) {
    return buildForMes(_cache.data, mes);
  }

  const sheetId = process.env.SHEET_ID_CC;
  if (!sheetId) throw new Error("Falta SHEET_ID_CC");

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Movimientos!A:J",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = (res.data.values ?? []) as (string | number | null)[][];
  const movimientos: Movimiento[] = rows.slice(1).map(parseRow).filter(Boolean) as Movimiento[];
  _movCache = movimientos;

  // Meses disponibles
  const mesesOrden: string[] = [];
  const seen = new Set<string>();
  for (const m of movimientos) {
    if (!seen.has(m.mes)) { mesesOrden.push(m.mes); seen.add(m.mes); }
  }

  // Saldo actual por cuenta = último movimiento
  const saldosActuales: Record<Cuenta, number> = { Cortez: 0, "BH Gonnet": 0, "BH Diagonal": 0 };
  for (const cuenta of CUENTAS) {
    const filas = movimientos.filter(m => m.cuenta === cuenta);
    if (filas.length) saldosActuales[cuenta] = filas[filas.length - 1].saldoAcumulado;
  }

  const baseData: CCData = {
    mes: "",
    mesesDisponibles: mesesOrden,
    saldosActuales,
    totalSaldo: CUENTAS.reduce((s, c) => s + saldosActuales[c], 0),
    resumenPorCuenta: [],
    totalSale: 0,
    totalEntra: 0,
    totalVariacion: 0,
    movimientos: [],
    lastUpdated: new Date(),
  };

  _cache = { data: baseData, ts: now };
  return buildForMes(baseData, mes);
}
