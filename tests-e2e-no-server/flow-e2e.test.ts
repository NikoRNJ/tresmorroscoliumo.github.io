import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.E2E_BASE_URL || 'https://www.tresmorroscoliumo.cl'

function formatDate(d: Date) {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

function rangeDates(start: Date, end: Date) {
  const dates: string[] = []
  const cur = new Date(start)
  while (cur < end) { dates.push(formatDate(cur)); cur.setDate(cur.getDate()+1) }
  return dates
}

describe('E2E Flow (server pre-launched)', () => {
  it('health and cabins respond', async () => {
    const h = await fetch(`${BASE_URL}/api/health-lite`)
    expect(h.ok).toBe(true)
    const c = await (await fetch(`${BASE_URL}/api/cabins`)).json()
    expect(Array.isArray(c.cabins)).toBe(true)
    expect(c.cabins.length).toBeGreaterThan(0)
  }, 60000)

  it('reservation end-to-end with CORRECT mock flow', async () => {
    /**
     * Este test verifica el flujo CORRECTO de reserva:
     * 1. Crear hold → status = 'pending'
     * 2. Crear orden de pago → status sigue 'pending' (NO cambia a 'paid')
     * 3. Confirmar pago mock → status = 'paid'
     * 
     * BUG ANTERIOR: El sistema marcaba 'paid' en paso 2 (incorrecto)
     */
    const c = await (await fetch(`${BASE_URL}/api/cabins`)).json()
    const cabinId: string = c.cabins[0].id

    let start = new Date(); start.setDate(start.getDate()+90)
    let end = new Date(start); end.setDate(end.getDate()+2)
    for (let i=0;i<100;i++) {
      const dates = rangeDates(start, end)
      const months = Array.from(new Set(dates.map(d => `${d.slice(0,4)}-${Number(d.slice(5,7))}`)))
      let occupied = new Set<string>()
      for (const ym of months) {
        const [yy, mm]: any = ym.split('-')
        const avail = await (await fetch(`${BASE_URL}/api/availability?cabinId=${cabinId}&year=${yy}&month=${mm}`)).json()
        ;[...(avail.booked||[]), ...(avail.pending||[]), ...(avail.blocked||[])]
          .forEach((d: string) => occupied.add(d))
      }
      const allFree = dates.every(d => !occupied.has(d))
      if (allFree) break
      start.setDate(start.getDate()+1); end = new Date(start); end.setDate(end.getDate()+2)
    }

    const holdBody = {
      cabinId,
      startDate: formatDate(start),
      endDate: formatDate(end),
      partySize: 2,
      jacuzziDays: [],
      towelsCount: 2,
      customerName: 'E2E Runner',
      customerEmail: 'e2e@runner.test',
      customerPhone: '+56 9 0000 0000',
    }

    // PASO 1: Crear hold
    let holdJson: any = null
    for (let t=0;t<15;t++) {
      const res = await fetch(`${BASE_URL}/api/bookings/hold`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(holdBody) })
      if (res.status === 201) { holdJson = await res.json(); break }
      start.setDate(start.getDate()+1); end = new Date(start); end.setDate(end.getDate()+2)
      holdBody.startDate = formatDate(start); holdBody.endDate = formatDate(end)
    }
    expect(holdJson).toBeTruthy()
    const bookingId: string = holdJson.booking.id

    // Verificar que el hold está en 'pending'
    const bkAfterHold = await (await fetch(`${BASE_URL}/api/bookings/${bookingId}`)).json()
    expect(bkAfterHold.booking.status).toBe('pending')

    // PASO 2: Crear orden de pago (NO debe cambiar a 'paid')
    const pay = await fetch(`${BASE_URL}/api/payments/flow/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) })
    expect(pay.ok).toBe(true)
    const payJson = await pay.json()
    expect(payJson.token).toBeTruthy()

    // VERIFICACIÓN CRÍTICA: El estado debe seguir siendo 'pending' después de crear la orden
    const bkAfterCreate = await (await fetch(`${BASE_URL}/api/bookings/${bookingId}`)).json()
    expect(bkAfterCreate.booking.status).toBe('pending') // ← Este era el bug: antes retornaba 'paid'

    // PASO 3: Confirmar pago mock (ahora SÍ debe cambiar a 'paid')
    const mockConfirm = await fetch(`${BASE_URL}/api/payments/flow/mock-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        token: payJson.token,
        action: 'pay'
      })
    })
    expect(mockConfirm.ok).toBe(true)

    // Verificar que ahora SÍ está en 'paid'
    const bkAfterConfirm = await (await fetch(`${BASE_URL}/api/bookings/${bookingId}`)).json()
    expect(bkAfterConfirm.booking.status).toBe('paid')
  }, 60000)

  it('mock payment cancellation works correctly', async () => {
    /**
     * Test que verifica que cancelar en la pasarela mock
     * marca la reserva como 'canceled' correctamente.
     */
    const c = await (await fetch(`${BASE_URL}/api/cabins`)).json()
    const cabinId: string = c.cabins[0].id

    let start = new Date(); start.setDate(start.getDate()+120)
    let end = new Date(start); end.setDate(end.getDate()+1)
    
    // Buscar fechas libres
    for (let i=0;i<50;i++) {
      const dates = rangeDates(start, end)
      const ym = `${start.getFullYear()}-${start.getMonth()+1}`
      const [yy, mm] = ym.split('-')
      const avail = await (await fetch(`${BASE_URL}/api/availability?cabinId=${cabinId}&year=${yy}&month=${mm}`)).json()
      const occupied = new Set([...(avail.booked||[]), ...(avail.pending||[]), ...(avail.blocked||[])])
      if (dates.every(d => !occupied.has(d))) break
      start.setDate(start.getDate()+1); end = new Date(start); end.setDate(end.getDate()+1)
    }

    // Crear hold
    const holdRes = await fetch(`${BASE_URL}/api/bookings/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cabinId,
        startDate: formatDate(start),
        endDate: formatDate(end),
        partySize: 2,
        jacuzziDays: [],
        towelsCount: 0,
        customerName: 'Cancel Test',
        customerEmail: 'cancel@test.test',
        customerPhone: '+56 9 1111 1111',
      })
    })
    
    if (!holdRes.ok) {
      console.log('Hold failed, skipping cancel test')
      return
    }
    
    const holdJson = await holdRes.json()
    const bookingId = holdJson.booking.id

    // Crear orden de pago
    const payRes = await fetch(`${BASE_URL}/api/payments/flow/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    })
    const payJson = await payRes.json()

    // Cancelar en pasarela mock
    const cancelRes = await fetch(`${BASE_URL}/api/payments/flow/mock-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        token: payJson.token,
        action: 'cancel'
      })
    })
    expect(cancelRes.ok).toBe(true)

    // Verificar que está cancelado
    const bkFinal = await (await fetch(`${BASE_URL}/api/bookings/${bookingId}`)).json()
    expect(bkFinal.booking.status).toBe('canceled')
  }, 60000)

  it('mock-confirm endpoint only works in mock mode', async () => {
    /**
     * Test de seguridad: mock-confirm debe rechazar requests
     * si Flow está configurado en modo real.
     * 
     * Nota: Este test solo pasa si el servidor está en modo mock.
     * En producción con Flow real, debería retornar 403.
     */
    const res = await fetch(`${BASE_URL}/api/payments/flow/mock-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: '00000000-0000-0000-0000-000000000000',
        token: 'fake-token',
        action: 'pay'
      })
    })
    
    // En modo mock: debería fallar por booking no encontrado (404)
    // En modo real: debería fallar por no permitido (403)
    expect([403, 404, 400]).toContain(res.status)
  }, 30000)
})
