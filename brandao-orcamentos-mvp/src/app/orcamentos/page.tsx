import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { StatusPill } from "@/components/StatusPill";
import { recentBudgets } from "@/data/mock";
import { currencyBRL } from "@/lib/format";

export default function BudgetsPage() {
  return (
    <AppShell>
      <AppHeader title="Orçamentos" subtitle="Crie, edite, envie e acompanhe suas propostas em PDF ou link." />
      <section className="px-5">
        <ActionButton href="/orcamentos/novo">+ Novo Orçamento</ActionButton>
        <input className="input mt-5" placeholder="Buscar por cliente..." />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["Todos", "Rascunho", "Enviado", "Aprovado", "Recusado"].map((filter) => (
            <button key={filter} className="rounded-full bg-white px-4 py-2 text-xs font-black text-cement shadow-sm">
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {recentBudgets.map((budget) => (
            <div key={budget.client} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-graphite">{budget.client}</h2>
                  <p className="mt-1 text-sm text-cement">Proposta #{budget.client.slice(0, 3).toUpperCase()}-001</p>
                </div>
                <StatusPill>{budget.status}</StatusPill>
              </div>
              <p className="mt-3 text-xl font-black text-graphite">{currencyBRL(budget.total)}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
                <button className="rounded-xl bg-technical py-2">Editar</button>
                <button className="rounded-xl bg-technical py-2">PDF</button>
                <button className="rounded-xl bg-warning py-2">WhatsApp</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
