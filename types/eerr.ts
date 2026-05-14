export interface MonthData {
  label: string; // "Abril 2026"
  key: string;   // "abr_2026"
  mesExtr: string; // "abril 2026" — como aparece en Egresos
  mesImpagas: string; // "Abr 26" — como aparece en Impagas
}

export interface EERRLine {
  concepto: string;
  monto: number;
  porcentajeVentas?: number;
  variacionMesAnterior?: number; // porcentaje de variación
  children?: EERRLine[];
  isTotal?: boolean;
  isSubtotal?: boolean;
  isSectionHeader?: boolean;
}

export interface EERRData {
  mes: MonthData;
  ventasBrutas: number;
  ventas: {
    funcionamiento: number;
    restaurantDelivery: number;
    bar: number;
    otrosIngresosOperativos: number;
    senas: number;
  };
  cmv: {
    total: number;
    alimentos: number;
    bebidasSinAlcohol: number;
    bebidasConAlcohol: number;
    cervezas: number;
    saldoImpagas: number;
    cmvNetoCuentaCorriente: number;
  };
  utilidadBruta: number;
  gastosOperativos: {
    total: number;
    sueldos: {
      total: number;
      general: number;
      cocina: number;
      salon: number;
      barSeguridad: number;
      barRRPP: number;
      barDJ: number;
      barSalonExtra30: number;
      barCocinaExtra30: number;
      barGeneralExtra30: number;
      viandasCocina: number;
      viandasLogistica: number;
    };
    servicios: {
      total: number;
      electricidad: number;
      agua: number;
      gas: number;
      emergenciasMedicas: number;
      seguros: number;
      seguridadEHigiene: number;
      tiendaDePuntos: number;
      asesoriaOrdenFinanciero: number;
      contenedores: number;
      internetYTelefonia: number;
    };
    publicidad: number;
    produccion: number;
    gastosAdmin: number;
    limpieza: number;
    mantenimiento: number;
    otrasDeudas: number;
  };
  resultadoAntesDeImpuestos: number;
  impuestos: number;
  resultadoNeto: number;
}

export interface EERRComparison {
  actual: EERRData;
  anterior?: EERRData;
}

export interface EgresosRow {
  fechaPago: string;
  fechaRemito: string;
  semana: string;
  mesExtr: string;
  descripcion: string;
  proveedor: string;
  categoria: string;
  subcategoriaSubeldos: string;
  efectivo: string;
  banco: string;
  cobro: string;
  nCheque: string;
}

export interface ImpagasRow {
  fechaRemito: string;
  mes: string;
  pago: string;
  numero: string;
  estado: string;
  semana: string;
  proveedor: string;
  categoria: string;
  importe: string;
  pagado: string;
  deuda: string;
}

export interface SheetData {
  egresos: EgresosRow[];
  impagas: ImpagasRow[];
  eerr: string[][];
  lastUpdated: Date;
}

export interface KPICard {
  titulo: string;
  valor: number;
  variacion?: number; // porcentaje vs mes anterior
  formato: "pesos" | "porcentaje";
  positiveIsGood?: boolean; // para CMV%, negativo es bueno
}
