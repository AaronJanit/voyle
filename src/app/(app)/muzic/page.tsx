// Voyle — Muzic page
// Server Component that shows all uploaded audio tracks (from all channels).

import { scanAudioDir } from "@/lib/media";
import { getAttributionMap } from "@/lib/channel";
import MuzicClient from "@/components/MuzicClient";

export const dynamic = "force-dynamic";

export default async function MuzicPage() {
  const audioItems = await scanAudioDir();
  const attribution = await getAttributionMap(audioItems.map((i) => i.path));

  return (
    <MuzicClient
      audioItems={audioItems}
      attribution={attribution}
    />
  );
}