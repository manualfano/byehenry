"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPesos, formatPorcentaje } from "@/lib/format";
import type { EERRData } from "@/types/eerr";
import { cn } from "@/lib/utils";

interface EERRTableProps {
  eerr: EERRData;
  eerrComparacion?: EERRData | null;
}

interface Fila {
  id: string;
  concepto: string;
  indent: number;
  getValue: (d: EERRData) => number;
  showPct?: boolean;      // mostrar % sobre ventas brutas
  isBold?: boolean;
  isTotal?: boolean;      // fila de totales (tipografía más grande)
  colorResult?: boolean;  // verde/rojo según positivo/negativo
  separatorBefore?: boolean;
}

const FILAS: Fila[] = [
  // VENTAS
  { id: "ventas_brutas",     concepto: "VENTAS BRUTAS",             indent: 0, isBold: true, isTotal: true, showPct: true,  separatorBefore: false, getValue: d => d.ventasBrutas },
  { id: "funcionamiento",    concepto: "Funcionamiento",            indent: 1, showPct: true,  getValue: d => d.ventas.funcionamiento },
  { id: "rest_delivery",     concepto: "Restaurant + Delivery",     indent: 2, getValue: d => d.ventas.restaurantDelivery },
  { id: "bar_ventas",        concepto: "Bar",                       indent: 2, getValue: d => d.ventas.bar },
  { id: "otros_ingresos",    concepto: "Otros ingresos operativos", indent: 1, getValue: d => d.ventas.otrosIngresosOperativos },
  { id: "senas",             concepto: "Señas",                     indent: 1, getValue: d => d.ventas.senas },

  // CMV
  { id: "cmv_total",         concepto: "CMV",                       indent: 0, isBold: true, isTotal: true, showPct: true, separatorBefore: true, getValue: d => d.cmv.total },
  { id: "alimentos",         concepto: "Alimentos (Pagas)",         indent: 1, showPct: true, getValue: d => d.cmv.alimentos },
  { id: "beb_sin_alc",       concepto: "Bebidas sin alcohol (Pagas)", indent: 1, showPct: true, getValue: d => d.cmv.bebidasSinAlcohol },
  { id: "beb_con_alc",       concepto: "Bebidas con alcohol (Pagas)", indent: 1, showPct: true, getValue: d => d.cmv.bebidasConAlcohol },
  { id: "cervezas",          concepto: "Cervezas (Pagas)",          indent: 1, showPct: true, getValue: d => d.cmv.cervezas },
  { id: "saldo_impagas",     concepto: "Saldo proveedores (Impagas)", indent: 1, showPct: true, getValue: d => d.cmv.saldoImpagas },
  { id: "cmv_neto_cc",       concepto: "CMV Neto cuenta corriente", indent: 1, isBold: true, getValue: d => d.cmv.cmvNetoCuentaCorriente },

  // UTILIDAD BRUTA
  { id: "util_bruta",        concepto: "UTILIDAD BRUTA",            indent: 0, isBold: true, isTotal: true, showPct: true, colorResult: true, separatorBefore: true, getValue: d => d.utilidadBruta },

  // SUELDOS
  { id: "sueldos_header",    concepto: "Sueldos",                   indent: 0, isBold: true, isTotal: true, showPct: true, separatorBefore: true, getValue: d => d.gastosOperativos.sueldos.total },
  { id: "s_general",         concepto: "General",                   indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.general },
  { id: "s_cocina",          concepto: "Cocina",                    indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.cocina },
  { id: "s_salon",           concepto: "Salón",                     indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.salon },
  { id: "s_bar_gen_30",      concepto: "Bar - General Extra 30%",   indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barGeneralExtra30 },
  { id: "s_bar_coc_30",      concepto: "Bar - Cocina Extra 30%",    indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barCocinaExtra30 },
  { id: "s_bar_sal_30",      concepto: "Bar - Salón Extra 30%",     indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barSalonExtra30 },
  { id: "s_bar_seg",         concepto: "Bar - Seguridad",           indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barSeguridad },
  { id: "s_bar_rrpp",        concepto: "Bar - RRPP",                indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barRRPP },
  { id: "s_bar_dj",          concepto: "Bar - DJ",                  indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.barDJ },
  { id: "s_viandas_coc",     concepto: "Viandas cocina",            indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.viandasCocina },
  { id: "s_viandas_log",     concepto: "Viandas logística",         indent: 1, showPct: true, getValue: d => d.gastosOperativos.sueldos.viandasLogistica },

  // ALQUILERES
  { id: "alquileres",        concepto: "Alquileres",                indent: 0, isBold: true, isTotal: true, showPct: true, separatorBefore: true, getValue: d => d.gastosOperativos.alquileres },

  // SERVICIOS
  { id: "servicios_header",  concepto: "Servicios",                 indent: 0, isBold: true, isTotal: true, showPct: true, separatorBefore: true, getValue: d => d.gastosOperativos.servicios.total },
  { id: "sv_elec",           concepto: "Electricidad",              indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.electricidad },
  { id: "sv_agua",           concepto: "Agua",                      indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.agua },
  { id: "sv_gas",            concepto: "Gas",                       indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.gas },
  { id: "sv_emerg",          concepto: "Emergencias médicas",       indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.emergenciasMedicas },
  { id: "sv_seg",            concepto: "Seguros",                   indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.seguros },
  { id: "sv_seghi",          concepto: "Seguridad e higiene",       indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.seguridadEHigiene },
  { id: "sv_tienda",         concepto: "Tienda de puntos",          indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.tiendaDePuntos },
  { id: "sv_asesor",         concepto: "Asesoría Orden Financiero", indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.asesoriaOrdenFinanciero },
  { id: "sv_cont",           concepto: "Contenedores",              indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.contenedores },
  { id: "sv_electrogeno",    concepto: "Grupo electrógeno",         indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.grupoElectrogeno },
  { id: "sv_softpos",        concepto: "Soft POS (Restosoft)",      indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.softPOS },
  { id: "sv_inet",           concepto: "Internet y telefonía",      indent: 1, showPct: true, getValue: d => d.gastosOperativos.servicios.internetYTelefonia },

  // OTROS RUBROS
  { id: "publicidad",        concepto: "Publicidad",                indent: 0, isBold: true, isTotal: true, showPct: true, separatorBefore: true, getValue: d => d.gastosOperativos.publicidad },
  { id: "produccion",        concepto: "Producción",                indent: 0, isBold: true, isTotal: true, showPct: true, getValue: d => d.gastosOperativos.produccion },
  { id: "gastos_admin",      concepto: "Gastos admin",              indent: 0, isBold: true, isTotal: true, showPct: true, getValue: d => d.gastosOperativos.gastosAdmin },
  { id: "limpieza",          concepto: "Limpieza",                  indent: 0, isBold: true, isTotal: true, showPct: true, getValue: d => d.gastosOperativos.limpieza },
  { id: "mantenimiento",     concepto: "Mantenimiento",             indent: 0, isBold: true, isTotal: true, showPct: true, getValue: d => d.gastosOperativos.mantenimiento },
  { id: "otras_deudas",      concepto: "Otras deudas impagas",      indent: 0, isBold: true, isTotal: true, showPct: true, getValue: d => d.gastosOperativos.otrasDeudas },

  // RESULTADO
  { id: "res_antes_imp",     concepto: "UT NETA ANTES DE IMPUESTOS", indent: 0, isBold: true, isTotal: true, showPct: true, colorResult: true, separatorBefore: true, getValue: d => d.resultadoAntesDeImpuestos },
  { id: "impuestos",         concepto: "Impuestos",                 indent: 1, showPct: true, getValue: d => d.impuestos },
  { id: "resultado_neto",    concepto: "RESULTADO NETO",            indent: 0, isBold: true, isTotal: true, showPct: true, colorResult: true, separatorBefore: true, getValue: d => d.resultadoNeto },
];

// Grupos colapsables
const GRUPOS: Record<string, string[]> = {
  ventas_brutas:    ["funcionamiento", "rest_delivery", "bar_ventas", "otros_ingresos", "senas"],
  cmv_total:        ["alimentos", "beb_sin_alc", "beb_con_alc", "cervezas", "saldo_impagas", "cmv_neto_cc"],
  sueldos_header:   ["s_general", "s_cocina", "s_salon", "s_bar_gen_30", "s_bar_coc_30", "s_bar_sal_30", "s_bar_seg", "s_bar_rrpp", "s_bar_dj", "s_viandas_coc", "s_viandas_log"],
  servicios_header: ["sv_elec", "sv_agua", "sv_gas", "sv_emerg", "sv_seg", "sv_seghi", "sv_tienda", "sv_asesor", "sv_cont", "sv_electrogeno", "sv_softpos", "sv_inet"],
  res_antes_imp:    ["impuestos"],
};

function pct(monto: number, base: number): string {
  if (!base || base === 0) return "—";
  return formatPorcentaje((monto / base) * 100);
}

function montoColor(fila: Fila, valor: number): string {
  if (fila.colorResult) return valor >= 0 ? "text-positive" : "text-negative";
  return "text-text-primary";
}

export function EERRTable({ eerr, eerrComparacion }: EERRTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["ventas_brutas", "cmv_total", "sueldos_header", "servicios_header", "res_antes_imp"])
  );
  const [copied, setCopied] = useState(false);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    const lines: string[] = [`EERR — ${eerr.mes.label}${eerrComparacion ? ` vs ${eerrComparacion.mes.label}` : ""}`];
    FILAS.forEach((f) => {
      const v = f.getValue(eerr);
      const prefix = "  ".repeat(f.indent);
      if (eerrComparacion) {
        const v2 = f.getValue(eerrComparacion);
        lines.push(`${prefix}${f.concepto.padEnd(36)} ${formatPesos(v).padStart(16)} ${pct(v, eerr.ventasBrutas).padStart(7)}   ${formatPesos(v2).padStart(16)} ${pct(v2, eerrComparacion.ventasBrutas).padStart(7)}`);
      } else {
        lines.push(`${prefix}${f.concepto.padEnd(36)} ${formatPesos(v).padStart(16)} ${pct(v, eerr.ventasBrutas).padStart(7)}`);
      }
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [eerr, eerrComparacion]);

  // Calcular visibilidad
  const hidden = new Set<string>();
  for (const [parentId, childIds] of Object.entries(GRUPOS)) {
    if (!expanded.has(parentId)) childIds.forEach((c) => hidden.add(c));
  }

  const conComparacion = !!eerrComparacion;

  // Grid layout: concepto + ($ + % por mes)
  const gridCols = conComparacion
    ? "grid-cols-[1fr_120px_64px_120px_64px]"
    : "grid-cols-[1fr_140px_72px]";

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <h2 className="font-heading text-sm font-semibold text-accent-gold uppercase tracking-widest">
          Estado de Resultados
        </h2>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      {/* Cabecera de columnas */}
      <div className={cn("grid px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border bg-surface-hover", gridCols)}>
        <span>Concepto</span>
        {conComparacion ? (
          <>
            <span className="text-right text-accent-gold">{eerr.mes.label}</span>
            <span className="text-right text-accent-gold">%</span>
            <span className="text-right text-accent-bone/60">{eerrComparacion!.mes.label}</span>
            <span className="text-right text-accent-bone/60">%</span>
          </>
        ) : (
          <>
            <span className="text-right">{eerr.mes.label}</span>
            <span className="text-right">%</span>
          </>
        )}
      </div>

      {/* Filas */}
      <div>
        {FILAS.map((fila, idx) => {
          if (hidden.has(fila.id)) return null;

          const hasChildren = GRUPOS[fila.id] !== undefined;
          const isExpanded = expanded.has(fila.id);
          const valor = fila.getValue(eerr);
          const valor2 = eerrComparacion ? fila.getValue(eerrComparacion) : null;
          const isZebra = idx % 2 === 0;

          return (
            <div key={fila.id}>
              {fila.separatorBefore && (
                <div className="h-px bg-accent-gold opacity-20 mx-4" />
              )}
              <div
                className={cn(
                  "grid px-4 items-center transition-colors",
                  gridCols,
                  fila.isTotal ? "py-3" : "py-2",
                  isZebra ? "bg-surface" : "bg-surface-hover",
                  hasChildren && "cursor-pointer hover:bg-surface-hover"
                )}
                onClick={hasChildren ? () => toggle(fila.id) : undefined}
                role={hasChildren ? "button" : undefined}
                aria-expanded={hasChildren ? isExpanded : undefined}
                tabIndex={hasChildren ? 0 : undefined}
                onKeyDown={hasChildren ? (e) => { if (e.key === "Enter" || e.key === " ") toggle(fila.id); } : undefined}
              >
                {/* Concepto */}
                <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: `${fila.indent * 18}px` }}>
                  {hasChildren && (
                    <span className="text-accent-gold flex-shrink-0">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                  )}
                  <span className={cn(
                    "truncate font-body",
                    fila.isTotal ? "text-sm font-bold text-text-primary" : fila.isBold ? "text-sm font-semibold text-accent-bone" : "text-sm text-text-secondary",
                    fila.indent === 0 && "text-accent-bone"
                  )}>
                    {fila.concepto}
                  </span>
                </div>

                {/* Mes principal */}
                <div className="text-right">
                  <span className={cn(
                    "font-body tabular-nums",
                    fila.isTotal ? "text-sm font-bold" : "text-sm",
                    montoColor(fila, valor)
                  )}>
                    {formatPesos(valor)}
                  </span>
                </div>
                <div className="text-right">
                  {fila.showPct ? (
                    <span className="text-xs text-text-secondary tabular-nums">{pct(valor, eerr.ventasBrutas)}</span>
                  ) : (
                    <span className="text-text-secondary text-xs">—</span>
                  )}
                </div>

                {/* Mes comparación */}
                {conComparacion && (
                  <>
                    <div className="text-right">
                      <span className={cn(
                        "font-body tabular-nums opacity-70",
                        fila.isTotal ? "text-sm font-bold" : "text-sm",
                        montoColor(fila, valor2!)
                      )}>
                        {formatPesos(valor2!)}
                      </span>
                    </div>
                    <div className="text-right">
                      {fila.showPct ? (
                        <span className="text-xs text-text-secondary/70 tabular-nums">{pct(valor2!, eerrComparacion!.ventasBrutas)}</span>
                      ) : (
                        <span className="text-text-secondary text-xs">—</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
