export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-wood/15 px-3 py-1 text-xs font-black text-graphite">
      {children}
    </span>
  );
}
