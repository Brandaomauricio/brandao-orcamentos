"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
import { buildProposalWhatsAppMessage, buildWhatsAppUrl, getPublicProposalUrl } from "@/lib/proposalShare";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type QuoteItem = {
  id: string;
  service_name: string | null;
  description: string | null;
  unit: string | null;
  unit_price: number | null;
  quantity: number | null;
  total_price: number | null;
  sort_order: number | null;
};

type Quote = {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string | null;
  client_whatsapp: string | null;
  client_email: string | null;
  client_address: string | null;
  work_address: string | null;
  proposal_number: string | null;
  public_token: string | null;
  public_link_enabled: boolean | null;
  status: string | null;
  total_value: number | null;
  created_at: string | null;
  valid_until: string | null;
  payment_terms: string | null;
  commercial_terms: string | null;
  commercial_conditions: string | null;
  notes: string | null;
  technical_notes: string | null;
  warranty_text: string | null;
  clients: {
    name: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  } | {
    name: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  }[] | null;
  quote_items: QuoteItem[] | null;
};

const statusOptions = [
  { value: "draft", label: "rascunho" },
  { value: "sent", label: "enviado" },
  { value: "approved", label: "aprovado" },
  { value: "rejected", label: "recusado" },
  { value: "completed", label: "concluído" },
];

function formatQuantity(quantity: number, unit: string) {
  const formattedQuantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(quantity);
  return unit.length <= 3 ? `${formattedQuantity}${unit}` : `${formattedQuantity} ${unit}`;
}

function statusLabel(status: string | null) {
  return statusOptions.find((option) => option.value === status)?.label || status || "rascunho";
}

export default function BudgetDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [professionalName, setProfessionalName] = useState("Obra Fechada");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState("");

  const client = useMemo(() => {
    if (!quote) return null;
    const linkedClient = quote.clients ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients) : null;
    return linkedClient || {
      name: quote.client_name,
      whatsapp: quote.client_whatsapp,
      email: quote.client_email,
      address: quote.work_address || quote.client_address,
    };
  }, [quote]);

  const quoteCode = quote?.proposal_number || quote?.id.slice(0, 8).toUpperCase() || "SEM CÓDIGO";

  const loadQuote = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Erro ao verificar usuário para orçamento:", authError);
      setMessage("Não foi possível verificar sua conta agora.");
      setIsLoading(false);
      return;
    }

    if (!userData.user) {
      setMessage("Entre na sua conta para abrir este orçamento.");
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
      console.error("Erro ao carregar detalhe do orçamento:", error);
      setMessage("Não foi possível carregar este orçamento agora.");
    } else {
      setQuote(data as Quote);
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("professional_name")
      .eq("user_id", userData.user.id)
      .limit(1);

    if (profileError) {
      console.error("Erro ao carregar profissional para envio da proposta:", profileError);
    }

    setProfessionalName((profileData?.[0]?.professional_name as string | undefined) || "Obra Fechada");

    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  async function updateStatus(status: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !quote) return;

    setAction("status");
    const { error } = await supabase
      .from("quotes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", quote.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Erro ao atualizar status do orçamento:", error);
      setMessage("Não foi possível atualizar o status.");
      setAction("");
      return;
    }

    setQuote((current) => current ? { ...current, status } : current);
    setMessage("Status do orçamento atualizado.");
    setAction("");
  }

  async function deleteQuote() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !quote) return;

    const confirmed = window.confirm("Excluir este orçamento? O cliente não será excluído.");
    if (!confirmed) return;

    setAction("delete");
    await supabase.from("quote_peripherals").delete().eq("quote_id", quote.id);
    const { error: itemsError } = await supabase.from("quote_items").delete().eq("quote_id", quote.id);
    if (itemsError) {
      console.error("Erro ao excluir serviços do orçamento:", itemsError);
      setMessage("Não foi possível excluir os serviços deste orçamento.");
      setAction("");
      return;
    }

    const { error } = await supabase.from("quotes").delete().eq("id", quote.id).eq("user_id", userData.user.id);
    if (error) {
      console.error("Erro ao excluir orçamento:", error);
      setMessage("Não foi possível excluir este orçamento agora.");
      setAction("");
      return;
    }

    setMessage("Orçamento excluído com sucesso.");
    router.push("/orcamentos");
  }

  function publicUrl(token: string) {
    return getPublicProposalUrl(token);
  }

  async function setPublicLink(enabled: boolean) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !quote) return null;

    setAction("link");
    const token = quote.public_token || crypto.randomUUID();
    const { data: savedLink, error } = await supabase
      .from("quotes")
      .update({ public_token: token, public_link_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", quote.id)
      .eq("user_id", userData.user.id)
      .select("public_token,public_link_enabled")
      .single();

    if (error || !savedLink?.public_token || savedLink.public_link_enabled !== enabled) {
      console.error("Erro ao atualizar link público:", error);
      setMessage("Não foi possível atualizar o link da proposta agora.");
      setAction("");
      return null;
    }

    const savedToken = String(savedLink.public_token);
    setQuote((current) => current ? { ...current, public_token: savedToken, public_link_enabled: enabled } : current);
    setMessage(enabled ? "Link da proposta criado." : "Link público desativado.");
    setAction("");
    return savedToken;
  }

  async function copyPublicLink() {
    if (!quote) return;
    const token = quote.public_link_enabled && quote.public_token ? quote.public_token : await setPublicLink(true);
    if (!token) return;
    try {
      await navigator.clipboard.writeText(publicUrl(token));
      setMessage("Link copiado.");
    } catch (error) {
      console.error("Erro ao copiar link da proposta:", error);
      setMessage("Não foi possível copiar o link automaticamente. Tente novamente.");
    }
  }

  async function ensurePublicLinkForShare() {
    if (!quote) return null;
    if (quote.public_link_enabled && quote.public_token) return quote.public_token;
    return setPublicLink(true);
  }

  async function getShareMessage() {
    if (!quote) return null;
    const token = await ensurePublicLinkForShare();
    if (!token) return null;

    return buildProposalWhatsAppMessage({
      clientName: client?.name,
      quoteCode,
      publicUrl: publicUrl(token),
      professionalName,
    });
  }

  async function sendWhatsApp() {
    if (!quote) return;
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

  async function copyShareMessage() {
    if (!quote) return;
    setAction("message");
    try {
      const shareMessage = await getShareMessage();
      if (!shareMessage) return;
      await navigator.clipboard.writeText(shareMessage);
      setMessage("Mensagem copiada.");
    } catch (error) {
      console.error("Erro ao copiar mensagem da proposta:", error);
      setMessage("Não foi possível copiar a mensagem agora.");
    } finally {
      setAction("");
    }
  }

  return (
    <AppShell>
      <AppHeader title="Detalhes do orçamento" subtitle="Confira cliente, serviços, status, valores e condições." />
      <section className="px-4">
        {isLoading ? <div className="card p-4 text-sm font-black text-cement">Carregando orçamento...</div> : null}
        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}

        {quote ? (
          <>
            <div className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Orçamento #{quoteCode}</p>
                  <h2 className="mt-2 text-xl font-black text-graphite">{client?.name || "Cliente não informado"}</h2>
                  <p className="mt-1 text-sm text-cement">Criado em {quote.created_at ? new Date(quote.created_at).toLocaleDateString("pt-BR") : "data não informada"}</p>
                </div>
                <StatusPill>{statusLabel(quote.status)}</StatusPill>
              </div>

              <label className="mt-4 block">
                <span className="label block">Status</span>
                <select className="input" disabled={action === "status"} value={quote.status || "draft"} onChange={(event) => updateStatus(event.target.value)}>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="card mt-4 p-4">
              <h2 className="text-lg font-black text-graphite">Cliente</h2>
              <p className="mt-2 text-sm text-cement">WhatsApp: {client?.whatsapp || "não informado"}</p>
              <p className="mt-1 text-sm text-cement">E-mail: {client?.email || "não informado"}</p>
              <p className="mt-1 text-sm text-cement">Endereço: {client?.address || "não informado"}</p>
            </div>

            <div className="card mt-4 p-4">
              <h2 className="text-lg font-black text-graphite">Serviços</h2>
              <div className="mt-3 space-y-3">
                {!quote.quote_items?.length ? <p className="rounded-2xl bg-technical p-3 text-sm font-bold text-cement">Nenhum serviço cadastrado.</p> : null}
                {(quote.quote_items ?? []).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-technical p-3 text-sm">
                    <p className="font-black text-graphite">{item.service_name || item.description || "Serviço não informado"}</p>
                    <p className="mt-1 text-cement">{currencyBRL(Number(item.unit_price ?? 0))}/{item.unit || "serviço"} x {formatQuantity(Number(item.quantity ?? 0), item.unit || "serviço")}</p>
                    <p className="mt-1 font-black text-graphite">Subtotal: {currencyBRL(Number(item.total_price ?? 0))}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between rounded-2xl bg-graphite p-4 text-xl font-black text-white">
                <span>Total</span>
                <span className="text-warning">{currencyBRL(Number(quote.total_value ?? 0))}</span>
              </div>
            </div>

            <div className="card mt-4 p-4">
              <h2 className="text-lg font-black text-graphite">Condições e observações</h2>
              <p className="mt-2 text-sm text-cement">Forma de pagamento: {quote.payment_terms || "A combinar"}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-cement">Condições comerciais: {quote.commercial_terms || quote.commercial_conditions || "A combinar"}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-cement">Observações: {quote.technical_notes || quote.notes || "não informadas"}</p>
              <p className="mt-2 text-sm text-cement">Garantia: {quote.warranty_text || "A combinar"}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={sendWhatsApp} disabled={Boolean(action)} className="mobile-action mobile-action-primary col-span-2 text-center disabled:opacity-60">{action === "whatsapp" ? "Preparando envio..." : "Enviar pelo WhatsApp"}</button>
              <Link href={`/orcamentos/novo?orcamento=${quote.id}`} className="mobile-action mobile-action-strong text-center">Editar</Link>
              <Link href={`/orcamentos/${quote.id}/proposta`} className="mobile-action mobile-action-strong text-center">Gerar PDF</Link>
              <button type="button" onClick={copyShareMessage} disabled={Boolean(action)} className="mobile-action border border-black/10 bg-white text-center text-graphite disabled:opacity-60">{action === "message" ? "Copiando..." : "Copiar mensagem"}</button>
              <button type="button" onClick={copyPublicLink} disabled={action === "link"} className="mobile-action border border-black/10 bg-white text-center text-graphite disabled:opacity-60">{action === "link" ? "Gerando link..." : "Copiar link"}</button>
              <button type="button" onClick={() => setPublicLink(!quote.public_link_enabled)} disabled={action === "link"} className="mobile-action border border-black/10 bg-white text-center text-graphite disabled:opacity-60">{quote.public_link_enabled ? "Desativar link" : "Ativar link"}</button>
              <Link href="/orcamentos" className="mobile-action border border-black/10 bg-white text-center text-graphite">Voltar</Link>
              <button type="button" onClick={deleteQuote} disabled={action === "delete"} className="mobile-action col-span-2 border border-black/10 bg-white text-center text-graphite disabled:opacity-60">{action === "delete" ? "Excluindo..." : "Excluir orçamento"}</button>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
