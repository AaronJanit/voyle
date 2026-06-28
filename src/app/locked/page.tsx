// Voyle — locked landing page (iOS-style)
// Shown to ALL visitors (including authenticated ones) when the site_lockdown
// flag is true.

import { Wifi, Signal, BatteryFull } from "lucide-react";

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
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <BatteryFull className="w-5 h-5" />
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