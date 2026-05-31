"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProposalDocument, hasRealValue, type ProposalBudget, type ProposalClient, type ProposalProfile } from "@/components/ProposalDocument";
import { buildProposalWhatsAppMessage, buildWhatsAppUrl, getPublicProposalUrl } from "@/lib/proposalShare";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type BudgetWithRelations = ProposalBudget & {
  client_name: string | null;
  client_whatsapp: string | null;
  client_email: string | null;
  client_address: string | null;
  work_address: string | null;
  public_token: string | null;
  public_link_enabled: boolean | null;
  clients: ProposalClient | ProposalClient[] | null;
};

export default function PrintableProposalPage() {
  const params = useParams<{ id: string }>();
  const [budget, setBudget] = useState<BudgetWithRelations | null>(null);
  const [profile, setProfile] = useState<ProposalProfile>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState("");

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

  function quoteCode() {
    return budget?.proposal_number || budget?.id.slice(0, 8).toUpperCase() || "";
  }

  function publicUrl(token: string) {
    return getPublicProposalUrl(token);
  }

  async function ensurePublicLink() {
    if (!budget) return null;
    if (budget.public_link_enabled && budget.public_token) return { token: budget.public_token, created: false };

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Erro ao verificar usuário antes de criar link público:", authError);
      setMessage("Não foi possível verificar sua conta agora.");
      return null;
    }

    if (!userData.user) {
      setMessage("Entre na sua conta para criar o link da proposta.");
      return null;
    }

    const token = budget.public_token || crypto.randomUUID();
    const { data: savedLink, error } = await supabase
      .from("quotes")
      .update({ public_token: token, public_link_enabled: true, updated_at: new Date().toISOString() })
      .eq("id", budget.id)
      .eq("user_id", userData.user.id)
      .select("public_token,public_link_enabled")
      .single();

    if (error || !savedLink?.public_token || !savedLink.public_link_enabled) {
      console.error("Erro ao criar link público da proposta:", error);
      setMessage("Não foi possível criar o link da proposta agora.");
      return null;
    }

    const savedToken = String(savedLink.public_token);
    setBudget((current) => current ? { ...current, public_token: savedToken, public_link_enabled: true } : current);
    setMessage("Link da proposta criado.");
    return { token: savedToken, created: true };
  }

  async function getShareMessage() {
    if (!budget) return null;
    const publicLink = await ensurePublicLink();
    if (!publicLink) return null;

    return buildProposalWhatsAppMessage({
      clientName: client?.name,
      quoteCode: quoteCode(),
      publicUrl: publicUrl(publicLink.token),
      professionalName: profile?.professional_name,
    });
  }

  async function sendWhatsApp() {
    if (!budget) return;
    setAction("whatsapp");
    try {
      const shareMessage = await getShareMessage();
      if (!shareMessage) return;
      const opened = window.open(buildWhatsAppUrl(client?.whatsapp, shareMessage), "_blank", "noopener,noreferrer");
      if (!opened) setMessage("Não foi possível abrir o WhatsApp.");
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      setMessage("Não foi possível abrir o WhatsApp.");
    } finally {
      setAction("");
    }
  }

  async function copyMessage() {
    setAction("message");
    try {
      const shareMessage = await getShareMessage();
      if (!shareMessage) return;
      await navigator.clipboard.writeText(shareMessage);
      setMessage("Mensagem copiada.");
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);
      setMessage("Não foi possível copiar a mensagem agora.");
    } finally {
      setAction("");
    }
  }

  async function copyLink() {
    setAction("copy-link");
    try {
      const publicLink = await ensurePublicLink();
      if (!publicLink) return;
      await navigator.clipboard.writeText(publicUrl(publicLink.token));
      setMessage("Link copiado.");
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      setMessage("Não foi possível copiar o link agora.");
    } finally {
      setAction("");
    }
  }

  return (
    <main className="min-h-screen bg-technical px-4 py-5 text-graphite print:bg-white print:px-0 print:py-0">
      {isLoading ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm print:hidden">Carregando proposta...</div> : null}
      {message ? <div className="mx-auto max-w-[794px] rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm print:hidden">{message}</div> : null}
      {budget ? (
        <>
          <ProposalDocument budget={budget} client={client} profile={profile} showActions={false} />
          <section className="proposal-actions mx-auto mt-5 space-y-3 print:hidden">
            <button type="button" onClick={sendWhatsApp} disabled={Boolean(action)} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
              {action === "whatsapp" ? "Preparando envio..." : "Enviar pelo WhatsApp"}
            </button>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={copyMessage} disabled={Boolean(action)} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-60">
                {action === "message" ? "Copiando..." : "Copiar mensagem"}
              </button>
              <button type="button" onClick={copyLink} disabled={Boolean(action)} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-60">
                {action === "copy-link" ? "Copiando..." : "Copiar link"}
              </button>
            </div>
            <button type="button" onClick={() => window.print()} className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
              Imprimir / Salvar em PDF
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}
