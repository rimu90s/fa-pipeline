type ApiError = { error?: { message?: string } }
type ApiOk<T> = { data: T; meta?: unknown }

export async function inlineAddMaster<TPayload extends Record<string, unknown>>(
  endpoint: string,
  payload: TPayload
): Promise<{ id: string }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => ({}))) as ApiOk<{ id: string }> & ApiError

  if (!res.ok) {
    const msg =
      typeof json.error?.message === 'string'
        ? json.error.message
        : 'Gagal membuat data.'
    throw new Error(msg)
  }

  if (!json.data || typeof json.data.id !== 'string') {
    throw new Error('Response tidak valid.')
  }

  return { id: json.data.id }
}
