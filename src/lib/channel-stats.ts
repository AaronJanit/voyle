// Voyle — channel-stats serialization helpers
// `ChannelStats` in src/lib/channel.ts has the full server-side shape,
// including a `name` field. The browse page passes stats down to a
// client component, so we want a slim, JSON-safe shape with no
// methods or class instances.

import type { ChannelInfo } from "@/lib/channel";

/** Plain-JSON shape sent from server to client. */
export interface CompactStats {
  videos: number;
  tracks: number;
  views: number;
  firstUploadAt: number | null;
  latestUploadAt: number | null;
}

/** Full card payload sent from server to client. */
export interface CompactChannel {
  channel: ChannelInfo;
  stats: CompactStats;
}