// Voyle — Muzic page
// Server Component that shows all uploaded audio tracks (from all channels)
// and the Shmili Streamer YouTube playlist player.

import { scanAudioDir } from "@/lib/media";
import { getAttributionMap } from "@/lib/channel";
import { getStreamLinks } from "@/lib/shmili-stream";
import MuzicClient from "@/components/MuzicClient";

export const dynamic = "force-dynamic";

export default async function MuzicPage() {
  const audioItems = scanAudioDir();
  const attribution = await getAttributionMap(audioItems.map((i) => i.path));
  const streamLinks = await getStreamLinks();

  return (
    <MuzicClient
      audioItems={audioItems}
      attribution={attribution}
      streamLinks={streamLinks}
    />
  );
}