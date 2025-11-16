import { NextResponse } from 'next/server'
import { flowClient } from '@/lib/flow/client'

export async function GET() {
  const configured = flowClient.isConfigured()
  const baseUrl = process.env.FLOW_BASE_URL || null
  const apiKeySet = Boolean(process.env.FLOW_API_KEY)
  const secretSet = Boolean(process.env.FLOW_SECRET_KEY)
  const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true'
  return NextResponse.json({ configured, baseUrl, apiKeySet, secretSet, forceMock })
}