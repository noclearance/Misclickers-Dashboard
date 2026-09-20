# Discord OAuth2 member login (Misclickerz Hub)

Hub-owned OAuth so clan members can **Login with Discord** (no manual username/snowflake).

## Locked decisions

- Reuse the **existing Misclickerz Venny Discord application** (same `CLIENT_ID` / OAuth client secret as Venny). Do **not** create a new Discord app.
- Prod redirect URI: `https://misclickerz-hub.onrender.com/auth/discord/callback`
- Hub owns **code → token** exchange (server-only; client secret never sent to the browser)
- Scope: `identify` only
- After `/users/@me`, guild membership + `roleIds` come from the **existing** hub Bot path:
  `GET /api/discord/member/:userId` → Bot `GET /guilds/{DISCORD_GUILD_ID}/members/{userId}`
- Do **not** use `guilds.members.read` on the user token for v1
- Do **not** block on Venny verify-member (optional adapter stub only)
- Session: httpOnly cookie `hub_session`, `Secure` in prod, `SameSite=Lax`, HMAC-signed with `SESSION_SECRET`

## Env keys for Sid (Render)

Set these on the `misclickerz-hub` service (never commit real values):

| Key | Notes |
|-----|--------|
| `DISCORD_CLIENT_ID` | Venny app CLIENT_ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 **client secret** from Portal (≠ bot token ≠ `VENNY_API_KEY`) |
| `DISCORD_REDIRECT_URI` | `https://misclickerz-hub.onrender.com/auth/discord/callback` |
| `SESSION_SECRET` | Random long string; signs session cookie |
| `DISCORD_BOT_TOKEN` | Existing Venny/hub bot token (guild member lookup) |
| `DISCORD_GUILD_ID` | Misclickerz guild snowflake |
| `VENNY_API_KEY` / `VITE_VENNY_API_KEY` | Keep as today |
| `VITE_STAFF_ROLE_IDS` | Keep as today (staff mode from resolved roleIds) |

## Portal steps for Caleb (Venny Discord app)

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → **Misclickerz Venny** application (existing — do not create a new one).
2. **OAuth2 → General** (or Redirects):
   - Add redirect: `https://misclickerz-hub.onrender.com/auth/discord/callback`
   - Exact match required (https, no trailing slash mismatch).
3. Copy **Client ID** → Sid sets `DISCORD_CLIENT_ID`.
4. Copy **Client Secret** (OAuth2 secret, Reset if needed) → Sid sets `DISCORD_CLIENT_SECRET`.
5. Confirm the bot token already used by the hub stays on `DISCORD_BOT_TOKEN` (unchanged).
6. Local/dev (optional): also add `http://localhost:3000/auth/discord/callback` and set `DISCORD_REDIRECT_URI` accordingly when testing locally.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/discord` | Start OAuth (sets state cookie, redirects to Discord) |
| GET | `/auth/discord/callback` | Code exchange + guild check + set session |
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/status` | Config probe (no secrets) |

## Honest error query params

Callback redirects to `/?auth_error=…`:

- `denied` — user cancelled Discord consent
- `not_in_guild` — not in Misclickerz guild (or guild lookup failed)
- `missing_env` — OAuth/session/bot env incomplete
- `redirect_mismatch` — Portal redirect URI does not match
- `state` — CSRF state missing/mismatch
- `token` — token exchange or `/users/@me` failed
