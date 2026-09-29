import type { Config } from '@netlify/functions';

// Healthcheck & Heartbeat API for background tab keep-alive
export default async () => {
  return Response.json(
    {
      status: 'ok',
      service: 'SI-Pramuka SMK Bakti Idhata',
      timestamp: Date.now(),
      uptime: process.uptime(),
    },
    { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
  );
};

export const config: Config = {
  path: ['/api/health', '/api/heartbeat'],
};
