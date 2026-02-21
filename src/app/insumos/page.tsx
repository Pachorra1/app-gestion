'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '@/lib/supabaseClient'

type Insumo = {
  id: string
  nombre: string
  categoria: string
  unidad: string
  cantidad_disponible: number
  imagen_url?: string
}

type Cuenta = {
  id: string
  nombre: string
  balance: number
}

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  const [openCompraModal, setOpenCompraModal] = useState(false)
  const [openUsoModal, setOpenUsoModal] = useState(false)

  const [insumoSeleccionadoUso, setInsumoSeleccionadoUso] =
    useState<Insumo | null>(null)
  const [cantidadUso, setCantidadUso] = useState('')

  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevaUnidad, setNuevaUnidad] = useState('')
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [previewImagen, setPreviewImagen] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')

  const [cantidad, setCantidad] = useState('')
  const [monto, setMonto] = useState('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [fechaCompra, setFechaCompra] = useState<Date | null>(null) // Nueva fecha para la compra

  const inputClass =
    'w-full rounded-[20px] border border-[#d5d5d5] bg-white px-4 py-3 text-base font-semibold text-[#000] transition focus:border-[#007b00] focus:outline-none focus:ring-2 focus:ring-[#007b00]/30'
  const selectClass = `${inputClass} appearance-none`
  const primaryButton =
    'inline-flex w-full items-center justify-center rounded-full bg-[#007b00] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_45px_rgba(0,123,0,0.35)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5'
  const cardClass =
    'flex flex-col gap-3 rounded-[28px] border border-[#e5e5e5] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition hover:shadow-[0_18px_45px_rgba(0,0,0,0.1)]'
  const modalButton = 'flex-1 rounded-full border border-[#d5d5d5] px-4 py-2 text-sm font-semibold tracking-normal'


  useEffect(() => {
    fetchInsumos()
    fetchCuentas()
  }, [])

  async function fetchInsumos() {
    const { data } = await supabase.from('insumos').select('*')
    if (data) setInsumos(data)
    setLoading(false)
  }

  async function fetchCuentas() {
    const { data } = await supabase.from('caja_cuentas').select('*')
    if (data) setCuentas(data)
  }

  async function subirImagen(file: File): Promise<string | null> {
    const MAX_SIZE_MB = 5
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      alert(`El archivo es demasiado grande. Máximo ${MAX_SIZE_MB} MB.`)
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `insumos/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('insumos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      alert('Error al subir la imagen')
      console.error(uploadError)
      return null
    }

    const { data: publicUrlData } = supabase.storage
      .from('insumos')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  async function registrarCompra() {
  if (!cantidad || !monto || !cuentaSeleccionada) {
  alert('Completá todos los campos')
  return
}

// ✅ Validar fecha de compra
if (!fechaCompra) {
  alert('Seleccioná la fecha de la compra')
  return
}


  setProcesando(true)
  let insumoId = insumoSeleccionado
  let imagenPublica = ''

  // Si es un nuevo insumo
  if (insumoSeleccionado === 'nuevo') {
    if (!nuevoNombre || !nuevaCategoria || !nuevaUnidad) {
      alert('Completá datos del nuevo insumo')
      setProcesando(false)
      return
    }

    if (imagenFile) {
      const url = await subirImagen(imagenFile)
      if (!url) {
        setProcesando(false)
        return
      }
      imagenPublica = url
    }

    const { data, error } = await supabase
      .from('insumos')
      .insert([
        {
          nombre: nuevoNombre,
          categoria: nuevaCategoria,
          unidad: nuevaUnidad,
          cantidad_disponible: 0,
          imagen_url: imagenPublica || null,
        },
      ])
      .select()
      .single()

    if (error || !data) {
      alert('Error creando insumo')
      setProcesando(false)
      return
    }

    insumoId = data.id
  }

  const cantidadNum = Number(cantidad)
  const montoNum = Number(monto)
  const cuenta = cuentas.find(c => c.id === cuentaSeleccionada)
  if (!cuenta) return

  if (cuenta.balance < montoNum) {
    alert('Saldo insuficiente')
    setProcesando(false)
    return
  }

  // Actualizar cantidad del insumo
  const { data: insumoActual } = await supabase
    .from('insumos')
    .select('*')
    .eq('id', insumoId)
    .single()

  await supabase
    .from('insumos')
    .update({
      cantidad_disponible: (insumoActual?.cantidad_disponible || 0) + cantidadNum,
    })
    .eq('id', insumoId)

  // Registrar movimiento de caja con fecha personalizada
  await supabase.from('caja_movimientos').insert([
    {
      cuenta_id: cuentaSeleccionada,
      tipo: 'reinversion',
      monto: -montoNum,
      referencia: `Compra insumo`,
      fecha_movimiento: fechaCompra ?? new Date(),
    },
  ])

  // Actualizar saldo de la cuenta
  await supabase
    .from('caja_cuentas')
    .update({ balance: cuenta.balance - montoNum })
    .eq('id', cuentaSeleccionada)

  // Cerrar modal y refrescar datos
  cerrarCompraModal()
  await fetchInsumos()
  await fetchCuentas()
  setProcesando(false)
}


  async function confirmarUso() {
    if (!insumoSeleccionadoUso) return
    const cantidadNum = Number(cantidadUso)
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      alert('Cantidad inválida')
      return
    }
    if (cantidadNum > insumoSeleccionadoUso.cantidad_disponible) {
      alert('No hay suficiente stock')
      return
    }
    await supabase
      .from('insumos')
      .update({ cantidad_disponible: insumoSeleccionadoUso.cantidad_disponible - cantidadNum })
      .eq('id', insumoSeleccionadoUso.id)
    cerrarUsoModal()
    await fetchInsumos()
  }

  async function eliminarInsumo(insumoId: string) {
    if (!confirm('¿Estás seguro que quieres eliminar este insumo?')) return
    await supabase.from('insumos').delete().eq('id', insumoId)
    await fetchInsumos()
  }

  function cerrarCompraModal() {
  setOpenCompraModal(false)
  setInsumoSeleccionado('')
  setNuevoNombre('')
  setNuevaCategoria('')
  setNuevaUnidad('')
  setImagenFile(null)
  setPreviewImagen('')
  setImagenUrl('')
  setCantidad('')
  setMonto('')
  setCuentaSeleccionada('')
  setFechaCompra(null) // Limpiar fecha al cerrar el modal
}


  function cerrarUsoModal() {
    setOpenUsoModal(false)
    setInsumoSeleccionadoUso(null)
    setCantidadUso('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#000] px-4 py-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-[#00000050]">
          Cargando insumos...
        </p>
      </div>
    );
  }

  const handleFileChange = (files?: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setImagenFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

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
              Insumos
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000]">Inventario</h1>
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-center">
            <button
              onClick={() => setOpenCompraModal(true)}
              className={primaryButton + " max-w-[220px]"}
            >
              Registrar compra
            </button>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-5 py-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
          <div className="grid gap-4">
            {insumos.map((insumo) => (
              <div key={insumo.id} className={cardClass + ' md:flex-row md:items-center'}>
                <div className="h-20 w-20 overflow-hidden rounded-[18px] bg-[#f5f5f5]">
                  <img
                    src={insumo.imagen_url || "/images/default.png"}
                    alt={insumo.nombre}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold text-[#000]">{insumo.nombre}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#00000045]">{insumo.categoria}</p>
                  <p className="text-sm font-semibold text-[#007b00]">
                    {insumo.cantidad_disponible} {insumo.unidad}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setInsumoSeleccionadoUso(insumo); setOpenUsoModal(true); }}
                    className="inline-flex items-center justify-center rounded-full border border-[#ef4444] px-4 py-1 text-xs font-semibold text-[#ef4444]"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => eliminarInsumo(insumo.id)}
                    className="inline-flex items-center justify-center rounded-full border border-[#ef4444] px-4 py-1 text-xs font-semibold text-[#ef4444]"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {openUsoModal && insumoSeleccionadoUso && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-4 rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h2 className="text-lg font-semibold text-[#000]">
              Usar {insumoSeleccionadoUso.nombre}
            </h2>
            <p className="text-sm text-[#00000060]">
              Disponible: {insumoSeleccionadoUso.cantidad_disponible} {insumoSeleccionadoUso.unidad}
            </p>
            <input
              type="number"
              placeholder="Cantidad a usar"
              className={inputClass}
              value={cantidadUso}
              onChange={(e) => setCantidadUso(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={cerrarUsoModal}
                className="flex-1 rounded-full border border-[#d5d5d5] px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarUso}
                className="flex-1 rounded-full bg-[#ef4444] px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {openCompraModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg space-y-4 rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h2 className="text-lg font-semibold text-[#000]">Registrar compra / nuevo insumo</h2>
            <select
              className={`${selectClass} cursor-pointer`}
              value={insumoSeleccionado}
              onChange={(e) => setInsumoSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar insumo</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
              <option value="nuevo">+ Crear nuevo insumo</option>
            </select>

            {insumoSeleccionado === 'nuevo' && (
              <>
                <input
                  placeholder="Nombre"
                  className={inputClass}
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
                <input
                  placeholder="Categoría"
                  className={inputClass}
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                />
                <input
                  placeholder="Unidad"
                  className={inputClass}
                  value={nuevaUnidad}
                  onChange={(e) => setNuevaUnidad(e.target.value)}
                />
                <label
                  htmlFor="imagen"
                  className="flex h-32 cursor-pointer items-center justify-center rounded-[24px] border border-dashed border-[#d5d5d5] bg-[#f8f8f8] text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#00000060]"
                >
                  {previewImagen ? (
                    <img
                      src={previewImagen}
                      alt="Preview"
                      className="h-full rounded-[20px] object-cover"
                    />
                  ) : (
                    'Clic para subir imagen'
                  )}
                </label>
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="hidden"
                />
              </>
            )}

            <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="cantidad"
                  className={inputClass}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="monto"
                  className={inputClass}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00000060]">
                Fecha de compra
              </label>
              <DatePicker
                selected={fechaCompra}
                onChange={(date) => setFechaCompra(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className={inputClass}
                maxDate={new Date()}
                showPopperArrow={false}
              />
            </div>
            <select
              className={`${selectClass} cursor-pointer`}
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

            <div className="flex gap-2">
              <button
                onClick={cerrarCompraModal}
                className={modalButton}
              >
                Cancelar
              </button>
              <button
                onClick={registrarCompra}
                disabled={procesando}
                className={`${modalButton} bg-[#007b00] border-[#007b00] text-white`}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
