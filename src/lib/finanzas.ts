import { supabase } from "./supabaseClient";

export type Movimiento = {
  id: string;
  tipo: "ingreso" | "reinversion" | "sueldo";
  monto: number;
  fecha_movimiento: string;
  referencia: string | null;
  cuenta_id: string;
};

export type ClienteActivo = {
  nombre: string;
  cantidadOrdenes: number;
  totalFacturado: number;
};

/**
 * Devuelve todos los movimientos de un mes específico
 * @param mes 0-11 (Enero = 0)
 * @param año 2026
 */
export const obtenerMovimientosPorMes = async (
  mes: number,
  año: number
): Promise<Movimiento[]> => {
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from("caja_movimientos")
    .select("*")
    .gte("fecha_movimiento", primerDia.toISOString())
    .lte("fecha_movimiento", ultimoDia.toISOString());

  if (error) {
    console.error(error);
    return [];
  }

  return data as Movimiento[];
};

/** Calcula ingresos del mes */
export const calcularIngresosMes = async (mes?: number, año?: number) => {
  let movimientos = mes !== undefined && año !== undefined
    ? await obtenerMovimientosPorMes(mes, año)
    : await obtenerMovimientosPorMes(new Date().getMonth(), new Date().getFullYear());

  return movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + Number(m.monto), 0);
};

/** Calcula reinversión del mes (valor positivo) */
export const calcularReinversionMes = async (mes?: number, año?: number) => {
  let movimientos = mes !== undefined && año !== undefined
    ? await obtenerMovimientosPorMes(mes, año)
    : await obtenerMovimientosPorMes(new Date().getMonth(), new Date().getFullYear());

  return movimientos
    .filter((m) => m.tipo === "reinversion")
    .reduce((acc, m) => acc + Math.abs(Number(m.monto)), 0); // siempre positivo
};

/** Calcula sueldo del mes */
export const calcularSueldoMes = async (mes?: number, año?: number) => {
  let movimientos = mes !== undefined && año !== undefined
    ? await obtenerMovimientosPorMes(mes, año)
    : await obtenerMovimientosPorMes(new Date().getMonth(), new Date().getFullYear());

  return movimientos
    .filter((m) => m.tipo === "sueldo")
    .reduce((acc, m) => acc + Number(m.monto), 0);
};

/** Ganancia neta = ingresos - reinversión - sueldo */
export const calcularGananciaNetaMes = async (mes?: number, año?: number) => {
  const ingresos = await calcularIngresosMes(mes, año);
  const reinversion = await calcularReinversionMes(mes, año);
  const sueldo = await calcularSueldoMes(mes, año);
  return ingresos - reinversion - sueldo;
};

/** Cliente más activo de un mes */
export const calcularClienteMasActivo = async (mes?: number, año?: number): Promise<ClienteActivo | null> => {
  const fechaInicio = mes !== undefined && año !== undefined
    ? new Date(año, mes, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const fechaFin = mes !== undefined && año !== undefined
    ? new Date(año, mes + 1, 0, 23, 59, 59)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  // Traer órdenes del mes
  const { data: ordenes, error } = await supabase
    .from("ordenes")
    .select("cliente_id,total")
    .gte("created_at", fechaInicio.toISOString())
    .lte("created_at", fechaFin.toISOString());

  if (error || !ordenes || ordenes.length === 0) return null;

  // Contar cantidad de órdenes por cliente
  const contador: Record<string, { cantidad: number; total: number }> = {};

  ordenes.forEach((o: any) => {
    if (!contador[o.cliente_id]) contador[o.cliente_id] = { cantidad: 0, total: 0 };
    contador[o.cliente_id].cantidad += 1;
    contador[o.cliente_id].total += Number(o.total);
  });

  // Encontrar cliente con más órdenes
  const clienteIdMasActivo = Object.entries(contador).sort((a, b) => b[1].cantidad - a[1].cantidad)[0][0];
  const clienteData = await supabase
    .from("clientes")
    .select("nombre_completo")
    .eq("id", clienteIdMasActivo)
    .single();

  if (!clienteData.data) return null;

  return {
    nombre: clienteData.data.nombre_completo,
    cantidadOrdenes: contador[clienteIdMasActivo].cantidad,
    totalFacturado: contador[clienteIdMasActivo].total,
  };
};
