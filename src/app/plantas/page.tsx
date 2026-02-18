"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Genetica {
  id: string;
  nombre: string;
}

const cardClass =
  "flex flex-col gap-1 rounded-[28px] border border-[#e5e5e5] bg-white px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]";
const actionButton =
  "inline-flex w-full max-w-xs items-center justify-center rounded-[999px] bg-[#007b00] px-6 py-3 text-base font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.3)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
const backButton =
  "absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-2xl font-semibold text-[#007b00] shadow-[0_8px_25px_rgba(0,123,0,0.2)] transition duration-200 ease-out";

export default function PlantasPage() {
  const [geneticas, setGeneticas] = useState<Genetica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeneticas = async () => {
      const { data, error } = await supabase
        .from("plantas_geneticas")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al traer genéticas:", error);
      } else {
        setGeneticas(data || []);
      }
      setLoading(false);
    };

    fetchGeneticas();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link href="/" className={backButton} aria-label="Volver al dashboard">
            ←
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]">
              Plantas
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">
              Genéticas
            </h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col items-center">
            <Link
              href="/plantas/nueva-genetica"
              className={`${actionButton} text-center`}
            >
              Agregar Genéticas
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-5 py-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          {loading ? (
            <p className="text-center text-sm font-semibold tracking-tight text-[#00000060]">
              Cargando genéticas...
            </p>
          ) : geneticas.length === 0 ? (
            <p className="text-center text-sm text-[#00000060]">
              No hay genéticas registradas.
            </p>
          ) : (
            <div className="space-y-4">
              {geneticas.map((genetica) => (
                <Link key={genetica.id} href={`/plantas/${genetica.id}`} className={cardClass}>
                  <p className="text-lg font-semibold text-[#000]">{genetica.nombre}</p>
                  <span className="text-xs font-semibold uppercase tracking-tight text-[#00000040]">
                    Ver detalle
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
