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

type PublicProposalResult = {
  quote: PublicBudget | null;
  items: ProposalBudget["quote_items"];
  profile: ProposalProfile;
} | null;

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
    const { data, error } = await supabase.rpc("get_public_proposal_by_token", { p_public_token: token });
    const publicProposal = data as PublicProposalResult;

    if (error || !publicProposal?.quote) {
      if (error) console.error("Erro ao carregar proposta pública:", error);
      setMessage("Proposta não encontrada ou link desativado.");
      setIsLoading(false);
      return;
    }

    const loadedBudget = { ...publicProposal.quote, clients: null, quote_items: publicProposal.items ?? [] };
    setBudget(loadedBudget);
    setProfile(publicProposal.profile);
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
          <section className="proposal-actions mx-auto mt-5 print:hidden">
            <button type="button" onClick={() => window.print()} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Imprimir / Salvar em PDF
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}
