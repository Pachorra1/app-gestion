"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

type Orden = {
  id: string;
  fecha: string;
  metodo_pago: string;
  total: number;
  cantidad_real_gramos: number;
};

type Cliente = {
  id: string;
  nombre: string;
};

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR");
}

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat("es-AR").format(valor);
}

function formatearGramos(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function ClienteDetalle() {
  const params = useParams();
  const id = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      const { data: ordenesData } = await supabase
        .from("ordenes")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha", { ascending: false });

      if (clienteData) setCliente(clienteData);
      if (ordenesData) setOrdenes(ordenesData);
    }

    if (id) fetchData();
  }, [id]);

  if (!cliente) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-[#00000050]">
          Cargando cliente...
        </p>
      </div>
    );
  }

  const ordenesReales = ordenes.filter((o) => o.metodo_pago !== "prueba");
  const ordenesPrueba = ordenes.filter((o) => o.metodo_pago === "prueba");
  const ultimaCompraReal = ordenesReales[0];
  const ultimaPrueba = ordenesPrueba[0];
  const totalGastado = ordenesReales.reduce((acc, o) => acc + Number(o.total), 0);
  const totalGramos = ordenesReales.reduce(
    (acc, o) => acc + Number(o.cantidad_real_gramos),
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link
            href="/clientes"
            className="absolute left-0 inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-2 text-lg font-semibold text-[#007b00] shadow-[0_10px_25px_rgba(0,123,0,0.15)] transition hover:bg-white"
            aria-label="Volver a clientes"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#00000050]">
              Clientes
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">{cliente.nombre}</h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fdfdfd] px-4 py-5 shadow-[0_12px_25px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#00000045]">Última compra</p>
              <p className="mt-2 text-lg font-semibold text-[#000]">
                {ultimaCompraReal
                  ? `${formatearFecha(ultimaCompraReal.fecha)} · $${formatearMoneda(ultimaCompraReal.total)}`
                  : "Sin compras"}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fdfdfd] px-4 py-5 shadow-[0_12px_25px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#00000045]">Última prueba</p>
              <p className="mt-2 text-lg font-semibold text-[#000]">
                {ultimaPrueba ? formatearFecha(ultimaPrueba.fecha) : "Nunca hizo prueba"}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fdfdfd] px-4 py-5 shadow-[0_12px_25px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#00000045]">Total gastado</p>
              <p className="mt-2 text-lg font-semibold text-[#007b00]">${formatearMoneda(totalGastado)}</p>
            </div>
            <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fdfdfd] px-4 py-5 shadow-[0_12px_25px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.15em] text-[#00000045]">Total gramos</p>
              <p className="mt-2 text-lg font-semibold text-[#000]">{formatearGramos(totalGramos)} g</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-semibold text-[#000] mb-4">Historial</h2>
          <div className="space-y-3">
            {ordenes.length === 0 ? (
              <p className="text-[#00000060]">No hay movimientos registrados aún.</p>
            ) : (
              ordenes.map((orden) => (
                <article
                  key={orden.id}
                  className="flex flex-col gap-2 rounded-[18px] border border-[#e5e5e5] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#000]">
                      {formatearFecha(orden.fecha)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#00000040]">
                      {orden.metodo_pago === "prueba" ? "Prueba" : "Compra"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#4a4a4a]">
                      {orden.metodo_pago === "prueba"
                        ? "Orden de prueba"
                        : `${formatearGramos(orden.cantidad_real_gramos)} g · $${formatearMoneda(
                            orden.total
                          )}`}
                    </p>
                    {orden.metodo_pago !== "prueba" && (
                      <span className="text-sm font-semibold text-[#007b00]">
                        ${formatearMoneda(orden.total)}
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
