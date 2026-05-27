import Link from "next/link";

type CardLinkProps = {
  href: string;
  title: string;
  description: string;
};

export function CardLink({ href, title, description }: CardLinkProps) {
  return (
    <Link href={href} className="card block p-4">
      <h3 className="text-base font-black text-graphite">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-cement">{description}</p>
    </Link>
  );
}
