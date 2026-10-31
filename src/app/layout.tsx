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
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
