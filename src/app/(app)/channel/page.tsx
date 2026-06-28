// Voyle — My Channel page
// Server Component that shows the current user's channel with their
// uploaded content, an upload button, and a "how to create content" guide.
// If not logged in, redirects to /login.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getChannelContent, channelInfoForName } from "@/lib/channel";
import ChannelView from "@/components/ChannelView";

export const dynamic = "force-dynamic";

export default async function MyChannelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await getChannelContent(user.name);
  const channel = channelInfoForName(user.name);

  return (
    <ChannelView
      items={items}
      channel={channel}
      isOwnChannel={true}
    />
  );
}