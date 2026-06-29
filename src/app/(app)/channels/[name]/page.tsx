// Voyle — Channel details page (/channels/[name])
// Server Component. Renders the public channel page for any user whose
// name matches an attribution row. Reads the channel's content + audio
// + stats from Supabase and hands everything to ChannelsView.

import { notFound, redirect } from "next/navigation";
import {
  channelInfoForName,
  getAttributionMap,
  getChannelContent,
  getChannelAudio,
  getChannelStats,
} from "@/lib/channel";
import { getCurrentUser } from "@/lib/user";
import ChannelsView from "@/components/ChannelsView";
import type { CompactStats } from "@/lib/channel-stats";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Channels` };
}

export default async function ChannelDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Stats first — if the channel has no attributed files on disk at all
  // we 404 (or, for the visitor's own empty channel, redirect them to
  // their management page so they can fix it).
  const stats = await getChannelStats(decodedName);
  if (stats.videos === 0 && stats.tracks === 0) {
    // If the visitor is the channel owner, send them to their management
    // page where they can upload. Anyone else just gets a 404.
    const user = await getCurrentUser();
    if (user && user.name === decodedName) {
      redirect("/channel");
    }
    notFound();
  }

  const [items, audioItems] = await Promise.all([
    getChannelContent(decodedName),
    getChannelAudio(decodedName),
  ]);

  const allPaths = [
    ...items.map((i) => i.path),
    ...audioItems.map((i) => i.path),
  ];
  const attribution = await getAttributionMap(allPaths);

  return (
    <ChannelsView
      channel={channelInfoForName(decodedName)}
      stats={toCompact(stats)}
      items={items}
      audioItems={audioItems}
      attribution={attribution}
    />
  );
}

/** Slim the server ChannelStats down to the client-safe CompactStats. */
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