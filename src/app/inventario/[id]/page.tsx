"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatFechaHora } from "@/lib/dateUtils";

interface Movimiento {
  id: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  fecha: string;
  nota?: string | null;
}

interface Genetica {
  id: string;
  nombre: string;
  cantidad_gramos: number;
  foto?: string;
}

const DetalleGeneticaPage: React.FC = () => {
  const params = useParams();

  // 👇 Ahora usamos el id como string (sin Number)
  const geneticaId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [genetica, setGenetica] = useState<Genetica | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!geneticaId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // 🔹 Traer genética
      const { data: geneticaData, error: geneticaError } = await supabase
        .from("geneticas")
        .select("*")
        .eq("id", geneticaId)
        .single();

      if (geneticaError) {
        console.error("Error cargando genética:", geneticaError);
        setLoading(false);
        return;
      }

      setGenetica(geneticaData);

      // 🔹 Traer movimientos
      const { data: movimientosData, error: movimientosError } = await supabase
        .from("movimientos")
        .select("*")
        .eq("genetica_id", geneticaId)
        .order("fecha", { ascending: false });

      if (movimientosError) {
        console.error("Error cargando movimientos:", movimientosError);
      } else {
        setMovimientos(movimientosData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [geneticaId]);

  if (loading) return <p className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">Cargando...</p>;

  if (!genetica)
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">
        <p className="text-red-600 font-semibold">Genética no encontrada</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link
            href="/inventario"
            className="absolute left-0 inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-2 text-lg font-semibold text-[#007b00] shadow-[0_10px_25px_rgba(0,123,0,0.15)] transition hover:bg-white"
            aria-label="Volver a inventario"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#00000050]">
              Inventario
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">{genetica.nombre}</h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[24px]">
              <img
                src={genetica.foto || "/images/default.png"}
                alt={genetica.nombre}
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00000060]">
                Stock disponible
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-[#007b00]">
                {genetica.cantidad_gramos} g
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-semibold text-[#000] mb-4">Movimientos recientes</h2>
          <div className="space-y-3">
            {movimientos.length === 0 ? (
              <p className="text-[#00000060]">No hay movimientos registrados.</p>
            ) : (
              movimientos.map((m) => (
                <article
                  key={m.id}
                  className="flex flex-col gap-2 rounded-[18px] border border-[#e5e5e5] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        m.tipo === "entrada" ? "text-[#007b00]" : "text-[#ef4444]"
                      }`}
                    >
                      {m.tipo === "entrada" ? "+" : "-"} {m.cantidad} g
                    </span>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#00000040]">
                      {formatFechaHora(m.fecha)}
                    </span>
                  </div>
                  {m.nota && (
                    <p className="text-sm text-[#4a4a4a]">{m.nota}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DetalleGeneticaPage;
