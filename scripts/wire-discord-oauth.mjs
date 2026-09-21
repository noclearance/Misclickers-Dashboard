#!/usr/bin/env node
/**
 * Idempotent: ensure server.ts registers hub Discord OAuth routes.
 * Used when the large server.ts cannot be rewritten in a single Contents API call.
 * Safe to run repeatedly (no-op if already wired).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = path.join(root, 'server.ts');
let src = fs.readFileSync(serverPath, 'utf8');

if (src.includes('registerDiscordOAuthRoutes')) {
  console.log('[wire-discord-oauth] server.ts already registers Discord OAuth — OK');
  process.exit(0);
}

const importLine = "import { registerDiscordOAuthRoutes } from './server/auth/discordOAuth';\n";
if (!src.includes("from 'vite'")) {
  console.error('[wire-discord-oauth] unexpected server.ts — vite import not found');
  process.exit(1);
}
src = src.replace(
  "import { createServer as createViteServer } from 'vite';\n",
  "import { createServer as createViteServer } from 'vite';\n" + importLine,
);

const corsNeedle = '  app.use(cors());\n  app.use(express.json());\n';
const corsReplacement =
  '  app.use(cors({ origin: true, credentials: true }));\n' +
  '  app.use(express.json());\n\n' +
  '  // Hub-owned Discord OAuth2 member login (reuse Venny Discord app credentials)\n' +
  '  registerDiscordOAuthRoutes(app, { resolveGuildMemberRoles });\n';

if (!src.includes(corsNeedle)) {
  console.error('[wire-discord-oauth] unexpected server.ts — cors()/express.json() block not found');
  process.exit(1);
}
src = src.replace(corsNeedle, corsReplacement);
fs.writeFileSync(serverPath, src);
console.log('[wire-discord-oauth] wired Discord OAuth into server.ts');
