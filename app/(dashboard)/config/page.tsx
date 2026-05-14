"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, Database, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusResponse {
  status: "ok" | "error";
  adminSheetId: string;
  eerrSheetId: string;
  lastUpdated: string | null;
  error?: string;
}

export default function ConfigPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sheets/status");
      const data: StatusResponse = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        status: "error",
        adminSheetId: "—",
        eerrSheetId: "—",
        lastUpdated: null,
        error: "No se pudo conectar con la API",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/sheets?refresh=true&mes=abr_2026");
      await fetchStatus();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const lastUpdatedStr = status?.lastUpdated
    ? new Date(status.lastUpdated).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin datos en caché";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Configuración
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Estado de la conexión y configuración del sistema
        </p>
      </div>

      <div className="gold-separator" />

      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-accent-gold" />
            Conexión Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verificando conexión...
            </div>
          ) : (
            <>
              {/* Estado general */}
              <div className="flex items-center gap-3">
                {status?.status === "ok" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-positive" />
                    <span className="text-positive text-sm font-medium">Conectado — Solo lectura (Viewer)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-negative" />
                    <span className="text-negative text-sm font-medium">Error de conexión</span>
                  </>
                )}
              </div>

              {status?.error && (
                <div className="text-xs text-negative/80 bg-negative/10 border border-negative/20 rounded px-3 py-2">
                  {status.error}
                </div>
              )}

              {/* IDs configurados */}
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                    Admin 2026 Henry (Sheet ID)
                  </p>
                  <code className="text-xs text-accent-bone bg-background border border-border rounded px-2 py-1 block break-all">
                    {status?.adminSheetId ?? "—"}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                    Análisis y Base de datos APP (Sheet ID)
                  </p>
                  <code className="text-xs text-accent-bone bg-background border border-border rounded px-2 py-1 block break-all">
                    {status?.eerrSheetId ?? "—"}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                    Última actualización de caché
                  </p>
                  <p className="text-sm text-text-primary">{lastUpdatedStr}</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleForceRefresh}
                disabled={refreshing}
                className="gap-2"
                aria-label="Forzar actualización de caché"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Actualizando..." : "Forzar refresh de datos"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modo de acceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent-gold" />
            Permisos de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-positive flex-shrink-0" />
            <span className="text-sm text-text-primary">
              Scope: <code className="text-accent-gold text-xs">spreadsheets.readonly</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-positive flex-shrink-0" />
            <span className="text-sm text-text-primary">
              Service Account configurada como <strong>Viewer</strong> en ambas planillas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-text-secondary flex-shrink-0" />
            <span className="text-sm text-text-secondary">
              Sin permisos de escritura — la aplicación es de solo lectura
            </span>
          </div>
          <div className="mt-3 text-xs text-text-secondary bg-surface-hover border border-border rounded px-3 py-2 leading-relaxed">
            Esta aplicación nunca escribe, modifica ni elimina datos en Google Sheets.
            Únicamente lee datos para mostrarlos en el dashboard.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
