"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProposalDocument, hasRealValue, type ProposalBudget, type ProposalClient, type ProposalProfile } from "@/components/ProposalDocument";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type PublicBudget = ProposalBudget & {
  user_id: string;
  client_name: string | null;
  client_whatsapp: string | null;
  client_email: string | null;
  client_address: string | null;
  work_address: string | null;
  public_token: string | null;
  public_link_enabled: boolean | null;
  clients: ProposalClient | ProposalClient[] | null;
};

export default function PublicProposalPage() {
  const params = useParams<{ token: string }>();
  const [budget, setBudget] = useState<PublicBudget | null>(null);
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

  const loadProposal = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage("Proposta não encontrada ou link desativado.");
      setIsLoading(false);
      return;
    }

    const token = decodeURIComponent(params.token);
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("public_token", token)
      .eq("public_link_enabled", true)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Erro ao carregar proposta pública:", error);
      setMessage("Proposta não encontrada ou link desativado.");
      setIsLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("quote_items")
      .select("id,service_name,description,unit,unit_price,quantity,total_price,sort_order")
      .eq("quote_id", data.id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Erro ao carregar itens da proposta pública:", itemsError);
    }

    const loadedBudget = { ...(data as PublicBudget), clients: null, quote_items: itemsData ?? [] };
    setBudget(loadedBudget);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", loadedBudget.user_id)
      .limit(1);

    if (profileError) {
      console.error("Erro ao carregar perfil da proposta pública:", profileError);
    }

    setProfile(((profileData?.[0] as ProposalProfile | undefined) ?? null) as ProposalProfile);
    setIsLoading(false);
  }, [params.token]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  return (
    <main className="min-h-screen bg-technical px-4 py-5 text-graphite print:bg-white print:px-0 print:py-0">
      {isLoading ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm print:hidden">Carregando proposta...</div> : null}
      {message ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm print:hidden">{message}</div> : null}
      {budget ? (
        <>
          <ProposalDocument budget={budget} client={client} profile={profile} showActions={false} />
          <section className="mx-auto mt-5 max-w-[794px] print:hidden">
            <button type="button" onClick={() => window.print()} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Imprimir / Salvar em PDF
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}
