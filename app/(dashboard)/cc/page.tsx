"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Clock, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPesos } from "@/lib/format";
import type { CCData, Cuenta } from "@/types/cc";
import { CUENTAS } from "@/types/cc";
import { cn } from "@/lib/utils";

const CUENTA_COLORS: Record<Cuenta, string> = {
  "Cortez":       "text-violet-400",
  "BH Gonnet":    "text-sky-400",
  "BH Diagonal":  "text-emerald-400",
};

function formatDate(s: string): string {
  if (!s) return "";
  // Formato DD/MM/YYYY
  const parts = s.split("/");
  if (parts.length === 3) return `${parts[0]}/${parts[1]}`;
  return s;
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

export default function CCPage() {
  const [data, setData] = useState<CCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mes, setMes] = useState<string>("");
  const [cuentaFiltro, setCuentaFiltro] = useState<string>("todas");

  const fetchData = useCallback(async (mesKey?: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (mesKey) params.set("mes", mesKey);
      if (forceRefresh) params.set("refresh", "true");
      const res = await fetch(`/api/cc?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const json: CCData = await res.json();
      setData(json);
      if (!mesKey) setMes(json.mes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMesChange = (val: string) => {
    setMes(val);
    fetchData(val);
  };

  const movsFiltrados = data?.movimientos.filter(m =>
    cuentaFiltro === "todas" || m.cuenta === cuentaFiltro
  ) ?? [];

  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Cuenta Corriente</h1>
          <p className="text-text-secondary text-sm mt-0.5">Intergrupo · Cortez · BH Gonnet · BH Diagonal</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="h-3 w-3" />
              <span>{lastUpdated}</span>
            </div>
          )}
          {data && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Mes</span>
              <Select value={mes} onValueChange={handleMesChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {data.mesesDisponibles.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchData(mes, true)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="gold-separator" />

      {/* Carga */}
      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-accent-gold mx-auto" />
            <p className="text-text-secondary text-sm">Cargando cuenta corriente...</p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-lg border border-negative/30 bg-negative/10">
          <AlertCircle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-negative">Error al cargar</p>
            <p className="text-xs text-negative/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 fade-in">

          {/* KPI — Saldos actuales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CUENTAS.map(cuenta => {
              const saldo = data.saldosActuales[cuenta];
              const resumen = data.resumenPorCuenta.find(r => r.cuenta === cuenta);
              return (
                <div key={cuenta} className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-gold opacity-60" />
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{cuenta}</p>
                  <p className={cn("font-body text-xl font-bold tracking-tight tabular-nums", saldo >= 0 ? "text-text-primary" : "text-negative")}>
                    {formatPesos(saldo)}
                  </p>
                  {resumen && (
                    <p className="text-xs text-text-secondary mt-2">
                      Var. mes:{" "}
                      <span className={resumen.variacionNeta >= 0 ? "text-positive" : "text-negative"}>
                        {resumen.variacionNeta >= 0 ? "+" : ""}{formatPesos(resumen.variacionNeta)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}

            {/* Total */}
            <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-gold" />
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total Intergrupo</p>
              <p className={cn("font-body text-xl font-bold tracking-tight tabular-nums", data.totalSaldo >= 0 ? "text-text-primary" : "text-negative")}>
                {formatPesos(data.totalSaldo)}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Var. mes:{" "}
                <span className={data.totalVariacion >= 0 ? "text-positive" : "text-negative"}>
                  {data.totalVariacion >= 0 ? "+" : ""}{formatPesos(data.totalVariacion)}
                </span>
              </p>
            </div>
          </div>

          {/* Resumen del mes */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-accent-gold uppercase tracking-widest">
                Resumen · {mes}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Cuenta</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">(+) Sale del mes</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">(–) Entra del mes</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Variación neta</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Saldo actual</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resumenPorCuenta.map((r, i) => (
                    <tr key={r.cuenta} className={cn("border-b border-border/50 transition-colors hover:bg-surface-hover", i % 2 === 0 ? "bg-surface" : "bg-surface-hover")}>
                      <td className={cn("px-4 py-3 font-semibold", CUENTA_COLORS[r.cuenta])}>{r.cuenta}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">{formatPesos(r.saleDelMes)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatPesos(r.entraDelMes)}</td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", r.variacionNeta >= 0 ? "text-positive" : "text-negative")}>
                        <span className="inline-flex items-center justify-end gap-1">
                          <TrendIcon value={r.variacionNeta} />
                          {formatPesos(Math.abs(r.variacionNeta))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-text-primary">{formatPesos(r.saldoActual)}</td>
                    </tr>
                  ))}
                  {/* Total */}
                  <tr className="border-t-2 border-accent-gold/30 bg-surface font-bold">
                    <td className="px-4 py-3 text-accent-gold font-bold uppercase text-xs tracking-wider">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary">{formatPesos(data.totalSale)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatPesos(data.totalEntra)}</td>
                    <td className={cn("px-4 py-3 text-right tabular-nums font-bold", data.totalVariacion >= 0 ? "text-positive" : "text-negative")}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <TrendIcon value={data.totalVariacion} />
                        {formatPesos(Math.abs(data.totalVariacion))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-text-primary">{formatPesos(data.totalSaldo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Movimientos del mes */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-accent-gold uppercase tracking-widest">
                Movimientos · {mes}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Filtrar:</span>
                <Select value={cuentaFiltro} onValueChange={setCuentaFiltro}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las cuentas</SelectItem>
                    {CUENTAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Cuenta</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Categoría</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Descripción</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Importe</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-text-secondary uppercase tracking-wider">Saldo acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {movsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-text-secondary text-sm">
                        Sin movimientos para este período
                      </td>
                    </tr>
                  ) : movsFiltrados.map((m, i) => (
                    <tr key={i} className={cn("border-b border-border/50 transition-colors hover:bg-surface-hover", i % 2 === 0 ? "bg-surface" : "bg-surface-hover")}>
                      <td className="px-4 py-2.5 text-text-secondary tabular-nums">{formatDate(m.fecha)}</td>
                      <td className={cn("px-4 py-2.5 font-medium text-xs", CUENTA_COLORS[m.cuenta])}>{m.cuenta}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          m.tipo === "Sale" ? "bg-positive/10 text-positive" : "bg-text-secondary/10 text-text-secondary"
                        )}>
                          {m.tipo === "Sale" ? "↑ Sale" : "↓ Entra"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary text-xs">{m.categoria}</td>
                      <td className="px-4 py-2.5 text-text-primary text-xs max-w-[200px] truncate">{m.descripcion}</td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums font-medium", m.tipo === "Sale" ? "text-text-primary" : "text-text-secondary")}>
                        {formatPesos(m.importe)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary text-xs">{formatPesos(m.saldoAcumulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {movsFiltrados.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border bg-surface-hover text-xs text-text-secondary">
                {movsFiltrados.length} movimiento{movsFiltrados.length !== 1 ? "s" : ""} · Solo lectura
              </div>
            )}
          </div>

        </div>
      )}

      {loading && data && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 shadow-gold text-xs text-text-secondary">
          <RefreshCw className="h-3 w-3 animate-spin text-accent-gold" />
          Actualizando...
        </div>
      )}
    </div>
  );
}
