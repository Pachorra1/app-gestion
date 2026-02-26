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
const formatearRangoMes = (mes?: number, año?: number) => {
  const fecha = mes !== undefined && año !== undefined
    ? { inicio: new Date(año, mes, 1), fin: new Date(año, mes + 1, 0, 23, 59, 59) }
    : (() => {
        const ahora = new Date();
        return {
          inicio: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
          fin: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59),
        };
      })();
  return {
    inicioISO: fecha.inicio.toISOString(),
    finISO: fecha.fin.toISOString(),
  };
};

export const obtenerMovimientosPorMes = async (
  mes: number,
  año: number
): Promise<Movimiento[]> => {
  const { inicioISO, finISO } = formatearRangoMes(mes, año);

  const { data, error } = await supabase
    .from("caja_movimientos")
    .select("*")
    .gte("fecha_movimiento", inicioISO)
    .lte("fecha_movimiento", finISO);

  if (error) {
    console.error(error);
    return [];
  }

  return data as Movimiento[];
};

const obtenerOrdenesPorMes = async (mes?: number, año?: number) => {
  const { inicioISO, finISO } = formatearRangoMes(mes, año);
  const { data, error } = await supabase
    .from("ordenes")
    .select("id, cliente_id, total, cantidad_real_gramos, fecha")
    .gte("fecha", inicioISO)
    .lte("fecha", finISO);

  if (error || !data) {
    return [];
  }

  return data as {
    id: string;
    cliente_id: string | null;
    total: number;
    cantidad_real_gramos?: number | null;
  }[];
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

/** Ganancia neta = ingresos - reinversión (sin descontar sueldo) */
export const calcularGananciaNetaMes = async (mes?: number, año?: number) => {
  const ingresos = await calcularIngresosMes(mes, año);
  const reinversion = await calcularReinversionMes(mes, año);
  return ingresos - reinversion;
};

/** Cliente más activo de un mes */
export const calcularClienteMasActivo = async (mes?: number, año?: number): Promise<ClienteActivo | null> => {
  const ordenes = await obtenerOrdenesPorMes(mes, año);

  if (ordenes.length === 0) return null;

  // Contar cantidad de órdenes por cliente
  const contador: Record<string, { cantidad: number; total: number }> = {};

  ordenes.forEach((o: any) => {
    const clienteId = o.cliente_id;
    if (!clienteId) return;
    if (!contador[clienteId]) contador[clienteId] = { cantidad: 0, total: 0 };
    contador[clienteId].cantidad += 1;
    contador[clienteId].total += Number(o.total);
  });

  // Encontrar cliente con más órdenes
  if (Object.keys(contador).length === 0) return null;
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

export const calcularGramosVendidosMes = async (mes?: number, año?: number) => {
  const ordenes = await obtenerOrdenesPorMes(mes, año);
  return ordenes.reduce((acc, orden) => {
    const gramos = orden.cantidad_cobrada_gramos ?? orden.cantidad_real_gramos ?? 0;
    return acc + Number(gramos);
  }, 0);
};
