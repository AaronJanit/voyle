export const metadata = { title: "My Channel" };

export const dynamic = "force-dynamic";

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}