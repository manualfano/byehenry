// Cliente Google Sheets API — SOLO LECTURA
// Scope: spreadsheets.readonly — sin permisos de escritura

import { google } from "googleapis";
import type { EgresosRow, ImpagasRow, SheetData } from "@/types/eerr";
import { cache, CACHE_KEY_SHEETS } from "@/lib/cache";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Faltan credenciales: GOOGLE_SHEETS_CLIENT_EMAIL o GOOGLE_SHEETS_PRIVATE_KEY"
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [READONLY_SCOPE],
  });
}

async function fetchSheetRange(
  sheetId: string,
  range: string
): Promise<(string | number | null)[][]> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    // UNFORMATTED_VALUE devuelve números reales en vez de strings formateados
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return (response.data.values ?? []) as (string | number | null)[][];
}

function parseEgresosRows(rows: (string | number | null)[][]): EgresosRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => ({
    fechaPago: String(row[0] ?? ""),
    fechaRemito: String(row[1] ?? ""),
    semana: String(row[2] ?? ""),
    mesExtr: String(row[3] ?? ""),
    descripcion: String(row[4] ?? ""),
    proveedor: String(row[5] ?? ""),
    categoria: String(row[6] ?? ""),
    subcategoriaSubeldos: String(row[7] ?? ""),
    efectivo: row[8] ?? 0,
    banco: row[9] ?? 0,
    cobro: row[10] ?? 0,
    nCheque: String(row[11] ?? ""),
  }));
}

function parseImpagasRows(rows: (string | number | null)[][]): ImpagasRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => ({
    fechaRemito: String(row[0] ?? ""),
    mes: String(row[1] ?? ""),
    pago: String(row[2] ?? ""),
    numero: String(row[3] ?? ""),
    estado: String(row[4] ?? ""),
    semana: String(row[5] ?? ""),
    proveedor: String(row[6] ?? ""),
    categoria: String(row[7] ?? ""),
    importe: row[8] ?? 0,
    pagado: row[9] ?? 0,
    deuda: row[10] ?? 0,
  }));
}

export async function getSheetData(forceRefresh = false): Promise<SheetData> {
  if (!forceRefresh) {
    const cached = cache.get<SheetData>(CACHE_KEY_SHEETS);
    if (cached) return cached;
  }

  const adminSheetId = process.env.SHEET_ID_ADMIN;
  const eerrSheetId = process.env.SHEET_ID_EERR;

  if (!adminSheetId || !eerrSheetId) {
    throw new Error("Faltan IDs: SHEET_ID_ADMIN o SHEET_ID_EERR");
  }

  // Fetch en paralelo — las 3 hojas al mismo tiempo
  const [egresosRaw, impagasRaw, eerrRaw] = await Promise.all([
    fetchSheetRange(adminSheetId, "Egresos!A:L"),
    fetchSheetRange(adminSheetId, "Impagas!A:K"),
    // EERR: hasta col P para cubrir los 4 meses con 3 cols cada uno (D-O)
    fetchSheetRange(eerrSheetId, "EERR !A:P"),
  ]);

  const data: SheetData = {
    egresos: parseEgresosRows(egresosRaw),
    impagas: parseImpagasRows(impagasRaw),
    eerr: eerrRaw,
    lastUpdated: new Date(),
  };

  cache.set(CACHE_KEY_SHEETS, data);
  return data;
}

export function getLastUpdated(): Date | null {
  return cache.getTimestamp(CACHE_KEY_SHEETS);
}
