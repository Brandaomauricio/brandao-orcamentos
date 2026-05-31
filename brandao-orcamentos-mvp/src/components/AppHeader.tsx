import { Logo } from "./Logo";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
      <Logo />
      {title ? <h1 className="mt-4 text-[28px] font-black leading-tight text-graphite sm:mt-5 sm:text-2xl">{title}</h1> : null}
      {subtitle ? <p className="mt-1 text-[15px] leading-6 text-cement sm:text-sm sm:leading-5">{subtitle}</p> : null}
    </header>
  );
}
