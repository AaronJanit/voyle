// Voyle — Shorts page
// Full-screen YouTube Shorts-style vertical feed. Media is shown at its
// natural content size (object-contain). Tap the right side or use the
// arrow keys / chevrons to advance; tap the left side to go back.

import ShortsPage from "@/components/ShortsPage";
import { scanMediaDir } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function ShortsRoute() {
  const items = await scanMediaDir();
  return <ShortsPage items={items} />;
}