// Voyle — shareable photo page
// Public landing page for a single media item with rich Open Graph / Twitter
// metadata so links preview beautifully on Twitter, Discord, Slack, iMessage,
// Mastodon, etc. Anyone with the URL can view it (no auth required).
//
// The [id] param is the URL-encoded relative path inside /media.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ShareClient from "./ShareClient";
import { scanMediaDir } from "@/lib/media";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function findItem(id: string) {
  // id may contain encoded slashes (subfolders)
  const decoded = decodeURIComponent(id);
  const items = scanMediaDir();
  return items.find((it) => it.path === decoded) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = findItem(id);
  if (!item) {
    return {
      title: "Not found · voyle",
      description: "This photo no longer exists.",
    };
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const mediaUrl = `${origin}/api/media/file/${item.path}`;
  const pageUrl = `${origin}/p/${id}`;
  const ogImageUrl = `${origin}/api/og?path=${encodeURIComponent(item.path)}`;

  const title = `${item.name} on voyle`;
  const description =
    item.type === "video"
      ? `Watch "${item.name}" on voyle.`
      : item.isGenerated
        ? `AI-generated image: "${item.name}" on voyle.`
        : `A photo on voyle.`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      types: {
        // oEmbed discovery — let consumers find our oEmbed endpoint by
        // following the standard <link rel="alternate"> tag instead of
        // guessing the URL.
        "application/json+oembed": `${origin}/api/oembed?url=${encodeURIComponent(pageUrl)}`,
      },
    },
    openGraph: {
      type: item.type === "video" ? "video.other" : "website",
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: item.name,
        },
      ],
      videos: item.type === "video" ? [{ url: mediaUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PhotoPage({ params }: PageProps) {
  const { id } = await params;
  const item = findItem(id);
  if (!item) notFound();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return <ShareClient item={item} origin={origin} />;
}