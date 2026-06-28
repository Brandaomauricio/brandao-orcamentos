"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export function RelatorioObraLink() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();

  if (pathname.endsWith("/relatorio")) return null;

  return (
    <Link
      href={`/controle-obras/${params.id}/relatorio`}
      className="no-print fixed inset-x-4 bottom-28 z-40 mx-auto flex max-w-[528px] items-center justify-center rounded-2xl bg-warning px-4 py-4 text-center text-sm font-black text-graphite shadow-soft"
    >
      Relatorio PDF
    </Link>
  );
}
