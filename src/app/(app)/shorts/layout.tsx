export const metadata = { title: "Shorts" };

export const dynamic = "force-dynamic";

export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}