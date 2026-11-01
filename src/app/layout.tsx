import type { Metadata, Viewport } from "next";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const t = getMessages();

export const metadata: Metadata = {
  title: { default: t.meta.title, template: `%s · ${t.nav.brand}` },
  description: t.meta.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Trường biến dạng cho Liquid Glass (.glass-liquid); chỉ trình duyệt Chromium dùng tới. */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves="2"
              seed="4"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="soft"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
