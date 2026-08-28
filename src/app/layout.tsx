import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { brand, brandCssVars } from "@/lib/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: "Plataforma de gestão de folhas de serviço semanais",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: brand.primary,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandCssVars() }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={brand.shortName} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen">
        <Toaster position="top-right" toastOptions={{
          style: { background: "var(--brand-dark)", color: "var(--brand-gold)", borderRadius: "12px", fontSize: "13px", fontFamily: "Inter, sans-serif" },
          success: { iconTheme: { primary: "var(--brand-gold)", secondary: "var(--brand-dark)" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "var(--brand-dark)" } },
        }} />
        {children}
      </body>
    </html>
  );
}
