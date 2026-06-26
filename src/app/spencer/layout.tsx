import { NavBar } from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default function SpencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      {children}
    </div>
  );
}