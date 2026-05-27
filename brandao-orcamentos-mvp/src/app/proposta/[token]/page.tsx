import { Logo } from "@/components/Logo";
import { ActionButton } from "@/components/ActionButton";
import { currencyBRL } from "@/lib/format";
import { services } from "@/data/mock";

export default function PublicProposalPage() {
  const total = services.reduce((sum, service) => sum + service.price * service.quantity, 0);

  return (
    <main className="mobile-shell min-h-screen px-5 py-5">
      <Logo />
      <section className="card mt-6 p-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Proposta comercial</p>
        <h1 className="mt-2 text-2xl font-black text-graphite">Instalação de piso vinílico</h1>
        <p className="mt-2 text-sm text-cement">Cliente: João Carlos</p>
        <p className="text-sm text-cement">Validade: 7 dias</p>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="font-black text-graphite">Serviços e valores</h2>
        <div className="mt-3 space-y-3">
          {services.map((service) => (
            <div key={service.name} className="border-b border-black/10 pb-3 text-sm">
              <p className="font-black text-graphite">{service.name}</p>
              <p className="text-cement">
                {currencyBRL(service.price)}/{service.unit} × {service.quantity}{service.unit}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xl font-black">
          <span>Total</span>
          <span>{currencyBRL(total)}</span>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <ActionButton>Baixar PDF</ActionButton>
        <ActionButton variant="secondary">Falar no WhatsApp</ActionButton>
        <ActionButton> Aprovar proposta</ActionButton>
      </section>
    </main>
  );
}
