'use client'

import { useEffect, useMemo, useState } from 'react'
import { searchMaster, MasterItem } from '@/app/_lib/master-search'
import { inlineAddMaster } from '@/app/_lib/master-inline-add'
import { useDebouncedValue } from '@/app/_lib/useDebouncedValue'

type Props = {
  label: string
  endpoint: string // contoh: '/api/master/products'
  value: string | null
  onChange: (id: string | null, item?: MasterItem) => void

  // Inline add (opsional)
  inlineAdd?: {
    enabled: boolean
    createPayload: (name: string) => Record<string, unknown>
    addLabel?: string // default: "Tambah Baru"
  }

  placeholder?: string
  limit?: number
  debounceMs?: number
}

type UiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }

export default function MasterSelect(props: Props) {
  const limit = props.limit ?? 20
  const debounceMs = props.debounceMs ?? 250

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQ = useDebouncedValue(query, debounceMs)

  const [items, setItems] = useState<MasterItem[]>([])
  const [ui, setUi] = useState<UiState>({ status: 'idle' })

  const [addMode, setAddMode] = useState(false)
  const [addName, setAddName] = useState('')
  const [addUi, setAddUi] = useState<UiState>({ status: 'idle' })

  const selected = useMemo(() => {
    if (!props.value) return null
    return items.find((x) => x.id === props.value) ?? null
  }, [props.value, items])

  useEffect(() => {
    if (!open) return
    let alive = true

    ;(async () => {
      try {
        setUi({ status: 'loading' })
        const data = await searchMaster(props.endpoint, debouncedQ, limit)
        if (!alive) return
        setItems(data)
        setUi({ status: 'idle' })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Gagal memuat data.'
        if (!alive) return
        setUi({ status: 'error', message: msg })
      }
    })()

    return () => {
      alive = false
    }
  }, [open, debouncedQ, limit, props.endpoint])

  async function doInlineAdd() {
    if (!props.inlineAdd?.enabled) return
    const name = addName.trim()
    if (!name) {
      setAddUi({ status: 'error', message: 'Nama wajib diisi.' })
      return
    }

    try {
      setAddUi({ status: 'loading' })
      const payload = props.inlineAdd.createPayload(name)
      const r = await inlineAddMaster(props.endpoint, payload)

      // setelah create, refresh list dan select item
      const data = await searchMaster(props.endpoint, name, limit)
      setItems(data)

      const picked = data.find((x) => x.id === r.id) ?? { id: r.id, name }
      props.onChange(r.id, picked)

      setAddUi({ status: 'idle' })
      setAddMode(false)
      setAddName('')
      setQuery('')
      setOpen(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal membuat data.'
      setAddUi({ status: 'error', message: msg })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.label}</div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {selected?.name || props.placeholder || 'Pilih...'}
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              zIndex: 50,
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0b0b0b',
              padding: 10,
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
              display: 'grid',
              gap: 8,
            }}
          >
            {!addMode ? (
              <>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                />

                {ui.status === 'loading' && (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Memuat...</div>
                )}

                {ui.status === 'error' && (
                  <div style={{ fontSize: 12 }}>
                    {ui.message}
                  </div>
                )}

                <div style={{ maxHeight: 240, overflow: 'auto', display: 'grid', gap: 6 }}>
                  {items.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => {
                        props.onChange(x.id, x)
                        setOpen(false)
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '10px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: props.value === x.id ? 'rgba(255,255,255,0.10)' : 'transparent',
                      }}
                    >
                      {x.name}
                    </button>
                  ))}

                  {items.length === 0 && ui.status !== 'loading' && (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Tidak ada hasil.</div>
                  )}
                </div>

                {props.inlineAdd?.enabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddMode(true)
                      setAddUi({ status: 'idle' })
                      setAddName(query.trim())
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px dashed rgba(255,255,255,0.25)',
                      background: 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    {props.inlineAdd.addLabel ?? 'Tambah Baru'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    props.onChange(null)
                    setOpen(false)
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'transparent',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}
                >
                  Kosongkan pilihan
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Tambah data baru</div>

                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Nama..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                />

                {addUi.status === 'error' && (
                  <div style={{ fontSize: 12 }}>{addUi.message}</div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => void doInlineAdd()}
                    disabled={addUi.status === 'loading'}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.10)',
                      flex: 1,
                    }}
                  >
                    {addUi.status === 'loading' ? 'Menyimpan...' : 'Simpan'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddMode(false)
                      setAddUi({ status: 'idle' })
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'transparent',
                      flex: 1,
                    }}
                  >
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
