import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheetData, getLastUpdated } from "@/lib/google-sheets";
import { calcularEERR, MESES_DISPONIBLES } from "@/lib/eerr-calculator";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mesKey = searchParams.get("mes") ?? MESES_DISPONIBLES[MESES_DISPONIBLES.length - 1].key;
  const mes2Key = searchParams.get("mes2") ?? null;
  const forceRefresh = searchParams.get("refresh") === "true";

  const mesActual = MESES_DISPONIBLES.find((m) => m.key === mesKey);
  if (!mesActual) {
    return NextResponse.json({ error: "Mes no válido" }, { status: 400 });
  }

  const mesComparacion = mes2Key ? MESES_DISPONIBLES.find((m) => m.key === mes2Key) : null;
  if (mes2Key && !mesComparacion) {
    return NextResponse.json({ error: "Mes de comparación no válido" }, { status: 400 });
  }

  try {
    const data = await getSheetData(forceRefresh);
    const eerrActual = calcularEERR(data, mesActual);
    const eerrComparacion = mesComparacion ? calcularEERR(data, mesComparacion) : null;
    const lastUpdated = getLastUpdated();

    return NextResponse.json({
      eerr: eerrActual,
      eerrComparacion,
      lastUpdated: lastUpdated?.toISOString() ?? null,
      meses: MESES_DISPONIBLES,
    });
  } catch (error) {
    console.error("Error fetching sheets:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al obtener datos de Google Sheets: ${message}` },
      { status: 500 }
    );
  }
}
