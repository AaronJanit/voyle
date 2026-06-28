// Voyle — authenticated layout, iOS-style
// Provides the sidebar / bottom tab bar and a main content area that
// reserves space for the mobile tab bar.

import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar user={user ? { name: user.name } : undefined} />
      {/* Main content. pb-24 on mobile leaves room for the bottom tab bar. */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
    </div>
  );
}