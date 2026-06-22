import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "EQX Folha de Serviço",
  description: "EQX — Plataforma de gestão de folhas de serviço semanais",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#F1C411",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="EQX" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen">
        <Toaster position="top-right" toastOptions={{
          style: { background: "#1a1a1a", color: "#F1C411", borderRadius: "12px", fontSize: "13px", fontFamily: "Inter, sans-serif" },
          success: { iconTheme: { primary: "#F1C411", secondary: "#1a1a1a" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" } },
        }} />
        {children}
      </body>
    </html>
  );
}
