"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { FREE_CLIENTS_LIMIT, FREE_MONTHLY_QUOTES_LIMIT, normalizePlan, type AppPlan } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const planCards: Array<{
  key: AppPlan;
  name: string;
  price: string;
  label: string;
  description: string;
  features: string[];
}> = [
  {
    key: "free",
    name: "Plano Free",
    price: "R$ 0",
    label: "Para começar",
    description: "Estrutura essencial para testar o app e organizar os primeiros atendimentos.",
    features: [
      `Até ${FREE_MONTHLY_QUOTES_LIMIT} orçamentos por mês`,
      `Até ${FREE_CLIENTS_LIMIT} clientes cadastrados`,
      "PDF básico",
      "Agenda básica",
      "Modelos comerciais básicos",
      "Sem recursos avançados futuros",
    ],
  },
  {
    key: "pro",
    name: "Plano Pró",
    price: "Em breve",
    label: "Profissional",
    description: "Para usar o Obra Fechada no dia a dia, sem limites operacionais.",
    features: [
      "Orçamentos ilimitados",
      "Clientes ilimitados",
      "PDF profissional",
      "Envio pelo WhatsApp",
      "Link público da proposta",
      "Modelos comerciais completos",
      "Serviços salvos",
      "Agenda completa",
      "Recursos futuros liberados",
    ],
  },
];

function planName(plan: AppPlan) {
  return plan === "pro" ? "Pró" : "Free";
}

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState<AppPlan>("free");
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_plan")
        .eq("user_id", data.user.id)
        .limit(1);

      if (profileError) console.error("Erro ao carregar plano:", profileError);
      setHasProfile(Boolean(profile?.[0]));
      setCurrentPlan(normalizePlan(profile?.[0]?.current_plan));
    });
  }, []);

  async function selectPlan(plan: AppPlan) {
    if (!user) {
      setMessage("Entre na sua conta para selecionar um plano.");
      return;
    }

    if (currentPlan === plan) return;

    setIsSaving(true);
    setMessage("");

    const payload = {
      id: user.id,
      user_id: user.id,
      professional_name: "Obra Fechada",
      whatsapp: "Não informado",
      city: "Não informado",
      state: "BR",
      current_plan: plan,
      updated_at: new Date().toISOString(),
    };

    const { error } = hasProfile
      ? await supabase.from("profiles").update({ current_plan: plan, updated_at: payload.updated_at }).eq("user_id", user.id)
      : await supabase.from("profiles").insert(payload);

    if (error) {
      console.error("Erro ao salvar plano:", error);
      setMessage("Não foi possível atualizar o plano agora.");
    } else {
      setCurrentPlan(plan);
      setHasProfile(true);
      setMessage(plan === "pro" ? "Plano Pró ativado em modo interno. Pagamento será conectado em uma próxima etapa." : "Plano Free ativado.");
    }

    setIsSaving(false);
  }

  return (
    <AppShell>
      <AppHeader title="Planos" subtitle="Compare o Free e o Pró. Pagamento ainda não está conectado." />
      <section className="space-y-4 px-5">
        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Plano atual</p>
          <h2 className="mt-1 text-2xl font-black text-graphite">{planName(currentPlan)}</h2>
          <p className="mt-2 text-sm leading-6 text-cement">
            {currentPlan === "pro"
              ? "Sua conta está sem limites de orçamentos e clientes."
              : `Sua conta gratuita permite ${FREE_MONTHLY_QUOTES_LIMIT} orçamentos por mês e ${FREE_CLIENTS_LIMIT} clientes cadastrados.`}
          </p>
        </div>

        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}

        <div className="grid grid-cols-1 gap-4">
          {planCards.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            return (
              <div key={plan.key} className={`card overflow-hidden p-5 ${isCurrent ? "border-2 border-warning" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-wood">{plan.label}</p>
                    <h2 className="mt-1 text-2xl font-black text-graphite">{plan.name}</h2>
                  </div>
                  <span className="rounded-full bg-technical px-3 py-1 text-xs font-black text-graphite">{plan.price}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-cement">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm font-bold text-cement">
                  {plan.features.map((item) => (
                    <li key={item} className="rounded-xl bg-technical px-3 py-2">{item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isSaving || isCurrent}
                  onClick={() => selectPlan(plan.key)}
                  className={isCurrent
                    ? "mt-5 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-100"
                    : "mt-5 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60"}
                >
                  {isSaving ? "Salvando..." : isCurrent ? "Estou no plano atual" : plan.key === "pro" ? "Quero o Plano Pró" : "Usar Plano Free"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
