'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Insumo = {
  id: string
  nombre: string
  categoria: string
  unidad: string
  cantidad_disponible: number
}

type Cuenta = {
  id: string
  nombre: string
  balance: number
}

export default function InsumoDetallePage() {
  const { id } = useParams()
  const router = useRouter()

  const [insumo, setInsumo] = useState<Insumo | null>(null)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cantidad, setCantidad] = useState('')
  const [monto, setMonto] = useState('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInsumo()
    fetchCuentas()
  }, [])

  async function fetchInsumo() {
    const { data } = await supabase
      .from('insumos')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setInsumo(data)
  }

  async function fetchCuentas() {
    const { data } = await supabase
      .from('caja_cuentas')
      .select('*')

    if (data) setCuentas(data)
  }

  async function comprarInsumo(e: React.FormEvent) {
    e.preventDefault()

    if (!cantidad || !monto || !cuentaSeleccionada) {
      alert('Completá todos los campos')
      return
    }

    const cantidadNum = Number(cantidad)
    const montoNum = Number(monto)

    if (cantidadNum <= 0 || montoNum <= 0) {
      alert('Valores inválidos')
      return
    }

    const cuenta = cuentas.find(c => c.id === cuentaSeleccionada)

    if (!cuenta) return

    if (cuenta.balance < montoNum) {
      alert('Saldo insuficiente')
      return
    }

    setLoading(true)

    // 1️⃣ Actualizar stock
    await supabase
      .from('insumos')
      .update({
        cantidad_disponible:
          (insumo?.cantidad_disponible || 0) + cantidadNum,
      })
      .eq('id', id)

    // 2️⃣ Crear movimiento en caja
    await supabase.from('caja_movimientos').insert([
      {
        cuenta_id: cuentaSeleccionada,
        tipo: 'reinversion',
        monto: -montoNum,
        referencia: `Compra insumo - ${insumo?.nombre}`,
        fecha_movimiento: new Date(),
      },
    ])

    router.push('/insumos')
  }

  if (!insumo) return <div className="p-6">Cargando...</div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{insumo.nombre}</h1>
      <p className="text-gray-500 mb-4">{insumo.categoria}</p>

      <p className="mb-6 font-semibold">
        Stock actual: {insumo.cantidad_disponible} {insumo.unidad}
      </p>

      <form onSubmit={comprarInsumo} className="space-y-4 border-t pt-4">
        <h2 className="font-semibold">Comprar Stock</h2>

        <input
          type="number"
          placeholder="Cantidad a agregar"
          className="w-full border rounded-lg p-2"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        <input
          type="number"
          placeholder="Monto total"
          className="w-full border rounded-lg p-2"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />

        <select
          className="w-full border rounded-lg p-2"
          value={cuentaSeleccionada}
          onChange={(e) => setCuentaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar cuenta</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} (Saldo: {c.balance})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          {loading ? 'Procesando...' : 'Confirmar Compra'}
        </button>
      </form>
    </div>
  )
}
