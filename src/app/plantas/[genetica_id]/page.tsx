"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { formatFecha } from "@/lib/dateUtils";

interface Planta {
  id: string;
  fecha_plantacion: string;
  estado: string;
  notas: string | null;
}

interface GeneticaInfo {
  nombre: string;
}

const cardClass =
  "flex flex-col gap-3 rounded-[28px] border border-[#e5e5e5] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]";
const backButton =
  "absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#007b00] shadow-[0_8px_25px_rgba(0,123,0,0.2)] transition duration-200 ease-out";
const primaryButton =
  "inline-flex w-full max-w-xs items-center justify-center rounded-[999px] bg-[#007b00] px-6 py-3 text-base font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.3)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
const statusBadge =
  "rounded-full px-3 py-1 text-xs font-semibold text-white shadow-[0_5px_25px_rgba(0,0,0,0.1)]";

export default function GeneticaPage() {
  const params = useParams();
  const geneticaId = params.genetica_id as string;

  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [geneticaNombre, setGeneticaNombre] = useState("Genética");

  useEffect(() => {
    if (!geneticaId) return;

    const fetchPlantas = async () => {
      const { data, error } = await supabase
        .from("plantas")
        .select("*")
        .eq("genetica_id", geneticaId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al traer plantas:", error);
      } else {
        setPlantas(data || []);
      }
      setLoading(false);
    };

    fetchPlantas();

    const fetchGenetica = async () => {
      const { data, error } = await supabase
        .from("plantas_geneticas")
        .select("nombre")
        .eq("id", geneticaId)
        .single();

      if (!error && data?.nombre) {
        setGeneticaNombre(data.nombre);
      }
    };

    fetchGenetica();
  }, [geneticaId]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
        <div className="relative">
          <Link href="/plantas" className={backButton} aria-label="Volver a plantas">
            ←
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]">
              Plantas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#000]">
              {geneticaNombre}
            </h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)] mt-1">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-[#000]">Plantas registradas</p>
            <Link href={`/plantas/${geneticaId}/nuevo`} className={primaryButton}>
              Agregar planta
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-5 py-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          {loading ? (
            <p className="text-center text-sm font-semibold tracking-tight text-[#00000060]">
              Cargando plantas...
            </p>
          ) : plantas.length === 0 ? (
            <p className="text-center text-sm text-[#00000060]">No hay plantas registradas.</p>
          ) : (
            <div className="space-y-4">
              {plantas.map((planta, index) => (
                <Link key={planta.id} href={`/plantas/${geneticaId}/${planta.id}`} className={cardClass}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-[#000]">
                      Planta #{index + 1}
                    </p>
                    <span
                      className={`${statusBadge} ${planta.estado === "floracion" ? "bg-violet-500" : "bg-[#007b00]"}`}
                    >
                      {planta.estado === "floracion" ? "Floración" : "Vegetativo"}
                    </span>
                  </div>
                  <p className="text-sm text-[#4a4a4a]">
                    Fecha de plantación: {formatFecha(planta.fecha_plantacion)}
                  </p>
                  <p className="text-sm text-[#4a4a4a]">
                    Notas: {planta.notas || "--"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
