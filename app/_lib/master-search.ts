export type MasterItem = { id: string; name: string }

type ApiResponse<T> = {
  data?: T
  error?: { message?: string }
}

export async function searchMaster(
  endpoint: string,
  q: string,
  limit = 20
): Promise<MasterItem[]> {
  const url = new URL(endpoint, window.location.origin)
  if (q) url.searchParams.set('q', q)
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  const json = (await res.json().catch(() => ({}))) as ApiResponse<unknown>

  if (!res.ok) {
    const msg =
      typeof json.error?.message === 'string'
        ? json.error.message
        : 'Gagal memuat data.'
    throw new Error(msg)
  }

  if (!Array.isArray(json.data)) return []

  return json.data
    .filter(
      (x): x is { id: unknown; name?: unknown } =>
        typeof x === 'object' && x !== null && 'id' in x
    )
    .map((x) => ({
      id: String(x.id),
      name: typeof x.name === 'string' ? x.name : '',
    }))
}
