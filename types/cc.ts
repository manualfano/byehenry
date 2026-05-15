export type Cuenta = "Cortez" | "BH Gonnet" | "BH Diagonal";
export const CUENTAS: Cuenta[] = ["Cortez", "BH Gonnet", "BH Diagonal"];

export interface Movimiento {
  fecha: string;
  mes: string;
  cuenta: Cuenta;
  tipo: "Sale" | "Entra";
  categoria: string;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  importe: number;
  saldoAcumulado: number;
}

export interface ResumenCuenta {
  cuenta: Cuenta;
  saldoActual: number;
  saleDelMes: number;
  entraDelMes: number;
  variacionNeta: number;
}

export interface CCData {
  mes: string;
  mesesDisponibles: string[];
  saldosActuales: Record<Cuenta, number>;
  totalSaldo: number;
  resumenPorCuenta: ResumenCuenta[];
  totalSale: number;
  totalEntra: number;
  totalVariacion: number;
  movimientos: Movimiento[];
  lastUpdated: Date;
}
