export const metadata = { title: "Muzic" };
export const dynamic = "force-dynamic";

export default function MuzicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}