# voyle

A personal photo catalog + AI chatbot site. Drop media files into a folder, get a gallery. Chat with a funny AI assistant powered by Ollama Cloud. Gated behind a simple passcode.

## Features

- **Photo catalog** — media stored in Cloudflare R2, metadata in Supabase. Displays them in a responsive masonry grid with a fullscreen lightbox (keyboard navigation, video playback).
- **AI chatbot** — floating chat widget powered by Ollama Cloud. Streaming responses with a custom funny personality. Conversation history saved to Supabase.
- **Passcode auth** — single hardcoded passcode (`613`) with a signed HttpOnly cookie. No user accounts.
- **Shareable photos** — every photo has a public `/p/[id]` URL with full Open Graph / Twitter Card metadata, plus an oEmbed endpoint for rich previews on Discord, Slack, Mastodon, Notion, etc.
- **Embeddable viewer** — drop a Voyle photo into any site with `<iframe src="https://your-host/embed/[id]">`.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for the full list):
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase project (server-side)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase (browser client)
- `AUTH_CODE` — the passcode to access the site (default: `613`)
- `AUTH_SECRET` — random string for signing cookies (change this!)
- `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL` — Ollama Cloud chatbot
- `NEXT_PUBLIC_R2_PUBLIC_URL` — public base URL for R2 media objects
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — R2 S3 fallback (local dev only; production uses a native R2 binding)
- `IMAGE_GEN_API_URL`, `IMAGE_GEN_API_KEY` — image generation Worker

### 3. Set up the database

Run the SQL files in `supabase/` via the Supabase SQL Editor (in order):
- `users.sql`, `media.sql`, `system_prompt.sql`, `lockdown.sql`, `login_attempts.sql`, `shmili_stream.sql`, `chat.sql`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Enter the passcode (`613` by default).

## Customizing the chatbot personality

Edit `src/lib/prompts.ts` to change the system prompt and personality of the chatbot.

## Project structure

```
src/
  app/
    api/
      auth/route.ts          # POST passcode → set cookie
      auth/logout/route.ts   # POST → clear cookie
      auth/me/route.ts       # GET → current user
      chat/route.ts          # POST → stream Ollama Cloud response
      generate/route.ts      # POST → image generation (Workers AI)
      media/route.ts         # GET list / POST upload to R2
      oembed/route.ts        # oEmbed endpoint
      og/route.ts            # dynamic OG image
    (app)/                   # authenticated app routes
      page.tsx               # catalog page (grid)
      channel/               # "My Channel" + browse
      channels/              # all channels
      chat/                  # full-page chat
      generate/              # image generation UI
      muzic/                 # Shmili Streamer (YouTube player)
      shorts/                # shorts view
      spencer/               # spencer view
    embed/[id]/page.tsx      # embeddable iframe viewer
    p/[id]/page.tsx          # public share URL (OG metadata)
    login/page.tsx           # passcode entry page
    locked/page.tsx          # lockdown page
  components/                # UI components
  lib/
    auth.ts                  # HMAC token sign/verify
    chat-store.ts            # Supabase-backed chat persistence
    channel.ts               # channel attribution (Supabase)
    media.ts                 # media library (Supabase + R2)
    ollama.ts                # Ollama Cloud streaming client
    prompts.ts               # chatbot system prompt (Supabase)
    r2.ts                    # R2 client (native binding + S3 fallback)
    shmili-stream.ts         # YouTube playlist (Supabase)
    user.ts                  # current user lookup
  proxy.ts                   # auth gate + lockdown (Next.js proxy)
  utils/supabase/            # Supabase SSR clients
supabase/                    # SQL table definitions + RLS policies
cloudflare/worker.js         # standalone image-gen Worker (Workers AI)
wrangler.jsonc               # Cloudflare Workers config (R2 binding, etc)
open-next.config.ts          # OpenNext adapter config
```

## TLS / content filter note (Techloq)

This machine runs a **Techloq** HTTPS content filter that intercepts all TLS
traffic with its own root CA (`CN=techloq-CA`). The CA lives in the Windows
trust store but **not** in Node.js's bundled CA list, so every `fetch()` /
Supabase / Ollama call from Node fails with:

```
unable to get local issuer certificate (UNABLE_TO_GET_ISSUER_CERT_LOCALLY)
```

A copy of the CA is committed at `techloq-ca.pem`, and `npm run dev` /
`npm run start` set `NODE_EXTRA_CA_CERTS=./techloq-ca.pem` via `cross-env` so
Node trusts the filter's certificates.

If the CA changes (e.g. after a Techloq update), regenerate the PEM:

```powershell
$cert = Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*techloq-CA*" } | Select-Object -First 1
$pem = "-----BEGIN CERTIFICATE-----`n" + [Convert]::ToBase64String($cert.RawData, [Base64FormattingOptions]::InsertLineBreaks) + "`n-----END CERTIFICATE-----`n"
$pem | Set-Content -Path techloq-ca.pem -Encoding ASCII
```

## Tech stack

- Next.js 16 (App Router, Turbopack)
- TypeScript + Tailwind CSS v4
- Supabase (Postgres) — all metadata: users, media, chat history, prompts, lockdown
- Cloudflare R2 — media file storage (native binding in production)
- Ollama Cloud (native `/api/chat` streaming API)
- Cloudflare Workers AI — image generation (separate Worker)

## Deployment

The site deploys to **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

### Local dev

```bash
npm run dev          # Next.js dev server (Node.js)
```

### Preview in the Workers runtime

```bash
npm run preview      # builds via OpenNext + runs in workerd locally
```

> **Windows note:** OpenNext has known Windows issues for build/preview/deploy.
> If `npm run preview` or `npm run deploy` fails on Windows, run them inside
> WSL or via CI (GitHub Actions on Linux).

### Deploy

```bash
npm run deploy       # builds + deploys to Cloudflare Workers
```

### Environment variables on Cloudflare

Set server-side secrets via `wrangler secret put <NAME>` or the dashboard:
`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`,
`AUTH_CODE`, `OLLAMA_*`, `IMAGE_GEN_*`, `R2_PUBLIC_URL`.

Set `NEXT_PUBLIC_*` vars as **Workers Build build variables** (they're inlined
into the client bundle at build time): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_R2_PUBLIC_URL`.

R2 is accessed via a native binding (`R2_BUCKET` in `wrangler.jsonc`) — no
access keys needed in production.
