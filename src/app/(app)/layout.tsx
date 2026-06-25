// Voyle — authenticated layout with Google Photos-style sidebar
// Used for /, /generate, and /chat routes.

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
    <div className="min-h-screen flex bg-white">
      <Sidebar user={user ? { name: user.name } : undefined} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}