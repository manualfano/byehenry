"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MonthData } from "@/types/eerr";

interface MonthSelectorProps {
  meses: MonthData[];
  selectedKey: string;
  onChange: (key: string) => void;
  allowNone?: boolean;
}

export function MonthSelector({ meses, selectedKey, onChange, allowNone }: MonthSelectorProps) {
  return (
    <Select value={selectedKey || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="w-44" aria-label="Seleccionar mes">
        <SelectValue placeholder={allowNone ? "Sin comparación" : "Seleccionar mes"} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value="__none__">Sin comparación</SelectItem>
        )}
        {meses.map((mes) => (
          <SelectItem key={mes.key} value={mes.key}>
            {mes.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
