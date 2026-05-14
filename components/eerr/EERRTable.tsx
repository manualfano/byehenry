"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPesos, formatPorcentaje, formatVariacion } from "@/lib/format";
import { calcVariacion } from "@/lib/eerr-calculator";
import type { EERRData } from "@/types/eerr";
import { cn } from "@/lib/utils";

interface EERRTableProps {
  eerr: EERRData;
  eerrAnterior?: EERRData | null;
}

interface FilaEERR {
  id: string;
  concepto: string;
  monto: number;
  montoAnterior?: number;
  indent: number;        // 0=top, 1=section, 2=subsection, 3=detail
  isBold?: boolean;
  isHeader?: boolean;    // section header sin monto propio
  isTotal?: boolean;
  colorMonto?: "positive" | "negative" | "neutral";
  children?: string[];   // ids de filas hijo
  hidePct?: boolean;     // no mostrar % en esta fila
}

function buildFilas(eerr: EERRData, ant?: EERRData | null): FilaEERR[] {
  const v = eerr;
  const a = ant;
  const vbAnt = a?.ventasBrutas;

  const fila = (
    id: string,
    concepto: string,
    monto: number,
    montoAnterior: number | undefined,
    indent: number,
    opts?: Partial<FilaEERR>
  ): FilaEERR => ({ id, concepto, monto, montoAnterior, indent, ...opts });

  return [
    // VENTAS BRUTAS
    fila("ventas_brutas", "VENTAS BRUTAS", v.ventasBrutas, vbAnt, 0, { isBold: true, isTotal: true }),
    fila("funcionamiento", "Funcionamiento", v.ventas.funcionamiento, a?.ventas.funcionamiento, 1),
    fila("rest_delivery", "Restaurant + Delivery", v.ventas.restaurantDelivery, a?.ventas.restaurantDelivery, 2),
    fila("bar_ventas", "Bar", v.ventas.bar, a?.ventas.bar, 2),
    fila("otros_ingresos", "Otros ingresos operativos", v.ventas.otrosIngresosOperativos, a?.ventas.otrosIngresosOperativos, 1),
    fila("senas", "Señas", v.ventas.senas, a?.ventas.senas, 1),

    // CMV
    fila("cmv_total", "CMV", v.cmv.total, a?.cmv.total, 0, { isBold: true, isTotal: true }),
    fila("alimentos", "Alimentos (Pagas)", v.cmv.alimentos, a?.cmv.alimentos, 1),
    fila("beb_sin_alc", "Bebidas sin alcohol (Pagas)", v.cmv.bebidasSinAlcohol, a?.cmv.bebidasSinAlcohol, 1),
    fila("beb_con_alc", "Bebidas con alcohol (Pagas)", v.cmv.bebidasConAlcohol, a?.cmv.bebidasConAlcohol, 1),
    fila("cervezas", "Cervezas (Pagas)", v.cmv.cervezas, a?.cmv.cervezas, 1),
    fila("saldo_impagas", "Saldo proveedores (Impagas)", v.cmv.saldoImpagas, a?.cmv.saldoImpagas, 1),
    fila("cmv_neto_cc", "CMV Neto cuenta corriente", v.cmv.cmvNetoCuentaCorriente, a?.cmv.cmvNetoCuentaCorriente, 1, { isBold: true }),

    // UTILIDAD BRUTA
    fila("util_bruta", "UTILIDAD BRUTA", v.utilidadBruta, a?.utilidadBruta, 0, {
      isBold: true,
      isTotal: true,
      colorMonto: v.utilidadBruta >= 0 ? "positive" : "negative",
    }),

    // GASTOS OPERATIVOS
    fila("gastos_op", "GASTOS OPERATIVOS", v.gastosOperativos.total, a?.gastosOperativos.total, 0, { isBold: true, isTotal: true }),

    // SUELDOS
    fila("sueldos_header", "SUELDOS", v.gastosOperativos.sueldos.total, a?.gastosOperativos.sueldos.total, 1, { isBold: true }),
    fila("s_general", "General", v.gastosOperativos.sueldos.general, a?.gastosOperativos.sueldos.general, 2, { hidePct: true }),
    fila("s_cocina", "Cocina", v.gastosOperativos.sueldos.cocina, a?.gastosOperativos.sueldos.cocina, 2, { hidePct: true }),
    fila("s_salon", "Salón", v.gastosOperativos.sueldos.salon, a?.gastosOperativos.sueldos.salon, 2, { hidePct: true }),
    fila("s_bar_seg", "Bar - Seguridad", v.gastosOperativos.sueldos.barSeguridad, a?.gastosOperativos.sueldos.barSeguridad, 2, { hidePct: true }),
    fila("s_bar_rrpp", "Bar - RRPP", v.gastosOperativos.sueldos.barRRPP, a?.gastosOperativos.sueldos.barRRPP, 2, { hidePct: true }),
    fila("s_bar_dj", "Bar - DJ", v.gastosOperativos.sueldos.barDJ, a?.gastosOperativos.sueldos.barDJ, 2, { hidePct: true }),
    fila("s_bar_sal_30", "Bar - Salón Extra 30%", v.gastosOperativos.sueldos.barSalonExtra30, a?.gastosOperativos.sueldos.barSalonExtra30, 2, { hidePct: true }),
    fila("s_bar_coc_30", "Bar - Cocina Extra 30%", v.gastosOperativos.sueldos.barCocinaExtra30, a?.gastosOperativos.sueldos.barCocinaExtra30, 2, { hidePct: true }),
    fila("s_bar_gen_30", "Bar - General Extra 30%", v.gastosOperativos.sueldos.barGeneralExtra30, a?.gastosOperativos.sueldos.barGeneralExtra30, 2, { hidePct: true }),
    fila("s_viandas_coc", "Viandas cocina", v.gastosOperativos.sueldos.viandasCocina, a?.gastosOperativos.sueldos.viandasCocina, 2, { hidePct: true }),
    fila("s_viandas_log", "Viandas logística", v.gastosOperativos.sueldos.viandasLogistica, a?.gastosOperativos.sueldos.viandasLogistica, 2, { hidePct: true }),

    // SERVICIOS
    fila("servicios_header", "SERVICIOS", v.gastosOperativos.servicios.total, a?.gastosOperativos.servicios.total, 1, { isBold: true }),
    fila("sv_elec", "Electricidad", v.gastosOperativos.servicios.electricidad, a?.gastosOperativos.servicios.electricidad, 2, { hidePct: true }),
    fila("sv_agua", "Agua", v.gastosOperativos.servicios.agua, a?.gastosOperativos.servicios.agua, 2, { hidePct: true }),
    fila("sv_gas", "Gas", v.gastosOperativos.servicios.gas, a?.gastosOperativos.servicios.gas, 2, { hidePct: true }),
    fila("sv_emerg", "Emergencias médicas", v.gastosOperativos.servicios.emergenciasMedicas, a?.gastosOperativos.servicios.emergenciasMedicas, 2, { hidePct: true }),
    fila("sv_seg", "Seguros", v.gastosOperativos.servicios.seguros, a?.gastosOperativos.servicios.seguros, 2, { hidePct: true }),
    fila("sv_seghi", "Seguridad e higiene", v.gastosOperativos.servicios.seguridadEHigiene, a?.gastosOperativos.servicios.seguridadEHigiene, 2, { hidePct: true }),
    fila("sv_tienda", "Tienda de puntos", v.gastosOperativos.servicios.tiendaDePuntos, a?.gastosOperativos.servicios.tiendaDePuntos, 2, { hidePct: true }),
    fila("sv_asesor", "Asesoría Orden Financiero", v.gastosOperativos.servicios.asesoriaOrdenFinanciero, a?.gastosOperativos.servicios.asesoriaOrdenFinanciero, 2, { hidePct: true }),
    fila("sv_cont", "Contenedores", v.gastosOperativos.servicios.contenedores, a?.gastosOperativos.servicios.contenedores, 2, { hidePct: true }),
    fila("sv_inet", "Internet y telefonía", v.gastosOperativos.servicios.internetYTelefonia, a?.gastosOperativos.servicios.internetYTelefonia, 2, { hidePct: true }),

    fila("publicidad", "PUBLICIDAD", v.gastosOperativos.publicidad, a?.gastosOperativos.publicidad, 1, { isBold: true }),
    fila("produccion", "PRODUCCIÓN", v.gastosOperativos.produccion, a?.gastosOperativos.produccion, 1, { isBold: true }),
    fila("gastos_admin", "GASTOS ADMIN", v.gastosOperativos.gastosAdmin, a?.gastosOperativos.gastosAdmin, 1, { isBold: true }),
    fila("limpieza", "LIMPIEZA", v.gastosOperativos.limpieza, a?.gastosOperativos.limpieza, 1, { isBold: true }),
    fila("mantenimiento", "MANTENIMIENTO", v.gastosOperativos.mantenimiento, a?.gastosOperativos.mantenimiento, 1, { isBold: true }),
    fila("otras_deudas", "OTRAS DEUDAS IMPAGAS", v.gastosOperativos.otrasDeudas, a?.gastosOperativos.otrasDeudas, 1, { isBold: true }),

    // RESULTADO
    fila("res_antes_imp", "RESULTADO ANTES DE IMPUESTOS", v.resultadoAntesDeImpuestos, a?.resultadoAntesDeImpuestos, 0, {
      isBold: true,
      isTotal: true,
      colorMonto: v.resultadoAntesDeImpuestos >= 0 ? "positive" : "negative",
    }),
    fila("impuestos", "Impuestos", v.impuestos, a?.impuestos, 1),
    fila("resultado_neto", "RESULTADO NETO", v.resultadoNeto, a?.resultadoNeto, 0, {
      isBold: true,
      isTotal: true,
      colorMonto: v.resultadoNeto >= 0 ? "positive" : "negative",
    }),
  ];
}

// Grupos colapsables: id del header → ids de sus hijos
const GRUPOS: Record<string, string[]> = {
  ventas_brutas: ["funcionamiento", "rest_delivery", "bar_ventas", "otros_ingresos", "senas"],
  cmv_total: ["alimentos", "beb_sin_alc", "beb_con_alc", "cervezas", "saldo_impagas", "cmv_neto_cc"],
  gastos_op: ["sueldos_header", "s_general", "s_cocina", "s_salon", "s_bar_seg", "s_bar_rrpp", "s_bar_dj", "s_bar_sal_30", "s_bar_coc_30", "s_bar_gen_30", "s_viandas_coc", "s_viandas_log", "servicios_header", "sv_elec", "sv_agua", "sv_gas", "sv_emerg", "sv_seg", "sv_seghi", "sv_tienda", "sv_asesor", "sv_cont", "sv_inet", "publicidad", "produccion", "gastos_admin", "limpieza", "mantenimiento", "otras_deudas"],
  sueldos_header: ["s_general", "s_cocina", "s_salon", "s_bar_seg", "s_bar_rrpp", "s_bar_dj", "s_bar_sal_30", "s_bar_coc_30", "s_bar_gen_30", "s_viandas_coc", "s_viandas_log"],
  servicios_header: ["sv_elec", "sv_agua", "sv_gas", "sv_emerg", "sv_seg", "sv_seghi", "sv_tienda", "sv_asesor", "sv_cont", "sv_inet"],
  res_antes_imp: ["impuestos"],
};

const SEPARADORES_ANTES = new Set([
  "ventas_brutas", "cmv_total", "util_bruta", "gastos_op", "res_antes_imp", "resultado_neto",
]);

function VariacionCell({ actual, anterior }: { actual: number; anterior?: number }) {
  const variacion = calcVariacion(actual, anterior ?? 0);
  if (variacion === undefined) return <span className="text-text-secondary text-xs">—</span>;

  const Icon = Math.abs(variacion) < 0.1 ? Minus : variacion > 0 ? TrendingUp : TrendingDown;
  const color = variacion >= 0 ? "text-positive" : "text-negative";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", color)}>
      <Icon className="h-3 w-3" />
      {formatVariacion(variacion)}
    </span>
  );
}

function generarTextoEERR(eerr: EERRData): string {
  const f = (n: number) => formatPesos(n);
  const p = (n: number, base: number) =>
    base > 0 ? formatPorcentaje((n / base) * 100) : "—";
  const vb = eerr.ventasBrutas;

  const lines = [
    `ESTADO DE RESULTADOS — ${eerr.mes.label}`,
    `${"=".repeat(60)}`,
    `VENTAS BRUTAS                    ${f(vb).padStart(18)}   100%`,
    `  Funcionamiento                 ${f(eerr.ventas.funcionamiento).padStart(18)}`,
    `    Restaurant + Delivery        ${f(eerr.ventas.restaurantDelivery).padStart(18)}`,
    `    Bar                          ${f(eerr.ventas.bar).padStart(18)}`,
    `  Otros ingresos operativos      ${f(eerr.ventas.otrosIngresosOperativos).padStart(18)}`,
    `  Señas                          ${f(eerr.ventas.senas).padStart(18)}`,
    "",
    `CMV                              ${f(eerr.cmv.total).padStart(18)}   ${p(eerr.cmv.total, vb)}`,
    `  Alimentos (Pagas)              ${f(eerr.cmv.alimentos).padStart(18)}   ${p(eerr.cmv.alimentos, vb)}`,
    `  Bebidas sin alcohol (Pagas)    ${f(eerr.cmv.bebidasSinAlcohol).padStart(18)}   ${p(eerr.cmv.bebidasSinAlcohol, vb)}`,
    `  Bebidas con alcohol (Pagas)    ${f(eerr.cmv.bebidasConAlcohol).padStart(18)}   ${p(eerr.cmv.bebidasConAlcohol, vb)}`,
    `  Cervezas (Pagas)               ${f(eerr.cmv.cervezas).padStart(18)}   ${p(eerr.cmv.cervezas, vb)}`,
    `  Saldo proveedores (Impagas)    ${f(eerr.cmv.saldoImpagas).padStart(18)}   ${p(eerr.cmv.saldoImpagas, vb)}`,
    `  CMV Neto cuenta corriente      ${f(eerr.cmv.cmvNetoCuentaCorriente).padStart(18)}   ${p(eerr.cmv.cmvNetoCuentaCorriente, vb)}`,
    "",
    `UTILIDAD BRUTA                   ${f(eerr.utilidadBruta).padStart(18)}   ${p(eerr.utilidadBruta, vb)}`,
    "",
    `GASTOS OPERATIVOS                ${f(eerr.gastosOperativos.total).padStart(18)}   ${p(eerr.gastosOperativos.total, vb)}`,
    `  SUELDOS                        ${f(eerr.gastosOperativos.sueldos.total).padStart(18)}   ${p(eerr.gastosOperativos.sueldos.total, vb)}`,
    `    General                      ${f(eerr.gastosOperativos.sueldos.general).padStart(18)}`,
    `    Cocina                       ${f(eerr.gastosOperativos.sueldos.cocina).padStart(18)}`,
    `    Salón                        ${f(eerr.gastosOperativos.sueldos.salon).padStart(18)}`,
    `    Bar - Seguridad              ${f(eerr.gastosOperativos.sueldos.barSeguridad).padStart(18)}`,
    `    Bar - RRPP                   ${f(eerr.gastosOperativos.sueldos.barRRPP).padStart(18)}`,
    `    Bar - DJ                     ${f(eerr.gastosOperativos.sueldos.barDJ).padStart(18)}`,
    `    Bar - Salón Extra 30%        ${f(eerr.gastosOperativos.sueldos.barSalonExtra30).padStart(18)}`,
    `    Bar - Cocina Extra 30%       ${f(eerr.gastosOperativos.sueldos.barCocinaExtra30).padStart(18)}`,
    `    Bar - General Extra 30%      ${f(eerr.gastosOperativos.sueldos.barGeneralExtra30).padStart(18)}`,
    `    Viandas cocina               ${f(eerr.gastosOperativos.sueldos.viandasCocina).padStart(18)}`,
    `    Viandas logística            ${f(eerr.gastosOperativos.sueldos.viandasLogistica).padStart(18)}`,
    `  SERVICIOS                      ${f(eerr.gastosOperativos.servicios.total).padStart(18)}   ${p(eerr.gastosOperativos.servicios.total, vb)}`,
    `  PUBLICIDAD                     ${f(eerr.gastosOperativos.publicidad).padStart(18)}   ${p(eerr.gastosOperativos.publicidad, vb)}`,
    `  PRODUCCIÓN                     ${f(eerr.gastosOperativos.produccion).padStart(18)}   ${p(eerr.gastosOperativos.produccion, vb)}`,
    `  GASTOS ADMIN                   ${f(eerr.gastosOperativos.gastosAdmin).padStart(18)}   ${p(eerr.gastosOperativos.gastosAdmin, vb)}`,
    `  LIMPIEZA                       ${f(eerr.gastosOperativos.limpieza).padStart(18)}   ${p(eerr.gastosOperativos.limpieza, vb)}`,
    `  MANTENIMIENTO                  ${f(eerr.gastosOperativos.mantenimiento).padStart(18)}   ${p(eerr.gastosOperativos.mantenimiento, vb)}`,
    `  OTRAS DEUDAS IMPAGAS           ${f(eerr.gastosOperativos.otrasDeudas).padStart(18)}   ${p(eerr.gastosOperativos.otrasDeudas, vb)}`,
    "",
    `RESULTADO ANTES DE IMPUESTOS     ${f(eerr.resultadoAntesDeImpuestos).padStart(18)}   ${p(eerr.resultadoAntesDeImpuestos, vb)}`,
    `  Impuestos                      ${f(eerr.impuestos).padStart(18)}   ${p(eerr.impuestos, vb)}`,
    "",
    `RESULTADO NETO                   ${f(eerr.resultadoNeto).padStart(18)}   ${p(eerr.resultadoNeto, vb)}`,
  ];

  return lines.join("\n");
}

export function EERRTable({ eerr, eerrAnterior }: EERRTableProps) {
  // Estado de qué grupos están expandidos
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["ventas_brutas", "cmv_total", "gastos_op", "sueldos_header", "servicios_header", "res_antes_imp"])
  );
  const [copied, setCopied] = useState(false);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Si colapsamos gastos_op también colapsar sus hijos
        if (id === "gastos_op") {
          next.delete("sueldos_header");
          next.delete("servicios_header");
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    const texto = generarTextoEERR(eerr);
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [eerr]);

  const filas = buildFilas(eerr, eerrAnterior);
  const vb = eerr.ventasBrutas;

  // Determinar cuáles filas son visibles
  const getVisible = (): Set<string> => {
    const visible = new Set<string>();
    // IDs de filas ocultas por colapso
    const hiddenByParent = new Set<string>();

    for (const [parentId, childIds] of Object.entries(GRUPOS)) {
      if (!expanded.has(parentId)) {
        childIds.forEach((c) => hiddenByParent.add(c));
      }
    }

    filas.forEach((f) => {
      if (!hiddenByParent.has(f.id)) visible.add(f.id);
    });
    return visible;
  };

  const visibleSet = getVisible();

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header de la tabla */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <h2 className="font-heading text-sm font-semibold text-accent-gold uppercase tracking-widest">
          Estado de Resultados
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label="Copiar EERR como texto"
          className="gap-2"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar como texto"}
        </Button>
      </div>

      {/* Cabecera de columnas */}
      <div className="grid grid-cols-[1fr_140px_80px_90px] px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border bg-[#0F0F0F]">
        <span>Concepto</span>
        <span className="text-right">Monto</span>
        <span className="text-right">% Ventas</span>
        <span className="text-right">Variación</span>
      </div>

      {/* Filas */}
      <div>
        {filas.map((fila, idx) => {
          if (!visibleSet.has(fila.id)) return null;

          const hasChildren = GRUPOS[fila.id] !== undefined;
          const isExpanded = expanded.has(fila.id);
          const pct = !fila.hidePct && vb > 0 ? (fila.monto / vb) * 100 : undefined;
          const isZebra = idx % 2 === 0;
          const hasSeparator = SEPARADORES_ANTES.has(fila.id);

          return (
            <div key={fila.id}>
              {hasSeparator && (
                <div className="h-[1px] bg-accent-gold opacity-20 mx-4" />
              )}
              <div
                className={cn(
                  "grid grid-cols-[1fr_140px_80px_90px] px-4 py-2.5 items-center transition-colors",
                  isZebra ? "bg-surface" : "bg-surface-hover",
                  hasChildren && "cursor-pointer hover:bg-[#1E1E1E]",
                  fila.isTotal && "py-3"
                )}
                onClick={hasChildren ? () => toggle(fila.id) : undefined}
                role={hasChildren ? "button" : undefined}
                aria-expanded={hasChildren ? isExpanded : undefined}
                tabIndex={hasChildren ? 0 : undefined}
                onKeyDown={hasChildren ? (e) => { if (e.key === "Enter" || e.key === " ") toggle(fila.id); } : undefined}
              >
                {/* Concepto */}
                <div
                  className="flex items-center gap-2 min-w-0"
                  style={{ paddingLeft: `${fila.indent * 20}px` }}
                >
                  {hasChildren && (
                    <span className="text-accent-gold flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                  <span
                    className={cn(
                      "truncate font-body",
                      fila.isTotal
                        ? "text-sm font-bold text-text-primary"
                        : fila.isBold
                        ? "text-sm font-semibold text-accent-bone"
                        : "text-sm text-text-secondary",
                      fila.indent === 0 && "text-accent-bone"
                    )}
                  >
                    {fila.concepto}
                  </span>
                </div>

                {/* Monto */}
                <div className="text-right">
                  <span
                    className={cn(
                      "font-body tabular-nums",
                      fila.isTotal ? "text-base font-bold" : "text-sm",
                      fila.colorMonto === "positive"
                        ? "text-positive"
                        : fila.colorMonto === "negative"
                        ? "text-negative"
                        : "text-text-primary"
                    )}
                  >
                    {formatPesos(fila.monto)}
                  </span>
                </div>

                {/* % Ventas */}
                <div className="text-right">
                  {pct !== undefined ? (
                    <span className="text-xs text-text-secondary tabular-nums">
                      {formatPorcentaje(pct)}
                    </span>
                  ) : (
                    <span className="text-text-secondary text-xs">—</span>
                  )}
                </div>

                {/* Variación */}
                <div className="text-right">
                  <VariacionCell actual={fila.monto} anterior={fila.montoAnterior} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
