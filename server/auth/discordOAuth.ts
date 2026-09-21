import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import {
  clearSessionCookie,
  consumeOAuthStateCookie,
  createSessionPayload,
  readSession,
  sessionSecretConfigured,
  setOAuthStateCookie,
  setSessionCookie,
} from './session';

const API = 'https://discord.com/api/v10';
const DEFAULT_REDIRECT = 'https://misclickerz-hub.onrender.com/auth/discord/callback';

export type GuildRoleLookup = (userId: string) => Promise<{
  roleIds: string[];
  resolution: 'live' | 'unconfigured' | 'not_found' | 'error';
  message: string;
}>;

function configured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim() && sessionSecretConfigured());
}

function redirectUri(): string {
  return process.env.DISCORD_REDIRECT_URI?.trim() || DEFAULT_REDIRECT;
}

function clientId(): string {
  return process.env.DISCORD_CLIENT_ID?.trim() || '';
}

function clientSecret(): string {
  return process.env.DISCORD_CLIENT_SECRET?.trim() || '';
}

function avatarUrl(user: { id: string; avatar?: string | null }): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  try {
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`;
  } catch {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
}

function fail(res: Response, code: string): void {
  res.redirect(302, `/?auth_error=${encodeURIComponent(code)}`);
}

/** Optional Venny verify-member stub — not required for v1. */
export async function optionalVennyVerifyMember(_userId: string): Promise<{ skipped: true; verified: null }> {
  return { skipped: true, verified: null };
}

export function registerDiscordOAuthRoutes(
  app: Express,
  deps: { resolveGuildMemberRoles: GuildRoleLookup }
): void {
  app.get('/auth/discord', (req: Request, res: Response) => {
    if (!configured()) return fail(res, 'missing_env');
    const state = crypto.randomBytes(24).toString('hex');
    setOAuthStateCookie(req, res, state);
    const params = new URLSearchParams({
      client_id: clientId(),
      response_type: 'code',
      scope: 'identify',
      redirect_uri: redirectUri(),
      state,
      prompt: 'consent',
    });
    return res.redirect(302, `https://discord.com/api/oauth2/authorize?${params}`);
  });

  app.get('/auth/discord/callback', async (req: Request, res: Response) => {
    if (!configured()) return fail(res, 'missing_env');
    const errQ = typeof req.query.error === 'string' ? req.query.error : '';
    if (errQ) return fail(res, 'denied');
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const expected = consumeOAuthStateCookie(req, res);
    if (!code || !state || !expected || state !== expected) return fail(res, 'state');

    let tokenJson: any;
    try {
      const tokenRes = await fetch(`${API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          client_id: clientId(),
          client_secret: clientSecret(),
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri(),
        }),
        signal: AbortSignal.timeout(10000),
      });
      const raw = await tokenRes.text();
      try { tokenJson = JSON.parse(raw); } catch { tokenJson = { error: 'invalid_json' }; }
      if (!tokenRes.ok) {
        if (String(tokenJson?.error || '').includes('redirect') || raw.toLowerCase().includes('redirect_uri')) {
          return fail(res, 'redirect_mismatch');
        }
        return fail(res, 'token');
      }
    } catch {
      return fail(res, 'token');
    }

    const accessToken = tokenJson?.access_token;
    if (!accessToken || typeof accessToken !== 'string') return fail(res, 'token');

    let me: any;
    try {
      const meRes = await fetch(`${API}/users/@me`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!meRes.ok) return fail(res, 'token');
      me = await meRes.json();
    } catch {
      return fail(res, 'token');
    }

    const userId = typeof me?.id === 'string' ? me.id : '';
    const username = typeof me?.username === 'string' ? me.username : '';
    if (!userId || !username) return fail(res, 'token');

    // Guild membership via EXISTING Bot path (not user-token guilds.members.read)
    const guild = await deps.resolveGuildMemberRoles(userId);
    if (guild.resolution === 'not_found') return fail(res, 'not_in_guild');
    if (guild.resolution === 'error') return fail(res, 'verify_failed');
    if (guild.resolution === 'unconfigured') return fail(res, 'missing_env');

    await optionalVennyVerifyMember(userId);

    const ok = setSessionCookie(req, res, createSessionPayload({
      id: userId,
      username,
      globalName: typeof me?.global_name === 'string' ? me.global_name : null,
      avatarUrl: avatarUrl(me),
      roleIds: guild.roleIds || [],
    }));
    if (!ok) return fail(res, 'missing_env');
    return res.redirect(302, '/?auth=ok');
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = readSession(req);
    if (!session) return res.json({ authenticated: false, user: null });
    return res.json({
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
        globalName: session.globalName ?? null,
        avatarUrl: session.avatarUrl,
        roleIds: session.roleIds || [],
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    return res.json({ success: true });
  });

  app.get('/api/auth/status', (_req: Request, res: Response) => {
    return res.json({
      oauthConfigured: configured(),
      redirectUri: redirectUri(),
      scopes: ['identify'],
      sessionCookie: 'hub_session',
      notes: {
        reuseVennyApp: 'Use Misclickerz Venny Discord app CLIENT_ID / OAuth2 client secret (not bot token).',
        guildMembership: 'Resolved via Bot GET /guilds/{guild.id}/members/{user.id}.',
      },
    });
  });
}
