import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obra Fechada",
  description: "App de orçamentos profissionais para instaladores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-technical text-graphite antialiased">{children}</body>
    </html>
  );
}
