import { Logo } from "./Logo";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="px-5 pb-3 pt-5">
      <Logo />
      {title ? <h1 className="mt-5 text-2xl font-black text-graphite">{title}</h1> : null}
      {subtitle ? <p className="mt-1 text-sm leading-5 text-cement">{subtitle}</p> : null}
    </header>
  );
}
