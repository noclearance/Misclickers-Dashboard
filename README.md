# Misclickerz Hub (Dashboard)

OSRS clan web hub + Venny Discord bot bridge for **Misclickerz**.

## Quick start

```bash
cp .env.example .env
npm ci
npm run dev
```

Production (Render): `npm ci && npm run build` then `npm start` (see `render.yaml`).

## Venny API environment variables (Render)

- `VENNY_API_KEY` (**server-only, required**) — attached by the hub server when calling Venny upstream.
- `VENNY_API_URL` (**server-only, optional**) — defaults to `https://grazybot.onrender.com`.
- `VENNY_CLAN_NOW_URL` (**server-only, optional override**) — when set, this takes precedence over `VENNY_API_URL` for clan-now fetches.
- `VITE_STAFF_ROLE_IDS` (public, non-secret) — comma-separated Discord role IDs used for staff-mode gating.
- `HUB_ALLOWED_ORIGINS` (optional) — comma-separated extra CORS origins for custom domains.
  - Built-in allowlist includes `https://misclickerz-hub.onrender.com` and localhost dev origins (`localhost` / `127.0.0.1` on ports `3000`, `5173`, `4173`).
  - Requests with no `Origin` header (same-origin/non-browser) are still accepted.

The browser no longer reads or sends a Venny API key.

## Discord member login

Clan members use **Login with Discord** (OAuth2). See **[docs/DISCORD_OAUTH.md](docs/DISCORD_OAUTH.md)** for:

- Env keys Sid must set on Render
- Portal redirect steps Caleb must do on the **existing Venny** Discord application
- Session cookie + guild membership rules

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Express + Vite middleware |
| `npm run build` | Vite client + esbuild server bundle |
| `npm start` | Run `dist/server.cjs` |
| `npm run lint` | `tsc --noEmit` |
