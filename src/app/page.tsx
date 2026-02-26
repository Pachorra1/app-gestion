"use client";

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
  calcularGananciaNetaMes,
  calcularGramosVendidosMes,
} from "@/lib/finanzas";

ChartJS.register(ArcElement, Tooltip, Legend);

const moduloLinks = [
  { href: "/caja", label: "Movimientos" },
  { href: "/inventario", label: "Inventario" },
  { href: "/clientes", label: "Clientes" },
  { href: "/insumos", label: "Insumos" },
  { href: "/plantas", label: "Plantas" },
];

const formatearGramos = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function DashboardPage() {
  const [mesActual, setMesActual] = useState(new Date());
  const [ingresos, setIngresos] = useState(0);
  const [reinversion, setReinversion] = useState(0);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [clienteActivo, setClienteActivo] = useState<any>(null);
  const [gananciaNeta, setGananciaNeta] = useState(0);
  const [gramosVendidos, setGramosVendidos] = useState(0);

  const fetchDatosMes = async (fecha: Date) => {
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();

    const [ing, reinv, cuentasData, cliente, ganancia, gramos] = await Promise.all([
      calcularIngresosMes(mes, anio),
      calcularReinversionMes(mes, anio),
      supabase.from("caja_cuentas").select("*"),
      calcularClienteMasActivo(mes, anio),
      calcularGananciaNetaMes(mes, anio),
      calcularGramosVendidosMes(mes, anio),
    ]);

    setIngresos(ing);
    setReinversion(reinv);
    setCuentas(cuentasData.data || []);
    setClienteActivo(cliente);
    setGananciaNeta(ganancia);
    setGramosVendidos(gramos);
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
    <div className="relative min-h-screen bg-gradient-to-br from-[#e2f8ec] via-[#f0fff5] to-[#fefefe] text-[#000]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#007b00]/12 via-[#f5f5f5] to-transparent -z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full bg-[#007b00]/30 blur-[100px] shadow-[0_0_120px_rgba(0,123,0,0.45)] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 right-0 h-36 w-36 rounded-full bg-[#007b00]/20 blur-[90px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-20 h-60 bg-gradient-to-t from-[#7fd4a3]/20 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-56 w-56 rounded-full bg-[#0ea45f]/10 blur-[120px] -z-10"
      />
      <div className="mx-auto relative z-10 flex max-w-md flex-col gap-6 px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[#000]">Dashboard</h1>
        </div>

        <div className="space-y-3">
          <div className="rounded-[32px] bg-white px-5 py-6 text-center shadow-[0_32px_55px_rgba(15,23,42,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0d0d0d]">
              Balance total
            </p>
            <p className="mt-4 text-4xl font-semibold text-[#000]">
              ${totalBalance.toLocaleString()}
            </p>
            <div className="mt-3">
              <Link href="/dashboard/detalle" className="block">
                <span className={primaryButton}>Ver detalle</span>
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-white px-5 py-6 text-center shadow-[0_32px_55px_rgba(15,23,42,0.12)]">
          <p className="mt-2 text-sm font-semibold text-[#000]">{mesTexto}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button type="button" onClick={() => cambiarMes(-1)} className={navButton}>
                {"\u25C0"}
              </button>
              <button type="button" onClick={() => cambiarMes(1)} className={navButton}>
                {"\u25B6"}
              </button>
            </div>
            <div className="mt-5 flex justify-center">
              <div className="w-48">
                <Doughnut data={data} />
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-[#daefdc] bg-white px-4 py-3 text-center shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#0d0d0d]">
                Ganancia neta del mes
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#0f8b44]">
                ${gananciaNeta.toLocaleString()}
              </p>
            </div>
            {clienteActivo && (
              <>
                <div className="mt-4 rounded-[28px] border border-[#e5e5e5] bg-white p-4 text-center shadow-[0_15px_25px_rgba(0,0,0,0.08)]">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#0d0d0d]">
                    Cliente más activo
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#000]">
                    {clienteActivo.nombre}
                  </p>
                  <p className="text-xs text-[#00000080]">
                    {clienteActivo.cantidadOrdenes} órdenes · ${" "}
                    {clienteActivo.totalFacturado.toLocaleString()}
                  </p>
                </div>
                  <div className="mt-3">
                    <div className="rounded-[24px] border border-[#daefdc] bg-white px-3 py-3 text-center shadow-[0_6px_14px_rgba(0,0,0,0.08)]">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-[#00000070] leading-none whitespace-nowrap">
                        Gramos vendidos este mes
                      </p>
                      <p className="text-lg font-semibold text-[#000] tracking-tight mt-1">
                        {formatearGramos.format(gramosVendidos)} g
                      </p>
                    </div>
                  </div>
              </>
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
