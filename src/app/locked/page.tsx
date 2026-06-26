// Voyle — locked landing page
// Shown to ALL visitors (including authenticated ones) when the site_lockdown
// flag is true. Contains no media, no links, no chat — just a static message.
// Recovery is manual: an admin flips site_lockdown.locked back to false in
// the Supabase Table Editor.

export const metadata = {
  title: "Unavailable · voyle",
  robots: { index: false, follow: false },
};

export default function LockedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <div className="mb-6 text-5xl">🔌</div>
      <h1 className="text-3xl font-semibold text-neutral-200 mb-2">
        Unplugged Site
      </h1>
      <p className="text-sm text-neutral-500 max-w-xs">
        This site has been disconnected. Please contact the administrator.
      </p>
    </main>
  );
}