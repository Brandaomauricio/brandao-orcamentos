import { RelatorioObraLink } from "./RelatorioObraLink";

export default function ControleObraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatorioObraLink />
    </>
  );
}
