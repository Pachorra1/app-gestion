"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatFechaHora } from "@/lib/dateUtils";

type Movimiento = {
  id: string;
  tipo: string;
  monto: number;
  fecha_movimiento: string;
  referencia: string | null;
};

type Cuenta = {
  id: string;
  nombre: string;
  balance: number;
};

export default function CajaPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("");
  const [tipo, setTipo] = useState("ingreso");
  const [monto, setMonto] = useState("");
  const [referencia, setReferencia] = useState("");

  const inputClass =
    "w-full rounded-[20px] border border-[#d5d5d5] bg-white px-4 py-3 text-base font-semibold text-[#000] transition focus:border-[#007b00] focus:outline-none focus:ring-2 focus:ring-[#007b00]/30";
  const primaryButton =
    "inline-flex w-full items-center justify-center rounded-full bg-[#007b00] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_45px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";

  const fetchData = async () => {
    const { data: movData, error: movError } = await supabase
      .from("caja_movimientos")
      .select("*")
      .order("fecha_movimiento", { ascending: false });

    const { data: cuentasData, error: cuentasError } = await supabase
      .from("caja_cuentas")
      .select("id, nombre, balance");

    if (movError) console.error(movError);
    if (cuentasError) console.error(cuentasError);

    setMovimientos(movData || []);
    setCuentas(cuentasData || []);

    if (cuentasData && cuentasData.length > 0) {
      setCuentaSeleccionada(cuentasData[0].id);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGuardar = async () => {
    if (!monto || Number(monto) <= 0) {
      alert("Monto inválido");
      return;
    }

    if (!cuentaSeleccionada) {
      alert("Selecciona una cuenta");
      return;
    }

    const montoNumero = Number(monto);

    // 1️⃣ Insertar movimiento
    const { error: errorMovimiento } = await supabase
      .from("caja_movimientos")
      .insert([
        {
          tipo,
          monto: montoNumero,
          fecha_movimiento: new Date(),
          referencia,
          cuenta_id: cuentaSeleccionada,
        },
      ]);

    if (errorMovimiento) {
      console.error(errorMovimiento);
      alert("Error al guardar movimiento");
      return;
    }

    // 2️⃣ Actualizar balance automáticamente
    const cuentaActual = cuentas.find(
      (c) => c.id === cuentaSeleccionada
    );

    if (!cuentaActual) {
      alert("Cuenta no encontrada");
      return;
    }

    let nuevoBalance = cuentaActual.balance;

    if (tipo === "ingreso") {
      nuevoBalance = Number(cuentaActual.balance) + montoNumero;
    }

    if (tipo === "reinversion" || tipo === "sueldo") {
      nuevoBalance = Number(cuentaActual.balance) - montoNumero;
    }

    const { error: errorUpdate } = await supabase
      .from("caja_cuentas")
      .update({ balance: nuevoBalance })
      .eq("id", cuentaSeleccionada);

    if (errorUpdate) {
      console.error(errorUpdate);
      alert("Error al actualizar balance");
      return;
    }

    setMonto("");
    setReferencia("");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link
            href="/"
            className="absolute left-0 inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-2 text-lg font-semibold text-[#007b00] shadow-[0_10px_25px_rgba(0,123,0,0.15)] transition hover:bg-white"
            aria-label="Volver al dashboard"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#00000050]">
              Caja
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">Movimientos</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cuentas.map((cuenta) => (
            <div
              key={cuenta.id}
              className="rounded-[26px] border border-[#e4e4e4] bg-white px-5 py-6 shadow-[0_15px_35px_rgba(15,23,42,0.1)]"
            >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#00000060]">
              {cuenta.nombre?.toLowerCase().includes("billetera")
                ? "Billetera Virtual"
                : cuenta.nombre}
            </p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#000]">
                ${Number(cuenta.balance).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-semibold text-[#000] mb-4">Registrar movimiento</h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-[#00000060]">
                Cuenta
              </label>
              <select
                value={cuentaSeleccionada}
                onChange={(e) => setCuentaSeleccionada(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-[#00000060]">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="ingreso">Ingreso</option>
                <option value="reinversion">Reinversión</option>
                <option value="sueldo">Sueldo</option>
              </select>
            </div>
            <input
              type="number"
              placeholder="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Referencia (opcional)"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className={inputClass}
            />
            <button onClick={handleGuardar} className={primaryButton}>
              Guardar movimiento
            </button>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-semibold text-[#000] mb-4">Movimientos</h2>
          <div className="space-y-3">
            {movimientos.length === 0 ? (
              <p className="text-[#00000060]">No hay movimientos aún</p>
            ) : (
              movimientos.map((mov) => (
                <article
                  key={mov.id}
                  className="flex flex-col gap-1 rounded-[18px] border border-[#e5e5e5] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#000] capitalize">{mov.tipo}</p>
                    <span
                      className={`text-sm font-semibold ${
                        mov.tipo === "ingreso" ? "text-[#007b00]" : "text-[#ef4444]"
                      }`}
                    >
                      ${Number(mov.monto).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#00000040]">
                    {formatFechaHora(mov.fecha_movimiento)}
                  </p>
                  <p className="text-sm text-[#4a4a4a]">
                    {mov.referencia || "Sin referencia"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
