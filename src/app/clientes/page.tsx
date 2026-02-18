"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Cliente {
  id: string;
  nombre_completo: string;
  ultima_compra?: string | null;
}

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nombre_completo, ultima_compra")
          .order("nombre_completo", { ascending: true });

        if (error) throw error;
        setClientes(data || []);
      } catch (err: any) {
        console.error("Error cargando clientes:", err);
        setError("No se pudieron cargar los clientes.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  if (loading || !clientes.length) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-[#00000050]">
          {loading ? "Cargando clientes..." : "No hay clientes registrados"}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">
        <p className="text-center text-sm font-semibold text-red-600">{error}</p>
      </div>
    );
  }

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
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[#00000050]">
              Clientes
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">Listado</h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="grid gap-4">
            {clientes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="flex flex-col gap-1 rounded-[24px] border border-[#e5e5e5] bg-[#fdfdfd] px-5 py-4 text-left shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition hover:shadow-[0_18px_45px_rgba(0,0,0,0.1)]"
            >
                <span className="text-lg font-semibold text-[#000]">{cliente.nombre_completo}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-[#00000045]">
                  {cliente.ultima_compra
                    ? `Última compra: ${new Date(cliente.ultima_compra).toLocaleDateString()}`
                    : "Sin compras"}
                </span>
            </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClientesPage;
