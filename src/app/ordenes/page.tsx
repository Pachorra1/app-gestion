"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Cliente = {
  id: string;
  nombre_completo: string;
  compras_count?: number;
  total_gramos?: number;
  total_gastado?: number;
};

type Genetica = {
  id: string;
  nombre: string;
  cantidad_gramos: number;
};

type CajaCuenta = {
  id: string;
  nombre: string;
  balance: number;
};

type Mensaje = {
  tipo: "error" | "success" | "";
  texto: string;
};

type Orden = {
  id: string;
  fecha: string;
  numero_orden: string;
  metodo_pago: string;
  total: number;
  cliente_id?: string;
  cantidad_cobrada_gramos?: number;
};

export default function OrdenesPage() {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: "",
    geneticaId: "",
    cantidadReal: "",
    cantidadCobrada: "",
    precioPorGramo: "",
    numeroOrden: `ORD-${Date.now()}`,
    metodoPago: "",
    esPrueba: false,
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [geneticas, setGeneticas] = useState<Genetica[]>([]);
  const [cajaCuentas, setCajaCuentas] = useState<CajaCuenta[]>([]);
  const [mensaje, setMensaje] = useState<Mensaje>({ tipo: "", texto: "" });
  const [cargando, setCargando] = useState(false);
  const [ordenesRecientes, setOrdenesRecientes] = useState<Orden[]>([]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const cantidadReal = Number(form.cantidadReal) || 0;
  const cantidadCobrada = Number(form.cantidadCobrada) || 0;
  const precio = Number(form.precioPorGramo) || 0;
  const total = useMemo(() => cantidadCobrada * precio, [cantidadCobrada, precio]);
  const efectivo = Number(
    cajaCuentas.find((c) => c.nombre?.toLowerCase().includes("efectivo"))?.balance ?? 0
  );
  const billetera = Number(
    cajaCuentas.find((c) => c.nombre?.toLowerCase().includes("billetera"))?.balance ?? 0
  );

  useEffect(() => {
    const fetchData = async () => {
        const [
          { data: clientesData },
          { data: geneticasData },
          { data: cajaData },
          { data: ordenesData, error: ordenesError },
        ] = await Promise.all([
          supabase.from("clientes").select("id, nombre_completo"),
          supabase.from("geneticas").select("id, nombre, cantidad_gramos"),
          supabase.from("caja_cuentas").select("id, nombre, balance"),
          supabase
            .from("ordenes")
            .select("id, fecha, numero_orden, metodo_pago, total, cliente_id, cantidad_cobrada_gramos")
            .order("fecha", { ascending: false })
            .limit(8),
        ]);

      setClientes(clientesData || []);
      setGeneticas(geneticasData || []);
      setCajaCuentas(cajaData || []);

      if (!ordenesError) setOrdenesRecientes(ordenesData || []);
    };

    fetchData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const crearCliente = async () => {
    if (!newClientName.trim()) {
      setMensaje({ tipo: "error", texto: "El nombre no puede estar vacío." });
      return;
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre_completo: newClientName.trim() })
      .select("id, nombre_completo")
      .single();

    if (error || !data) {
      setMensaje({ tipo: "error", texto: "No se pudo crear el cliente." });
      return;
    }

    setClientes((prev) => [...prev, data]);
    setForm((prev) => ({ ...prev, clienteId: data.id }));
    setShowNewClientInput(false);
    setNewClientName("");
    setMensaje({ tipo: "success", texto: "Cliente creado y seleccionado." });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setMensaje({ tipo: "", texto: "" });

  const cantidadRealNum = Number(form.cantidadReal) || 0;
  const cantidadCobradaNum = Number(form.cantidadCobrada) || 0;
  const precioNum = Number(form.precioPorGramo) || 0;

  if (
    !form.clienteId ||
    !form.geneticaId ||
    (!form.esPrueba && (!form.metodoPago || cantidadRealNum <= 0 || cantidadCobradaNum <= 0 || precioNum <= 0))
  ) {
    setMensaje({ tipo: "error", texto: "Completa todos los campos correctamente." });
    return;
  }

  const genetica = geneticas.find((g) => g.id === form.geneticaId);
  if (!genetica || genetica.cantidad_gramos < cantidadRealNum) {
    setMensaje({ tipo: "error", texto: "Stock insuficiente." });
    return;
  }

  setCargando(true);

  try {
    const metodoPagoFinal = form.esPrueba ? "prueba" : form.metodoPago;

    // Generar número de orden único para pruebas
    const numeroOrdenFinal = form.esPrueba
      ? `ORD-PRUEBA-${Date.now()}`
      : form.numeroOrden;

    // Insertar la orden
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .insert({
        fecha: form.fecha,
        cliente_id: form.clienteId,
        genetica_id: form.geneticaId,
        cantidad_real_gramos: cantidadRealNum,
        cantidad_cobrada_gramos: cantidadCobradaNum,
        precio_por_gramo: precioNum,
        total: cantidadCobradaNum * precioNum,
        numero_orden: numeroOrdenFinal,
        metodo_pago: metodoPagoFinal,
        caja_cuenta_id: form.esPrueba ? null : cajaCuentas.find((c) => c.nombre === form.metodoPago)?.id,
      })
      .select("id, fecha")
      .single();

    if (ordenError || !orden) throw ordenError;

    // Actualizar stock de genética
    await supabase
      .from("geneticas")
      .update({ cantidad_gramos: genetica.cantidad_gramos - cantidadRealNum })
      .eq("id", genetica.id);

    setGeneticas((prev) =>
      prev.map((g) =>
        g.id === genetica.id ? { ...g, cantidad_gramos: g.cantidad_gramos - cantidadRealNum } : g
      )
    );

    if (!form.esPrueba) {
      // Actualizar cliente y caja normalmente
      const clienteActual = await supabase
        .from("clientes")
        .select("compras_count, total_gramos, total_gastado")
        .eq("id", form.clienteId)
        .single();

      await supabase
        .from("clientes")
        .update({
          compras_count: (clienteActual.data?.compras_count ?? 0) + 1,
          total_gramos: (clienteActual.data?.total_gramos ?? 0) + cantidadCobradaNum,
          total_gastado: (clienteActual.data?.total_gastado ?? 0) + cantidadCobradaNum * precioNum,
          ultima_compra: form.fecha,
        })
        .eq("id", form.clienteId);

      const cajaCuenta = cajaCuentas.find((c) => c.nombre === form.metodoPago);
      if (cajaCuenta) {
        await supabase
          .from("caja_cuentas")
          .update({ balance: cajaCuenta.balance + cantidadCobradaNum * precioNum })
          .eq("id", cajaCuenta.id);

        await supabase.from("caja_movimientos").insert({
          cuenta_id: cajaCuenta.id,
          tipo: "ingreso",
          monto: cantidadCobradaNum * precioNum,
          fecha_movimiento: form.fecha,
          referencia: `Orden ${numeroOrdenFinal}`,
        });
      }
    } else {
      // Solo registrar que hizo una prueba
      await supabase
        .from("clientes")
        .update({ ultima_compra_prueba: form.fecha })
        .eq("id", form.clienteId);
    }

    // Registrar movimiento de genética
    await supabase.from("movimientos").insert({
      genetica_id: genetica.id,
      tipo: "salida",
      cantidad: cantidadRealNum,
      fecha: form.fecha,
      nota: form.esPrueba ? `Prueba ${numeroOrdenFinal}` : `Salida por orden ${numeroOrdenFinal}`,
    });

    setMensaje({ tipo: "success", texto: "Orden registrada correctamente." });

    setForm((prev) => ({
      ...prev,
      cantidadReal: "",
      cantidadCobrada: "",
      precioPorGramo: "",
      numeroOrden: `ORD-${Date.now()}`,
      esPrueba: false,
    }));
  } catch (error: any) {
    setMensaje({
      tipo: "error",
      texto: error?.message || "Error al crear la orden.",
    });
  } finally {
    setCargando(false);
  }
};


  const primaryButton =
    "inline-flex w-full items-center justify-center rounded-full bg-[#007b00] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_45px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
  const ghostButton =
    "inline-flex items-center justify-center rounded-full border border-[#007b00] px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#007b00] transition hover:bg-[#007b00]/10 active:bg-[#007b00]/20";
  const inputClass =
    "w-full rounded-[20px] border border-[#d5d5d5] bg-white px-4 py-3 text-base font-semibold text-[#000] transition focus:border-[#007b00] focus:outline-none focus:ring-2 focus:ring-[#007b00]/30";

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white/60 px-3 py-2 text-lg font-semibold text-[#007b00] shadow-[0_10px_25px_rgba(0,123,0,0.15)] transition hover:bg-white"
            aria-label="Volver al dashboard"
          >
            ←
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]">
            Órdenes
          </p>
        </div>
        <div className="text-center space-y-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-[#00000070]">
          Órdenes
        </p>
        <h1 className="text-3xl font-semibold text-[#000]">Registrar nueva orden</h1>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => handleChange("fecha", e.target.value)}
              className={inputClass}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-[#00000070]">
                  Cliente
                </label>
                <select
                  value={form.clienteId}
                  onChange={(e) => handleChange("clienteId", e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                  required
                >
                  <option value="">Seleccioná cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientInput((prev) => !prev)}
                className={ghostButton}
              >
                Nuevo
              </button>
            </div>

            {showNewClientInput && (
              <div className="space-y-3 rounded-[20px] border border-dashed border-[#d0d0d0] bg-[#fbfbfb] p-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className={inputClass}
                />
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={crearCliente} className={ghostButton}>
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClientInput(false);
                      setNewClientName("");
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-[#bfbfbf] px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#4b4b4b]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-[#00000060]">
                Genética
              </label>
              <select
                value={form.geneticaId}
                onChange={(e) => handleChange("geneticaId", e.target.value)}
                className={`${inputClass} cursor-pointer`}
                required
              >
                <option value="">Seleccioná genética</option>
                {geneticas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} (stock {g.cantidad_gramos}g)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                placeholder="Cantidad real (g)"
                value={form.cantidadReal}
                onChange={(e) => handleChange("cantidadReal", e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Cantidad cobrada (g)"
                value={form.cantidadCobrada}
                onChange={(e) => handleChange("cantidadCobrada", e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Precio por gramo"
                value={form.precioPorGramo}
                onChange={(e) => handleChange("precioPorGramo", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPrueba"
                checked={form.esPrueba || false}
                onChange={(e) => setForm((prev) => ({ ...prev, esPrueba: e.target.checked }))}
                className="h-4 w-4 rounded border-[#d5d5d5] accent-[#007b00]"
              />
              <label htmlFor="esPrueba" className="text-sm font-semibold text-[#00000080]">
                Orden de prueba (gratis)
              </label>
            </div>

            <select
              value={form.metodoPago}
              onChange={(e) => handleChange("metodoPago", e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Seleccioná método de pago</option>
              {cajaCuentas.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} (Balance: ${c.balance.toLocaleString()})
                </option>
              ))}
            </select>

            <div className="rounded-[20px] bg-[#f8f8f8] px-4 py-3 text-sm font-semibold text-[#000]">
              Total: <span className="text-lg font-bold text-[#007b00]">${total.toFixed(2)}</span>
            </div>

            <button type="submit" disabled={cargando} className={primaryButton}>
              {cargando ? "Guardando..." : "Registrar orden"}
            </button>

            {mensaje.texto && (
              <p
                className={`text-sm font-semibold ${
                  mensaje.tipo === "error" ? "text-red-600" : "text-[#007b00]"
                }`}
              >
                {mensaje.texto}
              </p>
            )}
          </form>
        </section>

        <section className="rounded-[32px] bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#000]">Últimas 8 órdenes</h2>
          </div>
          <div className="mt-4 space-y-3">
            {ordenesRecientes.map((orden) => {
              const cliente = clientes.find((c) => c.id === orden.cliente_id);
              return (
                <article
                  key={orden.id}
                  className="flex flex-col gap-1 rounded-[18px] border border-[#e5e5e5] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#000]">{orden.numero_orden}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#00000050]">
                    {orden.fecha.slice(0, 10)} · {orden.metodo_pago}
                  </p>
                  <p className="text-sm text-[#4a4a4a]">
                    Cliente: {cliente?.nombre_completo || "Desconocido"} · Cantidad:{" "}
                    {orden.cantidad_cobrada_gramos}g
                  </p>
                  <span className="text-sm font-semibold text-[#007b00]">${orden.total?.toFixed(2)}</span>
                </article>
              );
            })}
            {!ordenesRecientes.length && (
              <p className="text-xs text-[#00000060]">Aún no hay órdenes guardadas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
