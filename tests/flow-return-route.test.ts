import { describe, it, expect, beforeEach, vi } from 'vitest'

class MockNextRequest extends Request {
  nextUrl: URL

  constructor(input: RequestInfo, init?: RequestInit) {
    super(input, init)
    this.nextUrl = new URL(typeof input === 'string' ? input : input.url)
  }
}

const mockNextResponse = {
  redirect: (url: string | URL, init?: ResponseInit & { status?: number }) =>
    Response.redirect(typeof url === 'string' ? url : url.toString(), init?.status),
}

const insertMock = vi.fn().mockResolvedValue({})
const fromMock = vi.fn(() => ({ insert: insertMock }))

vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: mockNextResponse,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: fromMock }),
}))

// Import after mocks are declared
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ReturnRoute from '../apps/web/app/api/flow/return/route'

describe('Flow return handler', () => {
  const siteUrl = 'https://example.com'
  const bookingId = '123e4567-e89b-12d3-a456-426614174000'

  let routes: typeof ReturnRoute

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    insertMock.mockClear()
    fromMock.mockClear()
    routes = await import('../apps/web/app/api/flow/return/route')
  })

  it('redirige GET con token y bookingId presente en optional', async () => {
    const optional = encodeURIComponent(JSON.stringify({ bookingId }))
    const req = new MockNextRequest(`${siteUrl}/api/flow/return?token=tok-get&optional=${optional}`)

    const res = await routes.GET(req)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${siteUrl}/pago/confirmacion?token=tok-get&booking=${bookingId}`)
    expect(fromMock).toHaveBeenCalledWith('api_events')
    const payload = insertMock.mock.calls.at(-1)?.[0]
    expect(payload?.payload).toEqual({ token: 'tok-get', bookingId })
    expect(payload?.status).toBe('success')
  })

  it('redirige POST form con token y optional en x-www-form-urlencoded', async () => {
    const body = new URLSearchParams({
      token: 'tok-form',
      optional: JSON.stringify({ bookingId }),
    }).toString()

    const req = new MockNextRequest(`${siteUrl}/api/flow/return`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })

    const res = await routes.POST(req)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${siteUrl}/pago/confirmacion?token=tok-form&booking=${bookingId}`)
    expect(fromMock).toHaveBeenCalledWith('api_events')
    const payload = insertMock.mock.calls.at(-1)?.[0]
    expect(payload?.payload).toEqual({ token: 'tok-form', bookingId })
    expect(payload?.status).toBe('success')
  })
})
