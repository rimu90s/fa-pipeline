'use client'

import { useState } from 'react'
import MasterSelect from '@/app/components/master/MasterSelect'
import type { MasterItem } from '@/app/_lib/master-search'

export default function MasterUxDevPage() {
  const [branchUnitId, setBranchUnitId] = useState<string | null>(null)
  const [branchUnitItem, setBranchUnitItem] = useState<MasterItem | undefined>(undefined)

  const [productId, setProductId] = useState<string | null>(null)
  const [productItem, setProductItem] = useState<MasterItem | undefined>(undefined)

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto', display: 'grid', gap: 18 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>DEV — Master UX</h2>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Ini halaman dev untuk ngetes searchable dropdown + inline add (semua write tetap via API).
      </div>

      <MasterSelect
        label="Branch Units (KCP)"
        endpoint="/api/master/branch-units"
        value={branchUnitId}
        onChange={(id: string | null, item?: MasterItem) => {
          setBranchUnitId(id)
          setBranchUnitItem(item)
        }}
        placeholder="Pilih KCP..."
        inlineAdd={{
          enabled: true,
          createPayload: (name: string) => ({
            // NOTE: branch_id wajib sesuai scope Anda.
            // Untuk scope company dan Anda punya banyak branch, Anda wajib isi branch_id di payload.
            // Kalau scope Anda hanya 1 branch, backend bisa auto.
            name,
            branch_id: '22222222-2222-2222-2222-222222222222',
          }),
          addLabel: 'Tambah KCP Baru',
        }}
      />

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Selected KCP: {branchUnitId ?? '-'} {branchUnitItem?.name ? `(${branchUnitItem.name})` : ''}
      </div>

      <MasterSelect
        label="Products (company-wide / branch optional)"
        endpoint="/api/master/products"
        value={productId}
        onChange={(id: string | null, item?: MasterItem) => {
          setProductId(id)
          setProductItem(item)
        }}
        placeholder="Pilih Product..."
        inlineAdd={{
          enabled: true,
          createPayload: (name: string) => ({
            name,
            sku: null,
            is_active: true,
            branch_id: null,
          }),
          addLabel: 'Tambah Product Baru',
        }}
      />

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Selected Product: {productId ?? '-'} {productItem?.name ? `(${productItem.name})` : ''}
      </div>
    </div>
  )
}
