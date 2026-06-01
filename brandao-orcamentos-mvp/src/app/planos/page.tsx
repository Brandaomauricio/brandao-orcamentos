"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { FREE_CLIENTS_LIMIT, FREE_MONTHLY_QUOTES_LIMIT, normalizePlan, type AppPlan } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const ADMIN_WHATSAPP = "5567992323688";

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
    label: "Para comecar",
    description: "Estrutura essencial para testar o app e organizar os primeiros atendimentos.",
    features: [
      `Ate ${FREE_MONTHLY_QUOTES_LIMIT} orcamentos por mes`,
      `Ate ${FREE_CLIENTS_LIMIT} clientes cadastrados`,
      "PDF basico",
      "Agenda basica",
      "Modelos comerciais basicos",
      "Sem recursos avancados futuros",
    ],
  },
  {
    key: "pro",
    name: "Plano Pro",
    price: "Ativacao manual",
    label: "Profissional",
    description: "Para usar o Obra Fechada no dia a dia, sem limites operacionais.",
    features: [
      "Orcamentos ilimitados",
      "Clientes ilimitados",
      "PDF profissional",
      "Envio pelo WhatsApp",
      "Link publico da proposta",
      "Modelos comerciais completos",
      "Servicos salvos",
      "Agenda completa",
      "Recursos futuros liberados",
    ],
  },
];

function planName(plan: AppPlan) {
  return plan === "pro" ? "Pro" : "Free";
}

export default function PlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState<AppPlan>("free");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexao com o Supabase ainda nao esta configurada neste ambiente.");
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) console.error("Erro ao verificar usuario em planos:", error);
      setUser(data.user);
      if (!data.user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_plan")
        .eq("user_id", data.user.id)
        .limit(1);

      if (profileError) console.error("Erro ao carregar plano:", profileError);
      setCurrentPlan(normalizePlan(profile?.[0]?.current_plan));
    });
  }, []);

  function requestProPlan() {
    if (!user) {
      setMessage("Entre na sua conta para solicitar a ativacao do Plano Pro.");
      return;
    }

    const text = `Ola, quero ativar o Plano Pro do app Obra Fechada. Meu e-mail de cadastro e: ${user.email || "nao informado"}.`;
    const opened = window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    if (!opened) setMessage("Nao foi possivel abrir o WhatsApp. Tente novamente em instantes.");
  }

  return (
    <AppShell>
      <AppHeader title="Planos" subtitle="Compare o Free e o Pro. A ativacao do Pro e manual por enquanto." />
      <section className="space-y-4 px-5">
        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Plano atual</p>
          <h2 className="mt-1 text-2xl font-black text-graphite">{planName(currentPlan)}</h2>
          <p className="mt-2 text-sm leading-6 text-cement">
            {currentPlan === "pro"
              ? "Sua conta esta sem limites de orcamentos e clientes."
              : `Sua conta gratuita permite ${FREE_MONTHLY_QUOTES_LIMIT} orcamentos por mes e ${FREE_CLIENTS_LIMIT} clientes cadastrados.`}
          </p>
        </div>

        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}

        <div className="grid grid-cols-1 gap-4">
          {planCards.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isProRequest = plan.key === "pro" && !isCurrent;
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
                  disabled={!isProRequest}
                  onClick={isProRequest ? requestProPlan : undefined}
                  className={isProRequest
                    ? "mt-5 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft"
                    : "mt-5 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-100"}
                >
                  {isCurrent ? "Estou no plano atual" : plan.key === "pro" ? "Quero o Plano Pro" : "Plano gratuito"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
