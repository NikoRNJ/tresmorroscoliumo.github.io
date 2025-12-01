import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FlowPaymentStatusCode } from '../packages/core/src/types/flow'

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
const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
const updateMock = vi.fn(() => ({ eq: eqMock }))
const fromMock = vi.fn((table: string) => {
  if (table === 'api_events') return { insert: insertMock }
  if (table === 'bookings') return { update: updateMock }
  return { insert: insertMock }
})

const getPaymentStatusMock = vi.fn()

vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: mockNextResponse,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: fromMock }),
}))

vi.mock('@/lib/flow/client', () => ({
  flowClient: {
    getPaymentStatus: getPaymentStatusMock,
  },
}))

// Import after mocks are declared
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type * as ReturnRoute from '../apps/web/app/api/flow/return/route'

describe('Flow return handler', () => {
  const siteUrl = 'https://example.com'
  const bookingId = '123e4567-e89b-12d3-a456-426614174000'
  const baseStatus = {
    flowOrder: 100,
    requestDate: new Date().toISOString(),
    subject: 'Reserva',
    currency: 'CLP',
    amount: 1000,
    payer: 'tester@example.com',
  }

  let routes: typeof ReturnRoute

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    insertMock.mockClear()
    fromMock.mockClear()
    updateMock.mockClear()
    eqMock.mockClear()
    getPaymentStatusMock.mockReset()
    routes = await import('../apps/web/app/api/flow/return/route')
  })

  it('confirma pago y redirige a confirmacion', async () => {
    const optional = encodeURIComponent(JSON.stringify({ bookingId }))
    getPaymentStatusMock.mockResolvedValue({
      ...baseStatus,
      commerceOrder: bookingId,
      status: FlowPaymentStatusCode.PAID,
    })

    const req = new MockNextRequest(`${siteUrl}/api/flow/return?token=tok-get&optional=${optional}`)

    const res = await routes.GET(req)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${siteUrl}/pago/confirmacion?token=tok-get&booking=${bookingId}`)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid', flow_payment_data: expect.objectContaining({ status: FlowPaymentStatusCode.PAID }) })
    )
    expect(eqMock).toHaveBeenCalledWith('id', bookingId)
  })

  it('marca cancelado y redirige a rechazo', async () => {
    getPaymentStatusMock.mockResolvedValue({
      ...baseStatus,
      commerceOrder: bookingId,
      status: FlowPaymentStatusCode.CANCELLED,
    })

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
    expect(res.headers.get('location')).toBe(
      `${siteUrl}/pago/rechazo?token=tok-form&booking=${bookingId}&reason=cancelled`
    )
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow_order_id: null, flow_payment_data: expect.objectContaining({ status: FlowPaymentStatusCode.CANCELLED }) })
    )
  })
})
