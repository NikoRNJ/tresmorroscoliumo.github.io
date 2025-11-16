import { describe, it, expect } from 'vitest'
import { createBookingHoldSchema, validateJacuzziDays } from '@core/lib/validations/booking'

describe('booking hold schema', () => {
  it('rejects invalid party size', () => {
    const data = {
      cabinId: '00000000-0000-0000-0000-000000000000',
      startDate: '2025-12-10',
      endDate: '2025-12-12',
      partySize: 11,
      jacuzziDays: [],
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '+56 9 1234 5678',
    }
    expect(() => createBookingHoldSchema.parse(data)).toThrow()
  })

  it('rejects endDate before startDate', () => {
    const data = {
      cabinId: '00000000-0000-0000-0000-000000000000',
      startDate: '2025-12-12',
      endDate: '2025-12-10',
      partySize: 2,
      jacuzziDays: [],
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '+56 9 1234 5678',
    }
    expect(() => createBookingHoldSchema.parse(data)).toThrow()
  })
})

describe('jacuzzi days validation', () => {
  it('detects days outside range', () => {
    const ok = validateJacuzziDays('2025-12-10', '2025-12-13', ['2025-12-10'])
    expect(ok).toBe(true)
    const bad = validateJacuzziDays('2025-12-10', '2025-12-13', ['2025-12-13'])
    expect(bad).toBe(false)
  })
})