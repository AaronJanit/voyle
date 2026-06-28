import { SidebarProvider } from "@/components/SidebarContext";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ShellOffset from "@/components/ShellOffset";
import MakeYourOwnPopup from "@/components/MakeYourOwnPopup";

/* YouTube-style shell: a fixed top bar plus a fixed sidebar that can be
 * collapsed to a 72px icon rail. Pages inside the (app) route group are
 * rendered inside the main content area, with a left margin that adapts
 * to the sidebar's collapsed state via the ShellOffset client component. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NavBar />
      <Sidebar />
      <ShellOffset>
        <main className="min-h-screen pt-14 bg-[color:var(--yt-bg)]">
          {children}
        </main>
      </ShellOffset>
      <ChatWidget />
      <MakeYourOwnPopup />
    </SidebarProvider>
  );
}