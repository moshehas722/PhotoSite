import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { isAdminEmail } from '../services/admin';
import { recordLogin } from '../services/userLoginStats';

export const authRouter = Router();

const getAllowedAudiences = () => {
  const fromServerEnv = process.env.GOOGLE_OAUTH_CLIENT_ID
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const fromClientEnv = process.env.VITE_GOOGLE_CLIENT_ID
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const audiences = new Set<string>([...(fromServerEnv ?? []), ...(fromClientEnv ?? [])]);
  if (audiences.size === 0) throw new Error('No Google OAuth audience configured');
  return Array.from(audiences);
};

authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      res.status(400).json({ error: 'Missing credential' });
      return;
    }

    const allowedAudiences = getAllowedAudiences();
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: allowedAudiences,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.name) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    try {
      await recordLogin({
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } catch (err) {
      console.error('Failed to record login stats:', err);
    }

    req.session.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      isAdmin: await isAdminEmail(payload.email),
    };

    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Google auth failed:', err);
    if (err instanceof Error && err.message.includes('Wrong recipient')) {
      res.status(401).json({
        error: 'Authentication failed: token audience does not match configured Google client ID(s)',
      });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
});

authRouter.get('/me', async (req: Request, res: Response) => {
  // Re-evaluate isAdmin from current config so admin changes take effect without re-login.
  if (req.session.user) {
    req.session.user.isAdmin = await isAdminEmail(req.session.user.email);
  }
  res.json({ user: req.session.user ?? null });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to log out' });
      return;
    }
    const secure = process.env.NODE_ENV === 'production';
    res.clearCookie('__session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
    res.json({ ok: true });
  });
});
