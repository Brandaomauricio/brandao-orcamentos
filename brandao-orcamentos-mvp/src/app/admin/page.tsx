"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { normalizePlan, normalizeSubscriptionStatus, type AppPlan, type SubscriptionStatus } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["brandaopm14@gmail.com", "naobrapodcast@gmail.com", "brandao14@gmail.com"];

type AdminAction = "activate_30" | "activate_90" | "mark_active" | "mark_past_due" | "block" | "free";

type AdminProfile = {
  profile_id: string;
  user_id: string;
  professional_name: string | null;
  email: string | null;
  whatsapp: string | null;
  current_plan: string | null;
  subscription_status: string | null;
  paid_until: string | null;
  plan_started_at: string | null;
  plan_updated_at: string | null;
  admin_notes: string | null;
  created_at: string | null;
};

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}

function planLabel(plan?: string | null) {
  return normalizePlan(plan) === "pro" ? "Pro" : "Free";
}

function statusLabel(status?: string | null, plan?: string | null) {
  if (normalizePlan(plan) === "free") return "Free";
  const normalized = normalizeSubscriptionStatus(status);
  if (normalized === "active") return "Em dia";
  if (normalized === "past_due") return "Vencido";
  if (normalized === "blocked") return "Bloqueado";
  return "Cancelado";
}

function formatDate(date?: string | null) {
  return date ? new Date(date).toLocaleDateString("pt-BR") : "Sem data";
}

function daysRemaining(paidUntil?: string | null) {
  if (!paidUntil) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(paidUntil);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function statusClasses(status: SubscriptionStatus, plan: AppPlan) {
  if (plan === "free") return "bg-technical text-graphite";
  if (status === "active") return "bg-warning text-graphite";
  if (status === "past_due") return "bg-white text-wood ring-1 ring-wood/30";
  if (status === "blocked") return "bg-graphite text-warning";
  return "bg-white text-cement ring-1 ring-black/10";
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");

  const detectedEmail = user?.email?.trim().toLowerCase() || "nenhum e-mail detectado";
  const isAdmin = isAdminEmail(user?.email);

  const loadProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage("A conexao com o Supabase ainda nao esta configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.rpc("admin_list_profiles");

    if (error) {
      console.error("Erro ao carregar usuarios no admin:", error);
      setMessage("Nao foi possivel carregar os usuarios agora. Execute o SQL de controle de assinatura no Supabase.");
      setIsLoading(false);
      return;
    }

    setProfiles((data ?? []) as AdminProfile[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexao com o Supabase ainda nao esta configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        console.error("Erro ao verificar usuario no admin:", error);
        setMessage("Nao foi possivel verificar sua conta agora.");
      }

      setUser(data.user);
      if (isAdminEmail(data.user?.email)) {
        await loadProfiles();
      } else {
        setIsLoading(false);
      }
    });
  }, [loadProfiles]);

  async function runAdminAction(profile: AdminProfile, action: AdminAction) {
    if (!isAdmin) {
      setMessage("Acesso restrito ao administrador.");
      return;
    }

    const nextActionKey = `${profile.user_id}-${action}`;
    setActionKey(nextActionKey);
    setMessage("");

    const { data, error } = await supabase.rpc("admin_update_subscription", {
      p_user_id: profile.user_id,
      p_action: action,
    });

    if (error) {
      console.error("Erro ao atualizar assinatura no admin:", error);
      setMessage("Nao foi possivel atualizar a assinatura agora.");
      setActionKey("");
      return;
    }

    const updatedRows = (data ?? []) as AdminProfile[];
    const updatedProfile = updatedRows[0] ?? profile;
    setProfiles((current) => current.map((item) => (item.user_id === profile.user_id ? updatedProfile : item)));
    setMessage("Assinatura atualizada com sucesso.");
    setActionKey("");
  }

  return (
    <AppShell>
      <AppHeader title="Admin" subtitle="Gerencie planos, pagamentos e vencimentos." />
      <section className="space-y-4 px-5">
        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Voce precisa entrar na sua conta para acessar o painel admin.</h2>
            <p className="mt-1 text-sm text-cement">Use uma conta autorizada para abrir este painel.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar
            </Link>
          </div>
        ) : null}

        {user && !isAdmin ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Acesso restrito ao administrador.</h2>
            <p className="mt-3 rounded-2xl bg-technical p-3 text-sm font-black text-graphite">E-mail logado: {detectedEmail}</p>
            <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-cement ring-1 ring-black/10">
              <p className="font-black text-graphite">Administradores permitidos:</p>
              <ul className="mt-2 space-y-1">
                {ADMIN_EMAILS.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando painel...</div> : null}

        {user && isAdmin ? (
          <>
            <div className="card p-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Administrador conectado</p>
              <h2 className="mt-1 break-words text-lg font-black text-graphite">{user.email}</h2>
              <p className="mt-1 text-sm text-cement">{profiles.length} usuario(s) encontrado(s).</p>
            </div>

            <div className="space-y-3">
              {profiles.map((profile) => {
                const currentPlan = normalizePlan(profile.current_plan);
                const currentStatus = normalizeSubscriptionStatus(profile.subscription_status);
                const remaining = daysRemaining(profile.paid_until);
                const statusClass = statusClasses(currentStatus, currentPlan);
                return (
                  <div key={profile.user_id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-black text-graphite">{profile.professional_name || "Sem nome profissional"}</h2>
                        <p className="mt-1 break-words text-sm font-bold text-cement">{profile.email || "E-mail nao informado"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>
                        {planLabel(currentPlan)} - {statusLabel(currentStatus, currentPlan)}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-technical p-3 text-sm text-cement">
                      <p><strong className="text-graphite">WhatsApp:</strong> {profile.whatsapp || "Nao informado"}</p>
                      <p className="mt-1"><strong className="text-graphite">Vencimento:</strong> {formatDate(profile.paid_until)}</p>
                      <p className="mt-1"><strong className="text-graphite">Dias restantes:</strong> {remaining === null ? "Sem vencimento" : remaining >= 0 ? `${remaining} dia(s)` : `Vencido ha ${Math.abs(remaining)} dia(s)`}</p>
                      <p className="mt-1"><strong className="text-graphite">Criado em:</strong> {formatDate(profile.created_at)}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <button type="button" onClick={() => runAdminAction(profile, "activate_30")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-50">
                        {actionKey === `${profile.user_id}-activate_30` ? "Atualizando..." : "Ativar Pro por 30 dias"}
                      </button>
                      <button type="button" onClick={() => runAdminAction(profile, "activate_90")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-50">
                        {actionKey === `${profile.user_id}-activate_90` ? "Atualizando..." : "Ativar Pro por 90 dias"}
                      </button>
                      <button type="button" onClick={() => runAdminAction(profile, "mark_active")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50">
                        Marcar como pagamento em dia
                      </button>
                      <button type="button" onClick={() => runAdminAction(profile, "mark_past_due")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl border border-wood/30 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50">
                        Marcar como vencido
                      </button>
                      <button type="button" onClick={() => runAdminAction(profile, "block")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50">
                        Bloquear conta/recursos Pro
                      </button>
                      <button type="button" onClick={() => runAdminAction(profile, "free")} disabled={Boolean(actionKey)} className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50">
                        Voltar para Free
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
