"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const backButton =
  "absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#007b00] shadow-[0_8px_25px_rgba(0,123,0,0.2)] transition duration-200 ease-out";
const primaryButton =
  "inline-flex w-full max-w-xs items-center justify-center rounded-[999px] bg-[#007b00] px-6 py-3 text-base font-semibold text-white shadow-[0_25px_50px_rgba(0,123,0,0.3)] transition-transform duration-200 ease-out hover:-translate-y-0.5 disabled:bg-[#8fd6a1] disabled:translate-y-0";
const sectionClass =
  "rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]";
const inputClass =
  "w-full rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#111] placeholder:text-[#b2b2b2] focus:border-[#007b00] focus:outline-none";

export default function NuevaGeneticaPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert("Ingresa el nombre de la genética");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("plantas_geneticas").insert({
      nombre: nombre.trim(),
    });

    setLoading(false);

    if (error) {
      console.error("Error creando genética:", error);
      alert("Error al guardar la genética: " + error.message);
      return;
    }

    router.push("/plantas");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link href="/plantas" className={backButton} aria-label="Volver a genéticas">
            ←
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#00000050]">
              Plantas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#000]">
              Agregar genética
            </h1>
          </div>
        </div>

        <section className={sectionClass}>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre de la genética"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
            />
            <button
              onClick={handleGuardar}
              disabled={loading}
              className={`${primaryButton} transition duration-200 ${loading ? "cursor-progress" : ""}`}
            >
              {loading ? "Guardando genética..." : "Guardar genética"}
            </button>
          </div>
        </section>

        <p className="text-center text-sm text-[#00000060]">
          Una vez creada, podrás ver la genética desde el listado principal.
        </p>
      </div>
    </div>
  );
}
