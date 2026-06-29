// Voyle — Channels directory page
// Server Component. Aggregates every channel on the site, computes its
// stats, fetches its 4 most-recent uploads, and hands the result to the
// ChannelsBrowse client component (search + sort run client-side).

import {
  channelInfoForName,
  getAllChannelStats,
  getRecentMediaForChannel,
  getAttributionMap,
} from "@/lib/channel";
import { getCurrentUser } from "@/lib/user";
import ChannelsBrowse, { ChannelCardData } from "@/components/ChannelsBrowse";
import type { CompactStats } from "@/lib/channel-stats";

export const dynamic = "force-dynamic";

export const metadata = { title: "Channels" };

export default async function ChannelsPage() {
  const [allStats, currentUser] = await Promise.all([
    getAllChannelStats(),
    getCurrentUser(),
  ]);

  // If the visitor is logged in but has no attributed files on disk yet,
  // surface a "Upload to your channel!" CTA card at the front of the grid
  // so they know exactly where to go.
  const ownChannelMissing =
    !!currentUser &&
    !allStats.some((s) => s.name === currentUser.name);

  // Build the per-card payload (channel info + stats + 4 previews).
  // We do this in parallel because each getRecentMediaForChannel call
  // is an independent Supabase read.
  const cards: ChannelCardData[] = await Promise.all(
    allStats.map(async (s): Promise<ChannelCardData> => {
      const recent = await getRecentMediaForChannel(s.name, 4);
      return {
        channel: channelInfoForName(s.name),
        stats: toCompact(s),
        recent,
      };
    })
  );

  // Bulk-load attribution for all preview items in one round-trip so
  // each card's previews can show real view counts / upload dates.
  const allPreviewPaths = cards.flatMap((c) => c.recent.map((r) => r.path));
  const bulkAttribution = await getAttributionMap(allPreviewPaths);

  for (const card of cards) {
    card.attribution = bulkAttribution;
  }

  return (
    <ChannelsBrowse
      channels={cards}
      ownChannelMissing={ownChannelMissing}
      currentUserName={currentUser?.name ?? null}
    />
  );
}

/** Strip the `name` field — the client already has it on `channel.name`. */
function toCompact(s: {
  videos: number;
  tracks: number;
  views: number;
  firstUploadAt: number | null;
  latestUploadAt: number | null;
}): CompactStats {
  return {
    videos: s.videos,
    tracks: s.tracks,
    views: s.views,
    firstUploadAt: s.firstUploadAt,
    latestUploadAt: s.latestUploadAt,
  };
}