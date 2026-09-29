import type { Config } from '@netlify/functions';

// Google OAuth UserInfo Proxy to prevent browser CORS blocks
export default async (req: Request) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return Response.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(4000),
    });

    if (!googleRes.ok) {
      return Response.json({ error: 'Failed to fetch userinfo from Google' }, { status: googleRes.status });
    }

    return Response.json(await googleRes.json());
  } catch (err: any) {
    return Response.json({ error: err.message || 'Google userinfo proxy timeout' }, { status: 500 });
  }
};

export const config: Config = {
  path: '/api/google-userinfo',
};
