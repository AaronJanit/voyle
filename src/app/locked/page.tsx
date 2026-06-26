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
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
      <div className="text-center px-6">
        <h1 className="text-2xl font-semibold text-neutral-200 mb-2">
          This site is temporarily unavailable.
        </h1>
        <p className="text-sm text-neutral-500">
          Please check back later.
        </p>
      </div>
    </main>
  );
}