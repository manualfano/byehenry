"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPesos, formatPorcentaje, formatVariacion } from "@/lib/format";
import type { EERRData } from "@/types/eerr";
import { calcVariacion } from "@/lib/eerr-calculator";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  eerr: EERRData;
  eerrAnterior?: EERRData | null;
}

interface KPIConfig {
  titulo: string;
  valor: number;
  valorAnterior?: number;
  esPositivoMejora: boolean; // false para CMV (menos es mejor)
  formato: "pesos" | "porcentaje";
}

function VariacionChip({
  variacion,
  esPositivoMejora,
}: {
  variacion?: number;
  esPositivoMejora: boolean;
}) {
  if (variacion === undefined) return null;
  const positivo = esPositivoMejora ? variacion >= 0 : variacion <= 0;
  const Icon = Math.abs(variacion) < 0.1 ? Minus : variacion > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5",
        positivo
          ? "text-positive bg-positive/10"
          : "text-negative bg-negative/10"
      )}
      aria-label={`Variación: ${formatVariacion(variacion)}`}
    >
      <Icon className="h-3 w-3" />
      {formatVariacion(variacion)}
    </span>
  );
}

export function KPICards({ eerr, eerrAnterior }: KPICardsProps) {
  const ventasBrutas = eerr.ventasBrutas;
  const cmvPct = ventasBrutas > 0 ? (eerr.cmv.total / ventasBrutas) * 100 : 0;
  const utilBrutaPct = ventasBrutas > 0 ? (eerr.utilidadBruta / ventasBrutas) * 100 : 0;
  const resultadoNeto = eerr.resultadoNeto;

  const cmvPctAnt = eerrAnterior && eerrAnterior.ventasBrutas > 0
    ? (eerrAnterior.cmv.total / eerrAnterior.ventasBrutas) * 100
    : undefined;
  const utilBrutaPctAnt = eerrAnterior && eerrAnterior.ventasBrutas > 0
    ? (eerrAnterior.utilidadBruta / eerrAnterior.ventasBrutas) * 100
    : undefined;

  const kpis: KPIConfig[] = [
    {
      titulo: "Ventas Brutas",
      valor: ventasBrutas,
      valorAnterior: eerrAnterior?.ventasBrutas,
      esPositivoMejora: true,
      formato: "pesos",
    },
    {
      titulo: "CMV",
      valor: cmvPct,
      valorAnterior: cmvPctAnt,
      esPositivoMejora: false,
      formato: "porcentaje",
    },
    {
      titulo: "Utilidad Bruta",
      valor: utilBrutaPct,
      valorAnterior: utilBrutaPctAnt,
      esPositivoMejora: true,
      formato: "porcentaje",
    },
    {
      titulo: "Resultado Neto",
      valor: resultadoNeto,
      valorAnterior: eerrAnterior?.resultadoNeto,
      esPositivoMejora: true,
      formato: "pesos",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const variacion = calcVariacion(kpi.valor, kpi.valorAnterior ?? 0);
        const isNegativo = kpi.valor < 0;

        return (
          <Card key={kpi.titulo} className="relative overflow-hidden">
            {/* Línea dorada superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-gold opacity-60" />
            <CardContent className="p-5">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                {kpi.titulo}
              </p>
              <p
                className={cn(
                  "font-body text-2xl font-bold tracking-tight",
                  isNegativo ? "text-negative" : "text-text-primary"
                )}
                aria-label={`${kpi.titulo}: ${kpi.formato === "pesos" ? formatPesos(kpi.valor) : formatPorcentaje(kpi.valor)}`}
              >
                {kpi.formato === "pesos"
                  ? formatPesos(kpi.valor)
                  : formatPorcentaje(kpi.valor)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <VariacionChip
                  variacion={variacion}
                  esPositivoMejora={kpi.esPositivoMejora}
                />
                {variacion !== undefined && (
                  <span className="text-xs text-text-secondary">vs mes ant.</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
