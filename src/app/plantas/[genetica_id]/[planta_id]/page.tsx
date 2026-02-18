"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

interface Planta {
  id: string;
  fecha_plantacion: string;
  fecha_inicio_floracion: string | null;
  estado: string;
  notas: string | null;
}

const backButton =
  "absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#007b00] shadow-[0_8px_25px_rgba(0,123,0,0.2)] transition duration-200 ease-out";
const primaryButton =
  "inline-flex w-full items-center justify-center rounded-[999px] bg-[#007b00] px-6 py-3 text-base font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
const secondaryButton =
  "inline-flex w-full items-center justify-center rounded-[999px] border border-[#007b00] px-6 py-3 text-base font-semibold text-[#007b00] shadow-[0_12px_35px_rgba(0,0,0,0.15)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5";
const infoCard =
  "rounded-[28px] border border-[#e5e5e5] bg-white px-5 py-5 shadow-[0_15px_35px_rgba(0,0,0,0.08)]";
const inputClass =
  "w-full rounded-[18px] border border-[#d4d4d4] bg-white px-4 py-3 text-base text-[#000] shadow-[0_10px_30px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring focus-visible:ring-[#007b00]/50";

export default function PlantaDetallePage() {
  const params = useParams();

  const geneticaId = params.genetica_id as string;
  const plantaId = params.planta_id as string;

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaFloraManual, setFechaFloraManual] = useState("");
  const [notasEdit, setNotasEdit] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  const fetchPlanta = async () => {
    const { data, error } = await supabase
      .from("plantas")
      .select("*")
      .eq("id", plantaId)
      .single();

    if (!error && data) {
      setPlanta(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (plantaId) {
      fetchPlanta();
    }
  }, [plantaId]);

  useEffect(() => {
    if (planta) {
      setNotasEdit(planta.notas || "");
    }
  }, [planta]);

  const diasDeVida = useMemo(() => {
    if (!planta) return null;
    return Math.floor(
      (Date.now() - new Date(planta.fecha_plantacion).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }, [planta]);

  const diasEnFlora = useMemo(() => {
    if (!planta || planta.estado !== "floracion" || !planta.fecha_inicio_floracion) {
      return null;
    }

    return Math.floor(
      (Date.now() - new Date(planta.fecha_inicio_floracion).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }, [planta]);

  const guardarNotas = async () => {
    if (!plantaId) return;

    setGuardandoNotas(true);
    const { error } = await supabase
      .from("plantas")
      .update({
        notas: notasEdit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", plantaId);

    if (!error) {
      fetchPlanta();
    }
    setGuardandoNotas(false);
  };

  const pasarAFloracion = async () => {
    if (!plantaId) return;

    const fechaFinal =
      fechaFloraManual !== ""
        ? new Date(fechaFloraManual).toISOString()
        : new Date().toISOString();

    const { error } = await supabase
      .from("plantas")
      .update({
        estado: "floracion",
        fecha_inicio_floracion: fechaFinal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", plantaId);

    if (!error) {
      fetchPlanta();
      setFechaFloraManual("");
    }
  };

  const pasarAVege = async () => {
    if (!plantaId) return;

    const { error } = await supabase
      .from("plantas")
      .update({
        estado: "vegetativo",
        fecha_inicio_floracion: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", plantaId);

    if (!error) {
      fetchPlanta();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#f5f5f5] text-[#000]">
        <p className="p-8 text-center text-sm font-semibold text-[#00000080]">
          Cargando planta...
        </p>
      </div>
    );
  }

  if (!planta) {
    return (
      <div className="min-h-[80vh] bg-[#f5f5f5] text-[#000]">
        <p className="p-8 text-center text-sm font-semibold text-[#00000080]">
          Planta no encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
        <div className="relative flex flex-col items-center gap-1 pb-2">
          <Link href={`/plantas/${geneticaId}`} className={backButton} aria-label="Volver a la genética">
            ←
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">
              Plantas
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">Detalle de planta</h1>
          </div>
        </div>

        <section className={`${infoCard} mt-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">
                Estado
              </p>
              <p className="text-xl font-semibold text-[#000]">
                {planta.estado === "floracion" ? "Floración" : "Vegetativo"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                planta.estado === "floracion" ? "bg-violet-500" : "bg-[#007b00]"
              }`}
            >
              {planta.estado === "floracion" ? "Floración" : "Vegetativo"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">Fecha de plantación</p>
              <p className="text-base font-semibold text-[#000]">
                {new Date(planta.fecha_plantacion).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">Días de vida</p>
              <p className="text-base font-semibold text-[#000]">{diasDeVida} días</p>
            </div>
            {diasEnFlora !== null && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">
                  Días en floración
                </p>
                <p className="text-base font-semibold text-[#000]">{diasEnFlora} días</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-tight text-[#00000050]">Notas</p>
              <p className="text-sm text-[#4a4a4a]">{planta.notas || "--"}</p>
            </div>
          </div>
        </section>

        <section className={`${infoCard} space-y-3 mt-0`}>
          <div>
            <p className="text-sm font-semibold text-[#000]">Escribir notas</p>
            <p className="text-xs text-[#4a4a4a]">
              Guarda observaciones importantes de la planta para recordar qué sigue.
            </p>
          </div>
          <textarea
            className="w-full rounded-[18px] border border-[#d4d4d4] bg-white px-4 py-3 text-sm text-[#000] shadow-[0_10px_30px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring focus-visible:ring-[#007b00]/50"
            rows={4}
            value={notasEdit}
            onChange={(e) => setNotasEdit(e.target.value)}
            placeholder="Escribe una nota..."
          />
          <button
            type="button"
            onClick={guardarNotas}
            className={`${primaryButton} ${guardandoNotas ? "opacity-70 pointer-events-none" : ""}`}
          >
            Guardar notas
          </button>
        </section>

        {planta.estado === "vegetativo" && (
          <section className={infoCard}>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#000]">Pasar a floración</p>
              <label className="text-xs uppercase tracking-tight text-[#00000050]">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={fechaFloraManual}
                onChange={(e) => setFechaFloraManual(e.target.value)}
                className={inputClass}
              />
              <button type="button" onClick={pasarAFloracion} className={primaryButton}>
                Registrar floración
              </button>
            </div>
          </section>
        )}

        {planta.estado === "floracion" && (
          <section className={infoCard}>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#000]">Revertir a vegetativo</p>
              <p className="text-xs text-[#4a4a4a]">
                Mantén la planta en floración solo si necesitas que siga produciendo antes de revegetar.
              </p>
              <button type="button" onClick={pasarAVege} className={secondaryButton}>
                Volver a vegetativo
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
