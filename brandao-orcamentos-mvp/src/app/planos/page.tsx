import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";

const plans = [
  {
    name: "Grátis",
    price: "R$ 0,00",
    items: ["3 orçamentos por mês", "PDF com marca do app", "Agenda básica", "Até 5 clientes"],
  },
  {
    name: "Pró",
    price: "R$ 29,90/mês",
    items: ["Orçamentos ilimitados", "PDF sem marca", "Link da proposta", "Clientes e serviços ilimitados"],
  },
  {
    name: "Aluno",
    price: "Acesso liberado",
    items: ["Plano Pró por 12 meses", "Para alunos do Método Obra Fechada", "Acesso completo ao app"],
  },
];

export default function PlansPage() {
  return (
    <AppShell>
      <AppHeader title="Planos" subtitle="Comece grátis ou desbloqueie todos os recursos profissionais." />
      <section className="space-y-4 px-5">
        {plans.map((plan) => (
          <div key={plan.name} className="card p-5">
            <h2 className="text-xl font-black text-graphite">{plan.name}</h2>
            <p className="mt-1 text-2xl font-black text-wood">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-cement">
              {plan.items.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <div className="mt-5">
              <ActionButton>{plan.name === "Grátis" ? "Começar grátis" : "Selecionar plano"}</ActionButton>
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
