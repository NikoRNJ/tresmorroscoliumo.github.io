import { NextResponse } from 'next/server';

const startedAt = new Date();

const getRelease = () =>
  process.env.SENTRY_RELEASE ||
  process.env.NEXT_PUBLIC_RELEASE ||
  process.env.GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.DO_DEPLOYMENT_ID ||
  null;

const getRegion = () =>
  process.env.DO_REGION ||
  process.env.DIGITALOCEAN_REGION ||
  process.env.FLY_REGION ||
  process.env.VERCEL_REGION ||
  null;

export async function GET() {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    release: getRelease(),
    region: getRegion(),
    environment: process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}