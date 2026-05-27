import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brandão Orçamentos",
  description: "Preço definido com método. Orçamento apresentado com profissionalismo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
