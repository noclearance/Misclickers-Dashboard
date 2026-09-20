# Misclickerz Hub (Dashboard)

OSRS clan web hub + Venny Discord bot bridge for **Misclickerz**.

## Quick start

```bash
cp .env.example .env
npm ci
npm run dev
```

Production (Render): `npm ci && npm run build` then `npm start` (see `render.yaml`).

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
