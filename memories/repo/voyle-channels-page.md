# Voyle — Channels Directory & Details Pages

## Routes
- `/channels` — public directory of every channel that has at least one attributed file on disk. YouTube-style card grid with avatar, stats, 2x2 preview grid, search, and sort.
- `/channels/[name]` — public channel details page (banner, header, Home/Videos/Muzic/About tabs). Lives in the same `(app)` route group as `/channel/[name]` so it inherits the YouTube shell.

## Data helpers (src/lib/channel.ts)
- `ChannelStats` — `{ videos, tracks, views, firstUploadAt, latestUploadAt }`
- `getChannelStats(name)` — single channel, cross-referenced with on-disk files
- `getAllChannelStats()` — every channel, sorted by views desc
- `getRecentMediaForChannel(name, limit=4)` — most recent uploads (over-fetches to compensate for deleted-on-disk rows)

## Components
- `ChannelsBrowse` (client) — directory grid + search + sort
- `ChannelsView` (client) — channel details (banner, header, tabs)
- `ChannelCardData` exported from ChannelsBrowse — server-side payload shape

## Sidebar
"Channels" entry added under the Create section using the `Users` icon.

## Notes
- All stats cross-reference `media` table with `scanMediaDir()`/`scanAudioDir()` so deleted files don't inflate counts
- The Channels directory is public (no login required) — visitors can browse every channel without an account
- The channel details page 404s when a channel has zero attributed files on disk