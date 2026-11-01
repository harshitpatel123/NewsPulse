import { describe, it, expect } from 'vitest'
import { assertTransition, applyTransitionEffects } from '../src/lib/workflow'
import type { WorkflowStatus } from '../src/lib/workflow'

function ok(role: 'admin' | 'editor', from: WorkflowStatus | null, to: WorkflowStatus, extra: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    title: 'Test', summary: 'Test summary', body: { root: { children: [] } },
    heroImage: 'img-id', category: 'cat-id', ...extra,
  }
  expect(() => assertTransition({ role, from, to, data })).not.toThrow()
}

function fail(role: 'admin' | 'editor', from: WorkflowStatus | null, to: WorkflowStatus, extra: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    title: 'Test', summary: 'Test summary', body: { root: { children: [] } },
    heroImage: 'img-id', category: 'cat-id', ...extra,
  }
  expect(() => assertTransition({ role, from, to, data })).toThrow()
}

describe('workflow transitions - editor', () => {
  it('editor can create as draft', () => ok('editor', null, 'draft'))
  it('editor can create as in_review', () => ok('editor', null, 'in_review'))
  it('editor cannot create as published', () => fail('editor', null, 'published'))
  it('editor cannot create as rejected', () => fail('editor', null, 'rejected'))
  it('editor can move draft -> in_review', () => ok('editor', 'draft', 'in_review'))
  it('editor can keep draft -> draft', () => ok('editor', 'draft', 'draft'))
  it('editor cannot move draft -> published', () => fail('editor', 'draft', 'published'))
  it('editor cannot move draft -> rejected', () => fail('editor', 'draft', 'rejected'))
  it('editor can move rejected -> in_review', () => ok('editor', 'rejected', 'in_review'))
  it('editor can keep rejected -> rejected', () => ok('editor', 'rejected', 'rejected'))
  it('editor cannot move in_review -> draft', () => fail('editor', 'in_review', 'draft'))
  it('editor cannot move published -> draft', () => fail('editor', 'published', 'draft'))
})

describe('workflow transitions - admin', () => {
  it('admin can publish from in_review', () => ok('admin', 'in_review', 'published'))
  it('admin can reject from in_review with reason', () => ok('admin', 'in_review', 'rejected', { rejectionReason: 'Needs more detail here' }))
  it('admin cannot reject without reason', () => fail('admin', 'in_review', 'rejected'))
  it('admin cannot reject with short reason', () => fail('admin', 'in_review', 'rejected', { rejectionReason: 'Too short' }))
  it('admin can unpublish (published -> draft)', () => ok('admin', 'published', 'draft'))
  it('admin can move draft -> published', () => ok('admin', 'draft', 'published'))
  it('admin can move rejected -> published', () => ok('admin', 'rejected', 'published'))
})

describe('workflow - content completeness for in_review', () => {
  it('rejects in_review if title missing', () => {
    expect(() => assertTransition({
      role: 'editor', from: 'draft', to: 'in_review',
      data: { summary: 'x', body: { root: {} }, heroImage: 'x', category: 'x' },
    })).toThrow()
  })
  it('rejects in_review if heroImage missing', () => {
    expect(() => assertTransition({
      role: 'editor', from: 'draft', to: 'in_review',
      data: { title: 'x', summary: 'x', body: { root: {} }, category: 'x' },
    })).toThrow()
  })
})

describe('applyTransitionEffects', () => {
  it('sets submittedAt and logs submitted on in_review', () => {
    const patch = applyTransitionEffects('in_review', 'user1', {}, {})
    expect(patch.submittedAt).toBeTruthy()
    expect((patch.reviewLog as { action: string }[])[0].action).toBe('submitted')
  })

  it('sets publishedAt, reviewedBy, clears rejectionReason on publish', () => {
    const patch = applyTransitionEffects('published', 'user1', {}, {})
    expect(patch.publishedAt).toBeTruthy()
    expect(patch.reviewedBy).toBe('user1')
    expect(patch.rejectionReason).toBeNull()
    expect((patch.reviewLog as { action: string }[])[0].action).toBe('published')
  })

  it('does not overwrite existing publishedAt', () => {
    const existing = { publishedAt: '2024-01-01T00:00:00.000Z' }
    const patch = applyTransitionEffects('published', 'user1', existing, {})
    expect(patch.publishedAt).toBeUndefined()
  })

  it('logs unpublished when going from published to draft', () => {
    const patch = applyTransitionEffects('draft', 'user1', { workflowStatus: 'published' }, {})
    expect((patch.reviewLog as { action: string }[])[0].action).toBe('unpublished')
  })

  it('appends to existing reviewLog', () => {
    const existing = { reviewLog: [{ action: 'submitted', by: 'u1', at: 'x' }] }
    const patch = applyTransitionEffects('published', 'user1', existing, {})
    expect((patch.reviewLog as unknown[]).length).toBe(2)
  })
})
