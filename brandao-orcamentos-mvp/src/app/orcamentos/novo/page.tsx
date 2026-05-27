import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { services } from "@/data/mock";
import { currencyBRL } from "@/lib/format";

export default function NewBudgetPage() {
  const total = services.reduce((sum, service) => sum + service.price * service.quantity, 0);

  return (
    <AppShell>
      <AppHeader title="Novo Orçamento" subtitle="Preço definido. Agora transforme esse valor em uma proposta profissional." />

      <section className="px-5">
        <div className="mb-4 grid grid-cols-7 gap-1">
          {[1,2,3,4,5,6,7].map((step) => (
            <div key={step} className={step <= 3 ? "h-2 rounded-full bg-warning" : "h-2 rounded-full bg-black/10"} />
          ))}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">1. Cliente</h2>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Nome do cliente" />
            <input className="input" placeholder="Telefone / WhatsApp" />
            <input className="input" placeholder="Endereço da obra" />
          </div>
        </div>

        <div className="card mt-4 p-4">
          <h2 className="text-lg font-black text-graphite">2. Serviço</h2>
          <p className="mt-1 text-sm text-cement">Escolha serviços salvos ou cadastre um novo.</p>
          <button className="mt-4 rounded-2xl border border-dashed border-wood px-4 py-3 text-sm font-black text-graphite">
            + Adicionar novo serviço
          </button>
        </div>

        <div className="card mt-4 p-4">
          <h2 className="text-lg font-black text-graphite">3. Valores</h2>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <div key={service.name} className="rounded-2xl bg-technical p-3">
                <p className="font-black text-graphite">{service.name}</p>
                <p className="mt-1 text-sm text-cement">
                  {currencyBRL(service.price)}/{service.unit} × {service.quantity}{service.unit} ={" "}
                  <strong className="text-graphite">{currencyBRL(service.price * service.quantity)}</strong>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-graphite p-4 text-white">
            <span className="font-black">Total</span>
            <span className="text-xl font-black text-warning">{currencyBRL(total)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ActionButton variant="secondary">Salvar rascunho</ActionButton>
          <ActionButton>Gerar PDF</ActionButton>
        </div>
      </section>
    </AppShell>
  );
}
