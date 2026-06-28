// Voyle — locked landing page (iOS-style)
// Shown to ALL visitors (including authenticated ones) when the site_lockdown
// flag is true.

export const metadata = {
  title: "Unavailable · voyle",
  robots: { index: false, follow: false },
};

export default function LockedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 text-center">
      {/* Status bar mock */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-3 flex items-center justify-between text-white/60 text-[14px] font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 22h20V11H2v11zm2-9h16v7H4v-7zM7 2h10v7H7V2zm2 2v3h6V4H9z" />
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      <div className="ios-spring-in">
        <div className="mb-8 text-7xl">🔌</div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Unplugged Site
        </h1>
        <p className="text-[17px] text-white/60 max-w-xs mx-auto leading-snug">
          This site has been disconnected.
          <br />
          Please contact the administrator.
        </p>
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/40" />
    </div>
  );
}