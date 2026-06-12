import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-obra-fechada.png"
        alt="Obra Fechada"
        width={260}
        height={110}
        className="h-[74px] w-auto rounded-xl object-contain shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
        priority
      />
    </div>
  );
}
