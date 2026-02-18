"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  calcularIngresosMes,
  calcularReinversionMes,
  calcularSueldoMes,
} from "@/lib/finanzas";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DetalleFinanciero() {
  const [mesActual, setMesActual] = useState(new Date());
  const [ingresos, setIngresos] = useState(0);
  const [reinversion, setReinversion] = useState(0);
  const [sueldo, setSueldo] = useState(0);
  const [cuentas, setCuentas] = useState<any[]>([]);

  const fetchDatosMes = async (fecha: Date) => {
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();

    const [ing, reinv, sld, cuentasData] = await Promise.all([
      calcularIngresosMes(mes, anio),
      calcularReinversionMes(mes, anio),
      calcularSueldoMes(mes, anio),
      supabase.from("caja_cuentas").select("*"),
    ]);

    setIngresos(ing);
    setReinversion(reinv);
    setSueldo(sld);
    setCuentas(cuentasData.data || []);
  };

  useEffect(() => {
    fetchDatosMes(mesActual);
  }, [mesActual]);

  const cambiarMes = (delta: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + delta);
    setMesActual(nuevoMes);
  };

  const efectivo = Number(
    cuentas.find((c) =>
      c.nombre?.toLowerCase().includes("efectivo")
    )?.balance ?? 0
  );
  const billetera = Number(
    cuentas.find((c) =>
      c.nombre?.toLowerCase().includes("billetera")
    )?.balance ?? 0
  );

  const mesTexto = mesActual.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const data = {
    labels: ["Ingresos", "Reinversión"],
    datasets: [
      {
        label: "Finanzas",
        data: [ingresos, reinversion],
        backgroundColor: ["#16a34a", "#dc2626"],
        hoverOffset: 10,
      },
    ],
  };

  const cardBase =
    "rounded-[28px] border border-[#daf5e3] bg-gradient-to-br from-white via-white to-[#ebfff2] px-5 py-5 shadow-[0_25px_50px_rgba(0,123,0,0.08)]";

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-900"
        >
          <span className="text-xl leading-none text-[#007b00]">←</span>
          <span className="tracking-tight">Volver</span>
        </Link>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0e0e0e80]">
            Detalle financiero
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#000]">
            Balance por cuentas
          </h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={cardBase}>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Efectivo
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#000]">
              ${efectivo.toLocaleString()}
            </p>
          </div>
          <div className={cardBase}>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Billetera virtual
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#000]">
              ${billetera.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className={cardBase}>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Ingresos
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#007b00]">
              ${ingresos.toLocaleString()}
            </p>
          </div>
          <div className={cardBase}>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Reinversión
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#ef4444]">
              ${reinversion.toLocaleString()}
            </p>
          </div>
          <div className={cardBase}>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Sueldo
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#000]">
              ${sueldo.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-[#bff0d6] bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600 shadow-sm">
            <button
              onClick={() => cambiarMes(-1)}
              className="rounded-full px-3 py-1 text-2xl leading-none text-[#007b00] transition hover:text-[#004d00]"
            >
              {"\u25C0"}
            </button>
            <span className="text-base font-bold tracking-tight text-[#000]">
              {mesTexto}
            </span>
            <button
              onClick={() => cambiarMes(1)}
              className="rounded-full px-3 py-1 text-2xl leading-none text-[#007b00] transition hover:text-[#004d00]"
            >
              {"\u25B6"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200">
          <div className="flex justify-center">
            <div className="w-48 sm:w-60 md:w-72">
              <Doughnut data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
