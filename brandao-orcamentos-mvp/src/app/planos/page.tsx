"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const plans = [
  { key: "free", name: "Grátis", price: "R$ 0,00", items: ["3 orçamentos por mês", "PDF com marca do app", "Agenda básica", "Até 5 clientes"] },
  { key: "pro", name: "Pró", price: "R$ 29,90/mês", items: ["Orçamentos ilimitados", "PDF sem marca", "Link da proposta", "Clientes e serviços ilimitados"] },
  { key: "aluno", name: "Aluno", price: "Acesso liberado", items: ["Plano Pró por 12 meses", "Para alunos do Método Obra Fechada", "Acesso completo ao app"] },
];

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [hasProfile, setHasProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      return;
    }
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) console.error("Erro ao verificar usuário em planos:", error);
      setUser(data.user);
      if (!data.user) return;
      const { data: profile, error: profileError } = await supabase.from("profiles").select("current_plan").eq("user_id", data.user.id).limit(1);
      if (profileError) console.error("Erro ao carregar plano:", profileError);
      setHasProfile(Boolean(profile?.[0]));
      setCurrentPlan(profile?.[0]?.current_plan || "free");
    });
  }, []);

  async function selectPlan(plan: string) {
    if (!user) {
      setMessage("Entre na sua conta para selecionar um plano.");
      return;
    }
    setIsSaving(true);
    const { error } = hasProfile
      ? await supabase.from("profiles").update({ current_plan: plan, updated_at: new Date().toISOString() }).eq("user_id", user.id)
      : await supabase.from("profiles").insert({
          id: user.id,
          user_id: user.id,
          professional_name: "Obra Fechada",
          whatsapp: "Não informado",
          city: "Não informado",
          state: "BR",
          current_plan: plan,
        });
    if (error) {
      console.error("Erro ao salvar plano:", error);
      setMessage("Não foi possível salvar o plano agora.");
    } else {
      setCurrentPlan(plan);
      setHasProfile(true);
      setMessage("Plano atualizado em modo simulação. Pagamento e bloqueio de recursos serão implementados em uma próxima versão.");
    }
    setIsSaving(false);
  }

  return (
    <AppShell>
      <AppHeader title="Planos" subtitle="Comece grátis ou desbloqueie todos os recursos profissionais." />
      <section className="space-y-4 px-5">
        <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">
          Plano atual: {plans.find((plan) => plan.key === currentPlan)?.name || currentPlan}. Pagamento e bloqueio de recursos serão implementados em uma próxima versão.
        </div>
        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {plans.map((plan) => (
          <div key={plan.key} className={`card p-5 ${currentPlan === plan.key ? "border-warning" : ""}`}>
            <h2 className="text-xl font-black text-graphite">{plan.name}</h2>
            <p className="mt-1 text-2xl font-black text-wood">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-cement">{plan.items.map((item) => <li key={item}>• {item}</li>)}</ul>
            <button type="button" disabled={isSaving} onClick={() => selectPlan(plan.key)} className="mt-5 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
              {isSaving ? "Salvando..." : currentPlan === plan.key ? "Plano atual" : "Selecionar plano"}
            </button>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
