import { vi } from 'vitest'

// Mock payload so unit tests don't need a running Payload instance.
// APIError is the only thing used by workflow.ts in tests.
vi.mock('payload', () => {
  class APIError extends Error {
    status: number
    isPublic: boolean
    constructor(message: string, status = 400, _data?: unknown, isPublic = false) {
      super(message)
      this.name = 'APIError'
      this.status = status
      this.isPublic = isPublic
    }
  }
  return { APIError }
})
