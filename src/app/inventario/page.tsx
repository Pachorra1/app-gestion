"use client";

import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import GeneticaCard from "@/components/GeneticaCard";
import { supabase } from "@/lib/supabaseClient";

interface NuevaGenetica {
  nombre: string;
  stock: number;
  foto?: File | null;
}

interface Genetica {
  id: number;
  nombre: string;
  cantidad_gramos: number;
  foto?: string;
}

const InventarioPage: React.FC = () => {

  const [geneticas, setGeneticas] = useState<Genetica[]>([]);
  const [nuevaGenetica, setNuevaGenetica] = useState<NuevaGenetica>({
    nombre: "",
    stock: 0,
    foto: null,
  });
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "success"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Evitar duplicados por id
  const mergeGeneticas = (incoming: Genetica[]) => {
    setGeneticas((prev) => {
      const mapa = new Map<number, Genetica>(prev.map((g) => [g.id, g]));
      incoming.forEach((item) => mapa.set(item.id, item));
      return Array.from(mapa.values());
    });
  };

  // Traer genéticas
  useEffect(() => {
    const fetchGeneticas = async () => {
      const { data, error } = await supabase
        .from("geneticas")
        .select("id, nombre, cantidad_gramos, foto")
        .order("nombre", { ascending: true });

      if (error) {
        console.log("Error cargando genéticas:", error);
        setMensaje({ tipo: "error", texto: "Error al cargar genéticas" });
        return;
      }

      const cleanedData = (data || []).map((g) => ({
        ...g,
        nombre: g.nombre.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(),
      }));

      mergeGeneticas(cleanedData);
    };

    fetchGeneticas();
  }, []);

  // Handle inputs
  useEffect(() => {
    if (!nuevaGenetica.foto) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(nuevaGenetica.foto);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [nuevaGenetica.foto]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      setNuevaGenetica((prev) => ({ ...prev, foto: files ? files[0] : null }));
    } else {
      setNuevaGenetica((prev) => ({ ...prev, [name]: name === "stock" ? Number(value) : value }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nombreLimpio = nuevaGenetica.nombre.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

    if (!nombreLimpio) {
      setMensaje({ tipo: "error", texto: "El nombre es obligatorio" });
      return;
    }
    if (nuevaGenetica.stock < 0) {
      setMensaje({ tipo: "error", texto: "El stock no puede ser negativo" });
      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      let fotoUrl = null;
      if (nuevaGenetica.foto) {
        const fileExt = nuevaGenetica.foto.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("geneticas")
          .upload(fileName, nuevaGenetica.foto);
        if (uploadError) throw uploadError;

        fotoUrl = supabase.storage.from("geneticas").getPublicUrl(fileName).data.publicUrl;
      }

      const { data, error } = await supabase
        .from("geneticas")
        .insert([{ nombre: nombreLimpio, cantidad_gramos: nuevaGenetica.stock, foto: fotoUrl }])
        .select()
        .single();

      if (error) throw error;

      mergeGeneticas([{ ...data, nombre: nombreLimpio }]);
      setNuevaGenetica({ nombre: "", stock: 0, foto: null });
      setMensaje({ tipo: "success", texto: "Genética agregada correctamente" });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "Error al agregar genética" });
    } finally {
      setCargando(false);
    }
  };

  // Lista única para renderizar
  const inputClass =
    "w-full rounded-[20px] border border-[#d5d5d5] bg-white px-4 py-3 text-base font-semibold text-[#000] transition focus:border-[#007b00] focus:outline-none focus:ring-2 focus:ring-[#007b00]/30";

  const geneticasUnicas = useMemo(() => {
    const vistos = new Set<number>();
    return geneticas.filter((g) => {
      if (vistos.has(g.id)) return false;
      vistos.add(g.id);
      return true;
    });
  }, [geneticas]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#000]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="relative">
          <Link
            href="/"
            className="absolute left-0 inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-2 text-lg font-semibold text-[#007b00] shadow-[0_10px_25px_rgba(0,123,0,0.15)] transition hover:bg-white"
            aria-label="Volver al dashboard"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#00000050]">
              Inventario
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">Genéticas</h1>
          </div>
        </div>

        {mensaje && (
          <div
            className={`rounded-[20px] px-4 py-3 ${
              mensaje.tipo === "success" ? "bg-[#d1fae5] text-[#047857]" : "bg-[#fee2e2] text-[#b91c1c]"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <section className="rounded-[32px] bg-white px-6 py-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="text-center -mt-2">
            <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-[#000]">
              Nueva genética
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00000060]">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={nuevaGenetica.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00000060]">
                Stock (gramos)
              </label>
              <input
                type="number"
                name="stock"
                value={nuevaGenetica.stock}
                onChange={handleChange}
                placeholder="Stock en gramos"
                min={0}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00000060]">
                Imagen (opcional)
              </label>
              <label
                htmlFor="foto"
                className="mt-2 flex h-32 w-full cursor-pointer items-center justify-center rounded-[24px] border border-dashed border-[#d5d5d5] bg-[#f8f8f8] text-center text-sm font-semibold text-[#00000060] transition hover:border-[#007b00]"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Previsualización"
                    className="h-full rounded-[20px] object-cover"
                  />
                ) : (
                  <span className="tracking-[0.15em]">Clic para subir imagen...</span>
                )}
              </label>
              <input
                id="foto"
                type="file"
                name="foto"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#007b00] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_20px_45px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              {cargando ? "Guardando..." : "Agregar genética"}
            </button>
          </form>
        </section>

        <section className="rounded-[32px] bg-white px-5 py-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-semibold text-[#000] mb-4">Listado</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {geneticasUnicas.map((g) => (
              <GeneticaCard
                key={g.id}
                nombre={g.nombre}
                stock={g.cantidad_gramos}
                imagenUrl={g.foto || "/images/default.png"}
                href={`/inventario/${g.id}`}
              />
            ))}
            {geneticasUnicas.length === 0 && (
              <p className="text-[#00000060]">No hay genéticas registradas aún.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InventarioPage;
