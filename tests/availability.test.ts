import { describe, it, expect } from 'vitest'
import { availabilityQuerySchema } from '@core/lib/validations/booking'

describe('availability query schema', () => {
  it('accepts valid params', () => {
    const params = { cabinId: '00000000-0000-0000-0000-000000000000', year: 2025, month: 12 }
    const parsed = availabilityQuerySchema.parse(params)
    expect(parsed.cabinId).toBe(params.cabinId)
  })

  it('rejects invalid month', () => {
    expect(() => availabilityQuerySchema.parse({ cabinId: '00000000-0000-0000-0000-000000000000', year: 2025, month: 13 })).toThrow()
  })

  it('rejects invalid uuid', () => {
    expect(() => availabilityQuerySchema.parse({ cabinId: 'not-uuid', year: 2025, month: 11 })).toThrow()
  })
})