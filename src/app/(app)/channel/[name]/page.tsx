// Voyle — Channel browse page
// Dynamic route /channel/[name] that shows any user's channel.
// If the channel name matches the current user, the upload button and
// guide are shown (same as /channel). Otherwise, it's a read-only view.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getChannelContent, channelInfoForName } from "@/lib/channel";
import ChannelView from "@/components/ChannelView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ChannelBrowsePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const items = await getChannelContent(decodedName);
  const channel = channelInfoForName(decodedName);
  const isOwnChannel = user.name === decodedName;

  return (
    <ChannelView
      items={items}
      channel={channel}
      isOwnChannel={isOwnChannel}
    />
  );
}