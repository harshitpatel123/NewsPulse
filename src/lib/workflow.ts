import { APIError } from 'payload'

export type WorkflowStatus = 'draft' | 'in_review' | 'published' | 'rejected'

export interface TransitionArgs {
  role: 'admin' | 'editor'
  from: WorkflowStatus | null // null = new document
  to: WorkflowStatus
  data: Record<string, unknown>
}

export interface ReviewLogEntry {
  action: 'submitted' | 'published' | 'rejected' | 'unpublished'
  by: string
  at: string
  reason?: string
}

// Allowed transitions per role
const EDITOR_ALLOWED: Partial<Record<WorkflowStatus | 'new', WorkflowStatus[]>> = {
  new: ['draft', 'in_review'],
  draft: ['draft', 'in_review'],
  rejected: ['rejected', 'in_review'],
}

const ADMIN_ALLOWED: Partial<Record<WorkflowStatus | 'new', WorkflowStatus[]>> = {
  new: ['draft', 'in_review', 'published'],
  draft: ['draft', 'in_review', 'published'],
  in_review: ['draft', 'in_review', 'published', 'rejected'],
  published: ['published', 'draft'],
  rejected: ['draft', 'in_review', 'published', 'rejected'],
}

function isContentComplete(data: Record<string, unknown>): boolean {
  return Boolean(
    data.title &&
      data.summary &&
      data.heroImage &&
      data.category &&
      data.body &&
      typeof data.body === 'object',
  )
}

export function assertTransition({ role, from, to, data }: TransitionArgs): void {
  const fromKey = from ?? 'new'
  const allowed =
    role === 'admin' ? ADMIN_ALLOWED[fromKey] ?? [] : EDITOR_ALLOWED[fromKey] ?? []

  if (!allowed.includes(to)) {
    if (role === 'editor' && (to === 'published' || to === 'rejected')) {
      throw new APIError(`Only an admin can set status to ${to}.`, 400, undefined, true)
    }
    throw new APIError(
      `Transition from "${fromKey}" to "${to}" is not allowed for role "${role}".`,
      400,
      undefined,
      true,
    )
  }

  if (to === 'in_review' && !isContentComplete(data)) {
    throw new APIError(
      'Article must have title, summary, body, hero image and category before submitting for review.',
      400,
      undefined,
      true,
    )
  }

  if (to === 'rejected' && from !== 'rejected') {
    const reason = data.rejectionReason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      throw new APIError(
        'A rejection reason of at least 10 characters is required.',
        400,
        undefined,
        true,
      )
    }
  }
}

export function applyTransitionEffects(
  to: WorkflowStatus,
  userId: string,
  existing: Record<string, unknown>,
  data: Record<string, unknown>,
): Partial<Record<string, unknown>> {
  const now = new Date().toISOString()
  const patch: Partial<Record<string, unknown>> = {}
  const log: ReviewLogEntry[] = Array.isArray(existing.reviewLog)
    ? [...(existing.reviewLog as ReviewLogEntry[])]
    : []

  if (to === 'in_review') {
    patch.submittedAt = now
    log.push({ action: 'submitted', by: userId, at: now })
  }

  if (to === 'published') {
    if (!existing.publishedAt) patch.publishedAt = now
    patch.reviewedBy = userId
    patch.reviewedAt = now
    patch.rejectionReason = null
    log.push({ action: 'published', by: userId, at: now })
  }

  if (to === 'rejected') {
    patch.reviewedBy = userId
    patch.reviewedAt = now
    log.push({
      action: 'rejected',
      by: userId,
      at: now,
      reason: data.rejectionReason as string,
    })
  }

  if (to === 'draft' && existing.workflowStatus === 'published') {
    log.push({ action: 'unpublished', by: userId, at: now })
  }

  patch.reviewLog = log
  return patch
}
