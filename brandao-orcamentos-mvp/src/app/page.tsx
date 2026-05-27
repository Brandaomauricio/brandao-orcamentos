import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { CardLink } from "@/components/CardLink";
import { StatusPill } from "@/components/StatusPill";
import { appointments, recentBudgets } from "@/data/mock";
import { currencyBRL } from "@/lib/format";

export default function HomePage() {
  return (
    <AppShell>
      <AppHeader subtitle="Organize seus orçamentos, compromissos e propostas profissionais em um só lugar." />

      <section className="px-5">
        <ActionButton href="/orcamentos/novo">+ Novo Orçamento / Compromisso</ActionButton>

        <div className="card mt-5 overflow-hidden bg-graphite p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-warning">Destaque</p>
          <h2 className="mt-2 text-xl font-black">Método Obra Fechada</h2>
          <p className="mt-2 text-sm leading-5 text-white/80">
            No curso você calcula o preço. No app você apresenta a proposta com profissionalismo.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <CardLink href="/orcamentos" title="Orçamentos" description="Propostas, PDFs e links." />
          <CardLink href="/agenda" title="Agenda" description="Visitas e instalações." />
          <CardLink href="/minha-conta" title="Minha Conta" description="Dados profissionais." />
          <CardLink href="/ferramentas" title="Ferramentas" description="Checklists e modelos." />
          <CardLink href="/tutorial-e-dicas" title="Tutorial e dicas" description="Aprenda o app." />
          <CardLink href="/fale-conosco" title="Fale conosco" description="Suporte e sugestões." />
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-black text-graphite">Atividades recentes</h2>
          <div className="mt-3 space-y-3">
            {recentBudgets.slice(0, 2).map((budget) => (
              <div key={budget.client} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-black text-graphite">{budget.client}</p>
                  <p className="text-sm text-cement">{budget.date} · {currencyBRL(budget.total)}</p>
                </div>
                <StatusPill>{budget.status}</StatusPill>
              </div>
            ))}
            {appointments.slice(0, 1).map((appointment) => (
              <div key={appointment.client} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-black text-graphite">{appointment.title}</p>
                  <p className="text-sm text-cement">{appointment.client} · {appointment.time}</p>
                </div>
                <StatusPill>{appointment.status}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
