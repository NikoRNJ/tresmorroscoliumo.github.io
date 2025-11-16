import { describe, it, expect } from 'vitest'
import { calculatePrice, getIncludedGuests } from '@core/lib/utils/pricing'

const cabin = {
  base_price: 55000,
  jacuzzi_price: 25000,
  capacity_base: 2,
  capacity_max: 7,
  price_per_extra_person: 10000,
}

describe('pricing', () => {
  it('calculates total with extras and jacuzzi', () => {
    const result = calculatePrice(
      cabin,
      '2025-12-15',
      '2025-12-17',
      5,
      ['2025-12-15', '2025-12-16']
    )
    expect(result.nights).toBe(2)
    expect(result.basePrice).toBe(110000)
    expect(result.extraPeople).toBe(3)
    expect(result.extraPeoplePrice).toBe(60000)
    expect(result.jacuzziDays).toBe(2)
    expect(result.jacuzziPrice).toBe(50000)
    expect(result.total).toBe(220000)
  })

  it('respects included guests fallback', () => {
    const included = getIncludedGuests({ capacity_base: 2, capacity_max: 7 })
    expect(included).toBeGreaterThan(0)
    expect(included).toBeLessThanOrEqual(7)
  })
})