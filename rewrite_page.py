from pathlib import Path
content = '''"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  calcularClienteMasActivo,
} from "@/lib/finanzas";

ChartJS.register(ArcElement, Tooltip, Legend);

const moduloLinks = [
  { href: "/caja", label: "Movimientos" },
  { href: "/inventario", label: "Inventario" },
  { href: "/clientes", label: "Clientes" },
  { href: "/insumos", label: "Insumos" },
  { href: "/plantas", label: "Plantas" },
];

export default function DashboardPage() {
  const [mesActual, setMesActual] = useState(new Date());
  const [ingresos, setIngresos] = useState(0);
  const [reinversion, setReinversion] = useState(0);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [clienteActivo, setClienteActivo] = useState<any>(null);

  const fetchDatosMes = async (fecha: Date) => {
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();

    const [ing, reinv, cuentasData, cliente] = await Promise.all([
      calcularIngresosMes(mes, anio),
      calcularReinversionMes(mes, anio),
      supabase.from("caja_cuentas").select("*"),
      calcularClienteMasActivo(mes, anio),
    ]);

    setIngresos(ing);
    setReinversion(reinv);
    setCuentas(cuentasData.data || []);
    setClienteActivo(cliente);
  };

  useEffect(() => {
    fetchDatosMes(mesActual);
  }, [mesActual]);

  const cambiarMes = (delta: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + delta);
    setMesActual(nuevoMes);
  };

  const totalBalance = cuentas.reduce(
    (acc, cuenta) => acc + Number(cuenta.balance ?? 0),
    0
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

  const primaryButton =
    "inline-flex w-full items-center justify-center rounded-full bg-[#007b00] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
  const pillButton =
    "inline-flex w-full items-center justify-center rounded-full border border-[#007b00] bg-white px-5 py-3 text-center text-sm font-semibold text-[#007b00] shadow-[0_12px_35px_rgba(0,0,0,0.15)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
  const navButton =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-semibold text-[#007b00] shadow-[0_15px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[#000]">Dashboard</h1>
        </div>

        <div className="space-y-4">
          <div className="rounded-[32px] bg-white px-6 py-8 text-center shadow-[0_35px_60px_rgba(15,23,42,0.12)]">
            <p className="text-xs uppercase tracking-[0.5em] text-[#00000050]">
              Balance total
            </p>
            <p className="mt-4 text-4xl font-semibold text-[#000]">
              ${totalBalance.toLocaleString()}
            </p>
            <div className="mt-6">
              <Link href="/dashboard/detalle" className="block">
                <span className={primaryButton}>Ver detalle</span>
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-white px-6 py-8 text-center shadow-[0_35px_60px_rgba(15,23,42,0.12)]">
            <p className="text-xs uppercase tracking-[0.5em] text-[#00000050]">
              Ingresos vs reinversión
            </p>
            <p className="mt-2 text-sm font-semibold text-[#000]">{mesTexto}</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button type="button" onClick={() => cambiarMes(-1)} className={navButton}>
                {"\u25C0"}
              </button>
              <button type="button" onClick={() => cambiarMes(1)} className={navButton}>
                {"\u25B6"}
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-48">
                <Doughnut data={data} />
              </div>
            </div>
            {clienteActivo && (
              <div className="mt-6 rounded-[28px] border border-[#e5e5e5] bg-white p-4 text-center shadow-[0_15px_25px_rgba(0,0,0,0.08)]">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-[#00000050]">
                  Cliente más activo
                </p>
                <p className="mt-2 text-lg font-semibold text-[#000]">
                  {clienteActivo.nombre}
                </p>
                <p className="text-xs text-[#00000080]">
                  {clienteActivo.cantidadOrdenes} órdenes · ${" "}
                  {clienteActivo.totalFacturado.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/ordenes" className="block">
            <span className={primaryButton}>Crear orden</span>
          </Link>

          <div className="flex flex-col gap-3">
            {moduloLinks.map((modulo) => (
              <Link key={modulo.href} href={modulo.href} className={pillButton}>
                {modulo.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
'''
Path('src/app/page.tsx').write_text(content, encoding='utf-8')
