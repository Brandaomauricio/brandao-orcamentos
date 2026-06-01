"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { normalizePlan, type AppPlan } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["brandaopm14@gmail.com", "naobrapodcast@gmail.com"];

type AdminProfile = {
  profile_id: string;
  user_id: string;
  professional_name: string | null;
  email: string | null;
  whatsapp: string | null;
  current_plan: string | null;
  created_at: string | null;
};

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

function planLabel(plan?: string | null) {
  return normalizePlan(plan) === "pro" ? "Pro" : "Free";
}

function formatDate(date?: string | null) {
  return date ? new Date(date).toLocaleDateString("pt-BR") : "Sem data";
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState("");

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
      setMessage("Nao foi possivel carregar os usuarios agora. Verifique se o SQL de admin foi executado no Supabase.");
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

  async function updatePlan(profile: AdminProfile, nextPlan: AppPlan) {
    if (!isAdmin) {
      setMessage("Acesso restrito ao administrador.");
      return;
    }

    setActionUserId(profile.user_id);
    setMessage("");

    const { data, error } = await supabase.rpc("admin_update_user_plan", {
      p_user_id: profile.user_id,
      p_plan: nextPlan,
    });

    if (error) {
      console.error("Erro ao atualizar plano no admin:", error);
      setMessage("Nao foi possivel atualizar o plano agora.");
      setActionUserId("");
      return;
    }

    const updatedRows = (data ?? []) as AdminProfile[];
    const updatedProfile = updatedRows[0] ?? { ...profile, current_plan: nextPlan };
    setProfiles((current) => current.map((item) => (item.user_id === profile.user_id ? updatedProfile : item)));
    setMessage(nextPlan === "pro" ? "Plano Pro ativado com sucesso." : "Usuario voltou para o Plano Free.");
    setActionUserId("");
  }

  return (
    <AppShell>
      <AppHeader title="Admin" subtitle="Gerencie manualmente os planos Free e Pro." />
      <section className="space-y-4 px-5">
        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Acesso restrito</h2>
            <p className="mt-1 text-sm text-cement">Entre com uma conta de administrador para abrir este painel.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar
            </Link>
          </div>
        ) : null}

        {user && !isAdmin ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Acesso restrito ao administrador.</h2>
            <p className="mt-1 text-sm text-cement">Esta conta nao tem permissao para alterar planos.</p>
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
                const isActionLoading = actionUserId === profile.user_id;
                return (
                  <div key={profile.user_id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-black text-graphite">{profile.professional_name || "Sem nome profissional"}</h2>
                        <p className="mt-1 break-words text-sm font-bold text-cement">{profile.email || "E-mail nao informado"}</p>
                      </div>
                      <span className={currentPlan === "pro" ? "rounded-full bg-warning px-3 py-1 text-xs font-black text-graphite" : "rounded-full bg-technical px-3 py-1 text-xs font-black text-graphite"}>
                        {planLabel(currentPlan)}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-technical p-3 text-sm text-cement">
                      <p><strong className="text-graphite">WhatsApp:</strong> {profile.whatsapp || "Nao informado"}</p>
                      <p className="mt-1"><strong className="text-graphite">Criado em:</strong> {formatDate(profile.created_at)}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() => updatePlan(profile, "pro")}
                        disabled={isActionLoading || currentPlan === "pro"}
                        className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-50"
                      >
                        {isActionLoading ? "Atualizando..." : currentPlan === "pro" ? "Ja esta no Pro" : "Ativar Pro"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePlan(profile, "free")}
                        disabled={isActionLoading || currentPlan === "free"}
                        className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50"
                      >
                        {currentPlan === "free" ? "Ja esta no Free" : "Voltar para Free"}
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
