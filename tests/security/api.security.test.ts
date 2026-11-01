import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { login, authHeaders, createEditor, createArticle, deleteUser, deleteArticle, BASE } from './helpers'

const ADMIN_EMAIL = process.env.SEC_ADMIN_EMAIL || 'admin@example.test'
const ADMIN_PASSWORD = process.env.SEC_ADMIN_PASSWORD || 'change-me'

const EDITOR_A_EMAIL = `sec-editor-a-${Date.now()}@example.test`
const EDITOR_B_EMAIL = `sec-editor-b-${Date.now()}@example.test`
const LOCKOUT_EMAIL = `sec-lockout-${Date.now()}@example.test`
const TEST_PASSWORD = 'TestPass123!'

let adminToken: string
let editorAToken: string
let editorBToken: string
let editorAId: string
let editorBId: string
let lockoutUserId: string
let articleAId: string
let articleBId: string

beforeAll(async () => {
  adminToken = (await login(ADMIN_EMAIL, ADMIN_PASSWORD))!
  expect(adminToken).toBeTruthy()

  const a = await createEditor(adminToken, EDITOR_A_EMAIL, TEST_PASSWORD, 'Sec Editor A')
  editorAId = a.id
  const b = await createEditor(adminToken, EDITOR_B_EMAIL, TEST_PASSWORD, 'Sec Editor B')
  editorBId = b.id
  const l = await createEditor(adminToken, LOCKOUT_EMAIL, TEST_PASSWORD, 'Lockout User')
  lockoutUserId = l.id

  editorAToken = (await login(EDITOR_A_EMAIL, TEST_PASSWORD))!
  editorBToken = (await login(EDITOR_B_EMAIL, TEST_PASSWORD))!

  const artA = await createArticle(editorAToken)
  articleAId = artA.id
  const artB = await createArticle(editorBToken)
  articleBId = artB.id
})

afterAll(async () => {
  // Deleting editors cascade-deletes their articles
  if (editorAId) await deleteUser(adminToken, editorAId)
  if (editorBId) await deleteUser(adminToken, editorBId)
  if (lockoutUserId) await deleteUser(adminToken, lockoutUserId)
})

// ── Group A: Anonymous access ────────────────────────────────────────────────

describe('A: anonymous access', () => {
  const anon = { 'Content-Type': 'application/json' }

  it('GET /api/articles denied', async () => {
    const res = await fetch(`${BASE}/api/articles`)
    expect([401, 403]).toContain(res.status)
  })
  it('GET /api/articles/:id denied', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`)
    expect([401, 403, 404]).toContain(res.status)
  })
  it('GET /api/categories denied', async () => {
    const res = await fetch(`${BASE}/api/categories`)
    expect([401, 403]).toContain(res.status)
  })
  it('GET /api/users denied', async () => {
    const res = await fetch(`${BASE}/api/users`)
    expect([401, 403]).toContain(res.status)
  })
  it('GET /api/globals/breaking-news denied', async () => {
    const res = await fetch(`${BASE}/api/globals/breaking-news`)
    expect([401, 403]).toContain(res.status)
  })
  it('POST /api/articles denied', async () => {
    const res = await fetch(`${BASE}/api/articles`, { method: 'POST', headers: anon, body: '{}' })
    expect([401, 403]).toContain(res.status)
  })
  it('POST /api/categories denied', async () => {
    const res = await fetch(`${BASE}/api/categories`, { method: 'POST', headers: anon, body: '{}' })
    expect([401, 403]).toContain(res.status)
  })
  it('POST /api/users denied', async () => {
    const res = await fetch(`${BASE}/api/users`, { method: 'POST', headers: anon, body: '{}' })
    expect([401, 403]).toContain(res.status)
  })
  it('POST /api/graphql returns 404 (disabled)', async () => {
    const res = await fetch(`${BASE}/api/graphql`, { method: 'POST', headers: anon, body: '{}' })
    expect(res.status).toBe(404)
  })
  it('GET /api/media/file returns image (public exception)', async () => {
    const mediaRes = await fetch(`${BASE}/api/media?limit=1`, { headers: authHeaders(adminToken) })
    const mediaData = await mediaRes.json()
    const filename = mediaData.docs?.[0]?.filename
    if (!filename) return // no media uploaded yet, skip
    const res = await fetch(`${BASE}/api/media/file/${filename}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^image\//)
  })
})

// ── Group B: Authentication basics ──────────────────────────────────────────

describe('B: authentication basics', () => {
  it('wrong password returns 401', async () => {
    const res = await fetch(`${BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: 'wrong-password' }),
    })
    expect(res.status).toBe(401)
  })

  it('lockout: 5 wrong passwords then correct password still denied', async () => {
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: LOCKOUT_EMAIL, password: 'wrong' }),
      })
    }
    const res = await fetch(`${BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LOCKOUT_EMAIL, password: TEST_PASSWORD }),
    })
    expect(res.status).toBe(401)
  })

  it('first-register denied when users exist', async () => {
    const res = await fetch(`${BASE}/api/users/first-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.test', password: 'pass' }),
    })
    expect([400, 401, 403, 404]).toContain(res.status)
  })

  it('tampered JWT denied', async () => {
    const tampered = adminToken.slice(0, -4) + 'XXXX'
    const res = await fetch(`${BASE}/api/articles`, {
      headers: { Authorization: `JWT ${tampered}` },
    })
    expect([401, 403]).toContain(res.status)
  })
})

// ── Group C: Editor RBAC ─────────────────────────────────────────────────────

describe('C: editor RBAC', () => {
  it('editor can create a draft article', async () => {
    const art = await createArticle(editorAToken)
    expect(art.status).toBe(201)
    if (art.id) await deleteArticle(adminToken, art.id)
  })

  it('editor cannot create article as published', async () => {
    const art = await createArticle(editorAToken, { workflowStatus: 'published' })
    expect([400, 401, 403]).toContain(art.status)
    if (art.id) await deleteArticle(adminToken, art.id)
  })

  it('editor cannot create article as rejected', async () => {
    const art = await createArticle(editorAToken, { workflowStatus: 'rejected' })
    expect([400, 401, 403]).toContain(art.status)
    if (art.id) await deleteArticle(adminToken, art.id)
  })

  it('author is forced to self even if another id is sent', async () => {
    const art = await createArticle(editorAToken, { author: editorBId })
    expect(art.status).toBe(201)
    const doc = art.data?.doc
    const authorId = typeof doc?.author === 'object' ? doc?.author?.id : doc?.author
    expect(authorId).toBe(editorAId)
    if (art.id) await deleteArticle(adminToken, art.id)
  })

  it('editor B cannot GET editor A article', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      headers: authHeaders(editorBToken),
    })
    expect([401, 403, 404]).toContain(res.status)
  })

  it('editor B article does not appear in editor A list', async () => {
    const res = await fetch(`${BASE}/api/articles`, { headers: authHeaders(editorAToken) })
    const data = await res.json()
    const ids = data.docs?.map((d: { id: string }) => d.id) ?? []
    expect(ids).not.toContain(articleBId)
  })

  it('editor cannot PATCH article to published', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ workflowStatus: 'published' }),
    })
    expect([400, 401, 403]).toContain(res.status)
  })

  it('editor cannot set rejectionReason', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ rejectionReason: 'I reject myself' }),
    })
    // Either blocked or the field is silently ignored
    if (res.ok) {
      const data = await res.json()
      expect(data.doc?.rejectionReason ?? null).toBeNull()
    } else {
      expect([400, 401, 403]).toContain(res.status)
    }
  })

  it('editor cannot DELETE an article', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'DELETE',
      headers: authHeaders(editorAToken),
    })
    expect([401, 403]).toContain(res.status)
  })

  it('editor cannot DELETE a category', async () => {
    const catRes = await fetch(`${BASE}/api/categories?limit=1`, { headers: authHeaders(editorAToken) })
    const catData = await catRes.json()
    const catId = catData.docs?.[0]?.id
    if (!catId) return
    const res = await fetch(`${BASE}/api/categories/${catId}`, {
      method: 'DELETE',
      headers: authHeaders(editorAToken),
    })
    expect([401, 403]).toContain(res.status)
  })

  it('editor cannot POST /api/users', async () => {
    const res = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ email: 'new@example.test', password: 'pass', displayName: 'New' }),
    })
    expect([401, 403]).toContain(res.status)
  })

  it('editor cannot read other users', async () => {
    const res = await fetch(`${BASE}/api/users/${editorBId}`, {
      headers: authHeaders(editorAToken),
    })
    expect([401, 403, 404]).toContain(res.status)
  })

  it('editor cannot update breaking-news global', async () => {
    const res = await fetch(`${BASE}/api/globals/breaking-news`, {
      method: 'POST',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ enabled: true }),
    })
    expect([401, 403]).toContain(res.status)
  })
})

// ── Group D: Admin workflow and user management ──────────────────────────────

describe('D: admin workflow and user management', () => {
  it('admin reject without reason returns 400', async () => {
    // First submit article for review
    await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ workflowStatus: 'in_review' }),
    })
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ workflowStatus: 'rejected' }),
    })
    expect(res.status).toBe(400)
  })

  it('admin reject with short reason returns 400', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ workflowStatus: 'rejected', rejectionReason: 'Too short' }),
    })
    expect(res.status).toBe(400)
  })

  it('admin reject with valid reason succeeds and log is written', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ workflowStatus: 'rejected', rejectionReason: 'Needs more detail and sources.' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.doc?.reviewLog?.length).toBeGreaterThan(0)
  })

  it('admin publish sets publishedAt, reviewedBy, reviewedAt', async () => {
    // Resubmit first
    await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ workflowStatus: 'in_review' }),
    })
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ workflowStatus: 'published' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.doc?.publishedAt).toBeTruthy()
    expect(data.doc?.reviewedBy).toBeTruthy()
    expect(data.doc?.reviewedAt).toBeTruthy()
  })

  it('admin unpublish returns to draft', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ workflowStatus: 'draft' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.doc?.workflowStatus).toBe('draft')
  })

  it('admin creates user with role admin — stored role is editor', async () => {
    const res = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ email: `role-test-${Date.now()}@example.test`, password: TEST_PASSWORD, displayName: 'Role Test', role: 'admin' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    const id = data.doc?.id
    expect(data.doc?.role).toBe('editor')
    if (id) await deleteUser(adminToken, id)
  })

  it('admin cannot delete an admin account', async () => {
    // Get admin user id
    const res = await fetch(`${BASE}/api/users?where[role][equals]=admin&limit=1`, {
      headers: authHeaders(adminToken),
    })
    const data = await res.json()
    const adminId = data.docs?.[0]?.id
    if (!adminId) return
    const del = await fetch(`${BASE}/api/users/${adminId}`, {
      method: 'DELETE',
      headers: authHeaders(adminToken),
    })
    expect([400, 401, 403]).toContain(del.status)
  })
})

// ── Group E: Mass assignment ─────────────────────────────────────────────────

describe('E: mass assignment protection', () => {
  it('editor cannot set isFeatured', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ isFeatured: true }),
    })
    if (res.ok) {
      const data = await res.json()
      expect(data.doc?.isFeatured).toBeFalsy()
    }
  })

  it('editor cannot set views', async () => {
    const res = await fetch(`${BASE}/api/articles/${articleAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ views: 9999 }),
    })
    if (res.ok) {
      const data = await res.json()
      expect(data.doc?.views ?? 0).not.toBe(9999)
    }
  })

  it('editor cannot change own role to admin', async () => {
    const res = await fetch(`${BASE}/api/users/${editorAId}`, {
      method: 'PATCH',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ role: 'admin' }),
    })
    if (res.ok) {
      const data = await res.json()
      expect(data.doc?.role).toBe('editor')
    }
    // Confirm admin-only calls still denied
    const adminCall = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: authHeaders(editorAToken),
      body: JSON.stringify({ email: 'x@x.test', password: 'x', displayName: 'x' }),
    })
    expect([401, 403]).toContain(adminCall.status)
  })

  it('admin cannot change role via PATCH', async () => {
    const res = await fetch(`${BASE}/api/users/${editorAId}`, {
      method: 'PATCH',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ role: 'admin' }),
    })
    if (res.ok) {
      const data = await res.json()
      expect(data.doc?.role).toBe('editor')
    }
  })
})

// ── Group F: Query abuse ─────────────────────────────────────────────────────

describe('F: query abuse', () => {
  it('editor cannot see other editors articles via where query', async () => {
    const res = await fetch(
      `${BASE}/api/articles?where[author][not_equals]=${editorAId}`,
      { headers: authHeaders(editorAToken) },
    )
    const data = await res.json()
    const ids = data.docs?.map((d: { id: string }) => d.id) ?? []
    expect(ids).not.toContain(articleBId)
  })

  it('response does not include other users email', async () => {
    const res = await fetch(`${BASE}/api/articles`, { headers: authHeaders(editorAToken) })
    const text = await res.text()
    expect(text).not.toContain(EDITOR_B_EMAIL)
    expect(text).not.toContain(ADMIN_EMAIL)
  })
})
