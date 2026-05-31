import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-brandao-orcamentos.jpg"
        alt="Obra Fechada por Brandão"
        width={150}
        height={56}
        className="h-12 w-auto rounded-md object-contain"
        priority
      />
    </div>
  );
}
