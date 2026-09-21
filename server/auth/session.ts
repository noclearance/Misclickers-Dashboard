import crypto from 'crypto';
import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'hub_session';
export const OAUTH_STATE_COOKIE = 'hub_oauth_state';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const STATE_MAX_AGE_MS = 1000 * 60 * 10; // 10 minutes

export interface HubSessionPayload {
  id: string;
  username: string;
  globalName?: string | null;
  avatarUrl: string;
  roleIds: string[];
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  // Dev-only fallback so local boots without SESSION_SECRET; prod must set it.
  if (process.env.NODE_ENV !== 'production') {
    return 'dev-insecure-session-secret-change-me';
  }
  return '';
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromB64url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

function sign(payloadB64: string, secret: string): string {
  return b64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());
}

export function isSecureRequest(req: Request): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  const proto = req.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return req.secure === true;
}

function cookieOptions(req: Request, maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function encodeSignedPayload(payload: object, secret: string): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function decodeSignedPayload<T>(token: string | undefined, secret: string): T | null {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expected = sign(payloadB64, secret);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const json = fromB64url(payloadB64).toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function createSessionPayload(user: {
  id: string;
  username: string;
  globalName?: string | null;
  avatarUrl: string;
  roleIds: string[];
}): HubSessionPayload {
  const now = Date.now();
  return {
    id: user.id,
    username: user.username,
    globalName: user.globalName ?? null,
    avatarUrl: user.avatarUrl,
    roleIds: user.roleIds,
    iat: now,
    exp: now + SESSION_MAX_AGE_MS,
  };
}

export function setSessionCookie(req: Request, res: Response, payload: HubSessionPayload): boolean {
  const secret = getSessionSecret();
  if (!secret) return false;
  const token = encodeSignedPayload(payload, secret);
  res.cookie(SESSION_COOKIE, token, cookieOptions(req, SESSION_MAX_AGE_MS));
  return true;
}

export function clearSessionCookie(req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
  });
}

export function readSession(req: Request): HubSessionPayload | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const token = readCookie(req, SESSION_COOKIE);
  const payload = decodeSignedPayload<HubSessionPayload>(token, secret);
  if (!payload) return null;
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  if (typeof payload.id !== 'string' || typeof payload.username !== 'string') return null;
  return payload;
}

export function setOAuthStateCookie(req: Request, res: Response, state: string): void {
  res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req, STATE_MAX_AGE_MS));
}

export function consumeOAuthStateCookie(req: Request, res: Response): string | null {
  const state = readCookie(req, OAUTH_STATE_COOKIE) || null;
  res.clearCookie(OAUTH_STATE_COOKIE, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
  });
  return state;
}

export function sessionSecretConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim()) || process.env.NODE_ENV !== 'production';
}

export function getSessionSecretOrEmpty(): string {
  return getSessionSecret();
}
