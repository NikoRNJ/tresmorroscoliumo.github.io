import type { NextRequest } from 'next/server';
import { handleFlowReturn } from './handler';

export async function POST(req: NextRequest) {
  return handleFlowReturn(req);
}

export async function GET(req: NextRequest) {
  return handleFlowReturn(req);
}
