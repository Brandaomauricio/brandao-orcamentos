import Link from "next/link";
import { CalendarDays, FileText, Home, MoreHorizontal, PlusCircle } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/novo", label: "Novo", icon: PlusCircle, featured: true },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-black/10 bg-white/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex min-h-[58px] flex-col items-center justify-end gap-1 rounded-xl px-1 text-[12px] font-black text-cement">
              <span className={item.featured ? "rounded-full bg-warning p-2.5 text-graphite shadow-soft" : "p-1.5"}>
                <Icon size={item.featured ? 28 : 23} strokeWidth={2.4} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
