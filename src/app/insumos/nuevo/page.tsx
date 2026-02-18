'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NuevoInsumoPage() {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [unidad, setUnidad] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nombre || !categoria || !unidad) {
      alert('Completá todos los campos')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('insumos').insert([
      {
        nombre,
        categoria,
        unidad,
        stock_minimo: Number(stockMinimo) || 0,
        cantidad_disponible: 0,
      },
    ])

    if (error) {
      console.error(error)
      alert('Error al crear insumo')
      setLoading(false)
      return
    }

    router.push('/insumos')
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo Insumo</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Categoría</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Unidad</label>
          <select
            className="w-full border rounded-lg p-2"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          >
            <option value="">Seleccionar unidad</option>
            <option value="unidades">Unidades</option>
            <option value="bolsas">Bolsas</option>
            <option value="litros">Litros</option>
            <option value="kg">Kg</option>
            <option value="gramos">Gramos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Stock mínimo</label>
          <input
            type="number"
            className="w-full border rounded-lg p-2"
            placeholder="Ej: 5"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          {loading ? 'Guardando...' : 'Crear Insumo'}
        </button>
      </form>
    </div>
  )
}
