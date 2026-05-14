"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/eerr/MonthSelector";
import { KPICards } from "@/components/eerr/KPICards";
import { EERRTable } from "@/components/eerr/EERRTable";
import { MESES_DISPONIBLES } from "@/lib/eerr-calculator";
import type { EERRData, MonthData } from "@/types/eerr";

interface ApiResponse {
  eerr: EERRData;
  eerrAnterior: EERRData | null;
  lastUpdated: string | null;
  meses: MonthData[];
}

export default function EERRPage() {
  const [mesKey, setMesKey] = useState(MESES_DISPONIBLES[MESES_DISPONIBLES.length - 1].key);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (key: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/sheets?mes=${key}${forceRefresh ? "&refresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(mesKey);
  }, [mesKey, fetchData]);

  const handleRefresh = () => fetchData(mesKey, true);
  const handleMesChange = (key: string) => setMesKey(key);

  const lastUpdatedStr = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header de sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Estado de Resultados
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Datos en tiempo real desde Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdatedStr && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary" aria-live="polite">
              <Clock className="h-3 w-3" />
              <span>Actualizado: {lastUpdatedStr}</span>
            </div>
          )}

          <MonthSelector
            meses={data?.meses ?? MESES_DISPONIBLES}
            selectedKey={mesKey}
            onChange={handleMesChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Actualizar datos desde Google Sheets"
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Separador dorado */}
      <div className="gold-separator" />

      {/* Estado de carga */}
      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-accent-gold mx-auto" />
            <p className="text-text-secondary text-sm">Cargando datos de Google Sheets...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-lg border border-negative/30 bg-negative/10"
        >
          <AlertCircle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-negative">Error al cargar los datos</p>
            <p className="text-xs text-negative/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Contenido */}
      {data && !loading && (
        <div className="space-y-6 fade-in">
          <KPICards eerr={data.eerr} eerrAnterior={data.eerrAnterior} />
          <EERRTable eerr={data.eerr} eerrAnterior={data.eerrAnterior} />
        </div>
      )}

      {/* Loading overlay cuando ya hay datos */}
      {loading && data && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 shadow-gold text-xs text-text-secondary">
          <RefreshCw className="h-3 w-3 animate-spin text-accent-gold" />
          Actualizando...
        </div>
      )}
    </div>
  );
}
