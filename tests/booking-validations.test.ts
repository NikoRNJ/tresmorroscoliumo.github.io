import { describe, it, expect } from 'vitest'
import { validateJacuzziDays, getDatesBetween } from '@core/lib/validations/booking'

describe('booking validations', () => {
  it('validates jacuzzi days inside range', () => {
    const ok = validateJacuzziDays('2025-12-10', '2025-12-13', ['2025-12-10', '2025-12-12'])
    expect(ok).toBe(true)
    const bad = validateJacuzziDays('2025-12-10', '2025-12-13', ['2025-12-13'])
    expect(bad).toBe(false)
  })

  it('generates dates between', () => {
    const dates = getDatesBetween('2025-12-10', '2025-12-13')
    expect(dates).toEqual(['2025-12-10', '2025-12-11', '2025-12-12'])
  })
})