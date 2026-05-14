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
      "Faltan credenciales de Google Sheets: GOOGLE_SHEETS_CLIENT_EMAIL o GOOGLE_SHEETS_PRIVATE_KEY"
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
): Promise<string[][]> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  return (response.data.values ?? []) as string[][];
}

function parseEgresosRows(rows: string[][]): EgresosRow[] {
  if (rows.length < 2) return [];
  // Salteamos la fila de encabezados (índice 0)
  return rows.slice(1).map((row) => ({
    fechaPago: row[0] ?? "",
    fechaRemito: row[1] ?? "",
    semana: row[2] ?? "",
    mesExtr: row[3] ?? "",
    descripcion: row[4] ?? "",
    proveedor: row[5] ?? "",
    categoria: row[6] ?? "",
    subcategoriaSubeldos: row[7] ?? "",
    efectivo: row[8] ?? "",
    banco: row[9] ?? "",
    cobro: row[10] ?? "",
    nCheque: row[11] ?? "",
  }));
}

function parseImpagasRows(rows: string[][]): ImpagasRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => ({
    fechaRemito: row[0] ?? "",
    mes: row[1] ?? "",
    pago: row[2] ?? "",
    numero: row[3] ?? "",
    estado: row[4] ?? "",
    semana: row[5] ?? "",
    proveedor: row[6] ?? "",
    categoria: row[7] ?? "",
    importe: row[8] ?? "",
    pagado: row[9] ?? "",
    deuda: row[10] ?? "",
  }));
}

export async function getSheetData(forceRefresh = false): Promise<SheetData> {
  // Intentar caché primero
  if (!forceRefresh) {
    const cached = cache.get<SheetData>(CACHE_KEY_SHEETS);
    if (cached) return cached;
  }

  const adminSheetId = process.env.SHEET_ID_ADMIN;
  const eerrSheetId = process.env.SHEET_ID_EERR;

  if (!adminSheetId || !eerrSheetId) {
    throw new Error(
      "Faltan IDs de Google Sheets: SHEET_ID_ADMIN o SHEET_ID_EERR"
    );
  }

  // Fetch en paralelo de las tres hojas
  const [egresosRaw, impagasRaw, eerrRaw] = await Promise.all([
    fetchSheetRange(adminSheetId, "Egresos!A:L"),
    fetchSheetRange(adminSheetId, "Impagas!A:K"),
    fetchSheetRange(eerrSheetId, "EERR !A:Z"),
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
