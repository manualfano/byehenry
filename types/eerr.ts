export interface MonthData {
  label: string;      // "Abril 2026"
  key: string;        // "abr_2026"
  mesExtr: string;    // "abril 2026" — como aparece en Egresos col Mes_extr
  mesImpagas: string; // "Abr 26" — como aparece en Impagas col Mes
  eerrCol: number;    // índice 0-based de la columna EERR en $ (D=3, G=6, J=9)
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
      barGeneralExtra30: number;
      barCocinaExtra30: number;
      barSalonExtra30: number;
      barSeguridad: number;
      barRRPP: number;
      barDJ: number;
      viandasCocina: number;
      viandasLogistica: number;
    };
    alquileres: number;
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
      grupoElectrogeno: number;
      softPOS: number;
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

export interface EgresosRow {
  fechaPago: string;
  fechaRemito: string;
  semana: string;
  mesExtr: string;
  descripcion: string;
  proveedor: string;
  categoria: string;
  subcategoriaSubeldos: string;
  efectivo: string | number;
  banco: string | number;
  cobro: string | number;
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
  importe: string | number;
  pagado: string | number;
  deuda: string | number;
}

export interface SheetData {
  egresos: EgresosRow[];
  impagas: ImpagasRow[];
  eerr: (string | number | null)[][];
  lastUpdated: Date;
}

export interface KPICard {
  titulo: string;
  valor: number;
  variacion?: number;
  formato: "pesos" | "porcentaje";
  positiveIsGood?: boolean;
}
