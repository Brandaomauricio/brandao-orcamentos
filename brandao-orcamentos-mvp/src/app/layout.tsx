import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obra Fechada",
  description: "App de or\u00e7amentos profissionais para instaladores.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/app-icon.png", type: "image/png" },
      { url: "/app-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/app-icon.png",
    apple: [{ url: "/app-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Obra Fechada",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Obra Fechada",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-technical text-graphite antialiased">{children}</body>
    </html>
  );
}
