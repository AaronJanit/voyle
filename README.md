# voyle

A personal photo catalog + AI chatbot site. Drop media files into a folder, get a gallery. Chat with a funny AI assistant powered by Ollama Cloud. Gated behind a simple passcode.

## Features

- **Photo catalog** — auto-scans the `/media` folder for photos, gifs, and videos. Displays them in a responsive masonry grid with a fullscreen lightbox (keyboard navigation, video playback).
- **AI chatbot** — floating chat widget powered by Ollama Cloud. Streaming responses with a custom funny personality. Conversation history saved to SQLite.
- **Passcode auth** — single hardcoded passcode (`613`) with a signed HttpOnly cookie. No user accounts.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Ollama Cloud credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `AUTH_CODE` — the passcode to access the site (default: `613`)
- `AUTH_SECRET` — random string for signing cookies (change this!)
- `OLLAMA_BASE_URL` — your Ollama Cloud endpoint URL
- `OLLAMA_API_KEY` — your Ollama Cloud API key
- `OLLAMA_MODEL` — model name (e.g. `llama3.1`, `qwen2.5`)

### 3. Set up the database

```bash
npx prisma db push
```

This creates a SQLite database at `prisma/dev.db`.

### 4. Add media

Drop photos, gifs, and videos into the `/media` folder:

```
media/
  photo.jpg
  funny.gif
  clip.mp4
  subfolder/another.png
```

Supported formats: jpg, jpeg, png, webp, avif, bmp, tiff, gif, mp4, webm, mov, avi, mkv, m4v.

### 5. Run

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
      chat/route.ts          # POST → stream Ollama Cloud response
      media/route.ts         # GET → list media items
      media/file/[...path]/  # GET → serve media file from disk
    login/page.tsx           # passcode entry page
    layout.tsx               # root layout (nav + chat widget)
    page.tsx                 # catalog page (grid)
  components/
    ChatWidget.tsx           # floating chat UI with streaming
    Lightbox.tsx             # fullscreen media viewer
    MediaGrid.tsx            # responsive masonry grid
    LogoutButton.tsx         # logout button
  lib/
    auth.ts                  # HMAC token sign/verify
    media.ts                 # filesystem scanner
    ollama.ts                # Ollama Cloud streaming client
    prisma.ts                # Prisma client singleton
    prompts.ts               # chatbot system prompt
  proxy.ts                   # auth gate (Next.js proxy/middleware)
prisma/
  schema.prisma              # Conversation + Message models
media/                       # drop files here (gitignored)
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
- Prisma 7 + SQLite (via @prisma/adapter-libsql)
- Ollama Cloud (native `/api/chat` streaming API)

## Deployment

Deploy to any host with a persistent disk (the `/media` folder is filesystem-based). **Not compatible with Vercel** (ephemeral filesystem). Recommended: Render Web Service, Fly.io, or a VPS.

Set all environment variables in your host's dashboard and run `npx prisma db push` on first deploy.
