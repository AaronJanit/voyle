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
import ChannelsBrowse, {
  ChannelCardData,
} from "@/components/ChannelsBrowse";
import type { CompactStats } from "@/lib/channel-stats";

export const dynamic = "force-dynamic";

export const metadata = { title: "Channels" };

export default async function ChannelsPage() {
  const [allStats, user] = await Promise.all([
    getAllChannelStats(),
    getCurrentUser(),
  ]);

  // Build the per-card payload (channel info + stats + 4 previews).
  // We do this in parallel because each getRecentMediaForChannel call
  // is an independent Supabase read.
  const cards: ChannelCardData[] = await Promise.all(
    allStats.map(async (s): Promise<ChannelCardData> => {
      const [recent, attribution] = await Promise.all([
        getRecentMediaForChannel(s.name, 4),
        getAttributionMap([]), // populated below in bulk
      ]);
      return {
        channel: channelInfoForName(s.name),
        stats: toCompact(s),
        recent,
        attribution, // placeholder; replaced in bulk below
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

  // Decide whether to show the "Upload to your channel!" CTA card:
  //   - Visitor must be logged in (otherwise there's no "their" channel
  //     to upload to — clicking would just bounce them to /login).
  //   - Visitor must NOT already have a channel of their own (if they
  //     do, their own card is already in the grid above).
  const userHasChannel = user
    ? cards.some((c) => c.channel.name === user.name)
    : false;
  const showUploadCta = !!user && !userHasChannel;

  return (
    <ChannelsBrowse
      channels={cards}
      currentUser={
        user
          ? {
              name: user.name,
              channel: channelInfoForName(user.name),
              showUploadCta,
            }
          : null
      }
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