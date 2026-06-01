import Link from "next/link";

type ActionButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ActionButton({ href, children, variant = "primary" }: ActionButtonProps) {
  const classes =
    variant === "primary"
      ? "mobile-action mobile-action-primary mx-auto w-full max-w-full text-center"
      : "mobile-action mx-auto w-full max-w-full border border-black/10 bg-white text-center text-graphite";

  if (href) return <Link href={href} className={classes}>{children}</Link>;

  return <button className={classes}>{children}</button>;
}
