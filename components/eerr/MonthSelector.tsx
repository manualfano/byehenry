"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MonthData } from "@/types/eerr";

interface MonthSelectorProps {
  meses: MonthData[];
  selectedKey: string;
  onChange: (key: string) => void;
}

export function MonthSelector({ meses, selectedKey, onChange }: MonthSelectorProps) {
  return (
    <Select value={selectedKey} onValueChange={onChange}>
      <SelectTrigger
        className="w-44"
        aria-label="Seleccionar mes"
      >
        <SelectValue placeholder="Seleccionar mes" />
      </SelectTrigger>
      <SelectContent>
        {meses.map((mes) => (
          <SelectItem key={mes.key} value={mes.key}>
            {mes.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
