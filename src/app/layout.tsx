import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "voyle",
    template: "%s · voyle",
  },
  description: "a little corner of the internet for photos, gifs, and vibes",
  applicationName: "voyle",
  appleWebApp: {
    capable: true,
    title: "voyle",
    statusBarStyle: "default",
  },
  keywords: ["photos", "gifs", "gallery", "ai", "voyle"],
  authors: [{ name: "voyle" }],
  creator: "voyle",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "voyle",
    title: "voyle",
    description: "a little corner of the internet for photos, gifs, and vibes",
  },
  twitter: {
    card: "summary_large_image",
    title: "voyle",
    description: "a little corner of the internet for photos, gifs, and vibes",
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230a84ff'/%3E%3Cstop offset='0.5' stop-color='%235e5ce6'/%3E%3Cstop offset='1' stop-color='%23bf5af2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='24' height='24' rx='6' fill='url(%23g)'/%3E%3Cpath d='M12 5l8 13h-3l-1.7-3H8.7L7 18H4z' fill='white'/%3E%3C/svg%3E",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} h-full antialiased`}
      style={{ colorScheme: "light dark" }}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}