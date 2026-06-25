import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "voyle",
    template: "%s · voyle",
  },
  description: "a little corner of the internet for photos, gifs, and vibes",
  applicationName: "voyle",
  keywords: ["photos", "gifs", "gallery", "ai", "voyle"],
  authors: [{ name: "voyle" }],
  creator: "voyle",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
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
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3.5l2.5 4.5L12 12 9.5 8z' fill='%234285F4'/%3E%3Cpath d='M12 3.5l4.5 2.5L12 12z' fill='%2334A853'/%3E%3Cpath d='M16.5 6L21 8.5 12 12z' fill='%23FBBC04'/%3E%3Cpath d='M21 8.5v5L12 12z' fill='%23EA4335'/%3E%3C/svg%3E",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#202124] font-roboto">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
