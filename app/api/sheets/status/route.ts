import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheetData, getLastUpdated } from "@/lib/google-sheets";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await getSheetData(false);
    const lastUpdated = getLastUpdated();
    return NextResponse.json({
      status: "ok",
      adminSheetId: process.env.SHEET_ID_ADMIN ?? "no configurado",
      eerrSheetId: process.env.SHEET_ID_EERR ?? "no configurado",
      lastUpdated: lastUpdated?.toISOString() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({
      status: "error",
      error: message,
      adminSheetId: process.env.SHEET_ID_ADMIN ?? "no configurado",
      eerrSheetId: process.env.SHEET_ID_EERR ?? "no configurado",
      lastUpdated: null,
    });
  }
}
