import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mobile-shell safe-bottom text-white">
      {children}
      <BottomNav />
    </main>
  );
}
