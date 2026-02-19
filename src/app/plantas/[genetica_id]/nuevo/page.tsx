"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const backButton =
  "absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#007b00] shadow-[0_8px_25px_rgba(0,123,0,0.2)] transition duration-200 ease-out";
const sectionClass =
  "rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]";
const labelClass =
  "text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]";
const inputClass =
  "w-full rounded-[20px] border border-[#dcdcdc] bg-[#fafafa] px-4 py-3 text-base text-[#111] placeholder:text-[#b2b2b2] focus:border-[#007b00] focus:outline-none";
const primaryButton =
  "inline-flex w-full max-w-xs items-center justify-center rounded-[999px] bg-[#007b00] px-6 py-3 text-base font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 disabled:bg-[#8fd6a1] disabled:cursor-wait";
const helperText =
  "text-sm text-[#4a4a4a] leading-relaxed";

export default function NuevaPlantaPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params.genetica_id;
  const geneticaId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [fechaDisplay, setFechaDisplay] = useState("");
  const [fechaIso, setFechaIso] = useState("");
  const [estado, setEstado] = useState("vegetativo");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDisplayDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const parseIsoDate = (display: string) => {
    const parts = display.split("/");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";
    const iso = `${year}-${month}-${day}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "";
  };

  const handleFechaChange = (value: string) => {
    const formatted = formatDisplayDate(value);
    setFechaDisplay(formatted);
    setFechaIso(parseIsoDate(formatted));
  };

  const handleGuardar = async () => {
    if (!fechaIso) {
      alert("Ingresa una fecha de plantación válida (dd/mm/yyyy)");
      return;
    }

    if (!geneticaId) {
      alert("genética inválida");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("plantas")
      .insert({
        genetica_id: geneticaId,
        fecha_plantacion: fechaIso,
        estado,
        notas: notas.trim() || null,
      });

    setLoading(false);

    if (error) {
      console.error("Error creando planta:", error);
      alert("No se pudo guardar la planta: " + error.message);
      return;
    }

    router.push(`/plantas/${geneticaId}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link
            href={`/plantas/${geneticaId}`}
            className={backButton}
            aria-label="Volver a la genética"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]">
              Plantas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#000]">
              Agregar nueva planta
            </h1>
          </div>
        </div>

        <section className={sectionClass}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className={labelClass}>Fecha de plantación</p>
              <input
                type="text"
                value={fechaDisplay}
                onChange={(e) => handleFechaChange(e.target.value)}
                placeholder="dd/mm/yyyy"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className={labelClass}>Estado</p>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={inputClass}
              >
                <option value="vegetativo">Vegetativo</option>
                <option value="floracion">Floración</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p className={labelClass}>Notas</p>
              <textarea
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Describe observaciones o cuidados especiales"
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading}
              className={`${primaryButton} ${loading ? "cursor-wait" : ""}`}
            >
              {loading ? "Guardando planta..." : "Guardar planta"}
            </button>
          </div>
        </section>

        <p className={`${helperText} text-center`}>
          La planta aparecerá inmediatamente en el detalle de su genética y podrás
          actualizar su historial desde allí.
        </p>
      </div>
    </div>
  );
}
