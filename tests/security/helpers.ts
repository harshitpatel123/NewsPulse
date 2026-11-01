const BASE = process.env.SEC_BASE_URL || 'http://localhost:3000'

export async function login(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.token ?? null
}

export function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }
}

export async function createEditor(adminToken: string, email: string, password: string, displayName: string) {
  const res = await fetch(`${BASE}/api/users`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email, password, displayName }),
  })
  const data = await res.json()
  return { status: res.status, id: data.doc?.id ?? data.id ?? null }
}

export async function createArticle(token: string, overrides: Record<string, unknown> = {}) {
  // We need a category and media id — use the first available ones
  const catRes = await fetch(`${BASE}/api/categories?limit=1`, {
    headers: authHeaders(token),
  })
  const catData = await catRes.json()
  const categoryId = catData.docs?.[0]?.id

  const mediaRes = await fetch(`${BASE}/api/media?limit=1`, {
    headers: authHeaders(token),
  })
  const mediaData = await mediaRes.json()
  const mediaId = mediaData.docs?.[0]?.id

  const body = {
    title: `Test Article ${Date.now()}`,
    summary: 'A test article summary for security tests.',
    body: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Body text.' }], version: 1 }], direction: null, format: '', indent: 0, version: 1 } },
    heroImage: mediaId,
    category: categoryId,
    workflowStatus: 'draft',
    ...overrides,
  }

  const res = await fetch(`${BASE}/api/articles`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, id: data.doc?.id ?? null, data }
}

export async function deleteUser(adminToken: string, id: string) {
  await fetch(`${BASE}/api/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(adminToken),
  })
}

export async function deleteArticle(adminToken: string, id: string) {
  await fetch(`${BASE}/api/articles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(adminToken),
  })
}

export { BASE }
