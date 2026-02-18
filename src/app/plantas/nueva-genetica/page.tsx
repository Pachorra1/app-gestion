"use client";

import { useState } from "react";
import Link from "next/link";

export default function NuevaGeneticaPage() {
  const [nombre, setNombre] = useState("");
  const [geneticas, setGeneticas] = useState<string[]>([]);

  const handleGuardar = () => {
    if (nombre.trim() === "") return alert("Ingresa un nombre");
    setGeneticas([...geneticas, nombre]);
    setNombre("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agregar Nueva Genética</h1>

      <input
        type="text"
        placeholder="Nombre de la genética"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={handleGuardar}
        className="px-4 py-2 bg-green-500 text-white rounded mb-4"
      >
        Guardar
      </button>

      {geneticas.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Genéticas creadas (estado local)</h2>
          <ul className="list-disc pl-5">
            {geneticas.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/plantas" className="text-blue-500 mt-4 inline-block">
        ← Volver a Genéticas
      </Link>
    </div>
  );
}
