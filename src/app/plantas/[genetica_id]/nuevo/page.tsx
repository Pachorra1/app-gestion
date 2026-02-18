"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function NuevaPlantaPage() {
  const params = useParams();
  const router = useRouter();

  // 🔥 Blindaje por si viene como array
  const rawId = params.genetica_id;
  const geneticaId = Array.isArray(rawId) ? rawId[0] : rawId;

  console.log("PARAMS:", params);
  console.log("GENETICA ID FINAL:", geneticaId);

  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("vegetativo");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!fecha) {
      alert("Ingresa una fecha");
      return;
    }

    if (!geneticaId) {
      alert("geneticaId es inválido");
      return;
    }

    console.log("INSERTANDO CON ID:", geneticaId);

    setLoading(true);

    const { error } = await supabase
      .from("plantas")
      .insert({
        genetica_id: geneticaId,
        fecha_plantacion: fecha,
        estado,
        notas,
      });

    setLoading(false);

    if (error) {
      console.error("ERROR REAL:", error);
      alert("Error: " + error.message);
      return;
    }

    alert("Planta creada correctamente");
    router.push(`/plantas/${geneticaId}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agregar Nueva Planta</h1>

      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="vegetativo">Vegetativo</option>
        <option value="floracion">Floración</option>
      </select>

      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={handleGuardar}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        {loading ? "Guardando..." : "Guardar Planta"}
      </button>

      <Link
        href={`/plantas/${geneticaId}`}
        className="text-blue-500 mt-4 inline-block"
      >
        ← Volver
      </Link>
    </div>
  );
}
