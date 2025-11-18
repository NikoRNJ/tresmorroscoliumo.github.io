import { describe, it, expect, beforeEach } from 'vitest'
import { flowClient } from './packages/core/src/lib/flow/client'

describe('FlowClient signature and webhook validation', () => {
  const SECRET = 'test-secret-123'
  const API_KEY = 'api-key-abc'
  const BASE_URL = 'https://sandbox.flow.cl/api'

  beforeEach(() => {
    process.env.FLOW_SECRET_KEY = SECRET
    process.env.FLOW_API_KEY = API_KEY
    process.env.FLOW_BASE_URL = BASE_URL
    process.env.FLOW_FORCE_MOCK = 'false'
  })

  it('validates webhook HMAC signature correctly', () => {
    const params = { token: 'tok-123', apiKey: API_KEY }
    // Recreate client after env set to ensure configured
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = new (flowClient as any).constructor()
    // @ts-expect-error access private method via any for test
    const sign = (client as any).sign.bind(client)
    const signature = sign(params)
    const valid = client.validateWebhookSignature(params as any, signature)
    expect(valid).toBe(true)
  })

  it('rejects invalid webhook signature', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = new (flowClient as any).constructor()
    const params = { token: 'tok-123', apiKey: API_KEY }
    // @ts-expect-error access private method via any for test
    const sign = (client as any).sign.bind(client)
    const good = sign(params)
    // Produce same-length but incorrect signature
    const bad = good.replace(/.$/, good.endsWith('a') ? 'b' : 'a')
    const valid = client.validateWebhookSignature(params as any, bad)
    expect(valid).toBe(false)
  })
})