import Link from "next/link";

type ActionButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ActionButton({ href, children, variant = "primary" }: ActionButtonProps) {
  const classes =
    variant === "primary"
      ? "block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft"
      : "block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite";

  if (href) return <Link href={href} className={classes}>{children}</Link>;

  return <button className={classes}>{children}</button>;
}
