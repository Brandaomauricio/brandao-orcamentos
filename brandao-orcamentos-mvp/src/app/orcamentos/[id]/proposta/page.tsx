"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProposalDocument, hasRealValue, type ProposalBudget, type ProposalClient, type ProposalProfile } from "@/components/ProposalDocument";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type BudgetWithRelations = ProposalBudget & {
  client_name: string | null;
  client_whatsapp: string | null;
  client_email: string | null;
  client_address: string | null;
  work_address: string | null;
  clients: ProposalClient | ProposalClient[] | null;
};

export default function PrintableProposalPage() {
  const params = useParams<{ id: string }>();
  const [budget, setBudget] = useState<BudgetWithRelations | null>(null);
  const [profile, setProfile] = useState<ProposalProfile>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo<ProposalClient>(() => {
    if (!budget) return null;
    const linkedClient = Array.isArray(budget.clients) ? budget.clients[0] : budget.clients;
    const address = (hasRealValue(budget.work_address) ? budget.work_address : hasRealValue(linkedClient?.address) ? linkedClient?.address : budget.client_address) ?? null;
    return linkedClient ? { ...linkedClient, address } : {
      name: budget.client_name,
      whatsapp: budget.client_whatsapp,
      email: budget.client_email,
      address,
    };
  }, [budget]);

  const loadBudget = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Erro ao verificar usuário para proposta:", authError);
      setMessage("Não foi possível verificar sua conta agora.");
      setIsLoading(false);
      return;
    }

    if (!userData.user) {
      setMessage("Entre na sua conta para abrir a proposta.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("quotes")
      .select("*,clients(name,whatsapp,email,address),quote_items(id,service_name,description,unit,unit_price,quantity,total_price,sort_order)")
      .eq("id", params.id)
      .eq("user_id", userData.user.id)
      .single();

    if (error) {
      console.error("Erro ao carregar proposta:", error);
      setMessage("Não foi possível carregar a proposta agora. Verifique os dados do orçamento e tente novamente.");
      setIsLoading(false);
      return;
    }

    setBudget(data as BudgetWithRelations);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .limit(1);

    if (profileError) {
      console.error("Erro ao carregar perfil para proposta:", profileError);
    }

    setProfile(((profileData?.[0] as ProposalProfile | undefined) ?? null) as ProposalProfile);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  return (
    <main className="min-h-screen bg-technical px-4 py-5 text-graphite print:bg-white print:px-0 print:py-0">
      {isLoading ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm print:hidden">Carregando proposta...</div> : null}
      {message ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm print:hidden">{message}</div> : null}
      {budget ? <ProposalDocument budget={budget} client={client} profile={profile} /> : null}
    </main>
  );
}
