"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
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
  client_id: string | null;
  client_name: string | null;
  client_whatsapp: string | null;
  client_email: string | null;
  client_address: string | null;
  work_address: string | null;
  proposal_number: string | null;
  status: string | null;
  total_value: number | null;
  public_token: string | null;
  public_link_enabled: boolean | null;
  created_at: string | null;
  valid_until: string | null;
  payment_terms: string | null;
  commercial_conditions: string | null;
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

function getClient(quote: Quote) {
  const linkedClient = quote.clients ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients) : null;
  return linkedClient || {
    name: quote.client_name,
    whatsapp: quote.client_whatsapp,
    email: quote.client_email,
    address: quote.work_address || quote.client_address,
  };
}

function getClientName(quote: Quote) {
  return getClient(quote)?.name || "Cliente não informado";
}

function getQuoteCode(quote: Quote) {
  return quote.proposal_number || quote.id.slice(0, 8).toUpperCase();
}

function getStatusLabel(status: string | null) {
  return statusOptions.find((option) => option.value === status)?.label || status || "rascunho";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Data não informada";
}

function formatQuantity(quantity: number, unit: string) {
  const formattedQuantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(quantity);
  return unit.length <= 3 ? `${formattedQuantity}${unit}` : `${formattedQuantity} ${unit}`;
}

export default function BudgetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");

  const selectedQuote = useMemo(() => quotes.find((quote) => quote.id === selectedQuoteId) ?? null, [quotes, selectedQuoteId]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return quotes;

    return quotes.filter((quote) => {
      const client = getClient(quote);
      return [
        client?.name,
        client?.whatsapp,
        quote.proposal_number,
        getQuoteCode(quote),
        quote.id,
      ].some((value) => value?.toLowerCase().includes(term));
    });
  }, [quotes, search]);

  const loadQuotes = useCallback(async (currentUser: User) => {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase para listar orçamentos.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("quotes")
      .select("id,client_id,client_name,client_whatsapp,client_email,client_address,work_address,proposal_number,status,total_value,public_token,public_link_enabled,created_at,valid_until,payment_terms,commercial_conditions,technical_notes,warranty_text,clients(name,whatsapp,email,address),quote_items(id,service_name,description,unit,unit_price,quantity,total_price,sort_order)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar orçamentos:", error);
      setMessage("Não foi possível carregar os orçamentos salvos agora.");
      setQuotes([]);
    } else {
      const loadedQuotes = (data ?? []) as Quote[];
      setQuotes(loadedQuotes);
      setSelectedQuoteId((current) => current || loadedQuotes[0]?.id || "");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadQuotes(data.user);
      else setIsLoading(false);
    });
  }, [loadQuotes]);

  async function deleteQuote(quoteId: string) {
    if (!user) return;
    const confirmed = window.confirm("Excluir este orçamento? O cliente não será excluído.");
    if (!confirmed) return;

    setActionId(`delete-${quoteId}`);
    setMessage("");
    await supabase.from("quote_peripherals").delete().eq("quote_id", quoteId);
    const { error: itemsError } = await supabase.from("quote_items").delete().eq("quote_id", quoteId);
    if (itemsError) {
      console.error("Erro ao excluir serviços do orçamento:", itemsError);
      setMessage("Não foi possível excluir os serviços deste orçamento.");
      setActionId("");
      return;
    }

    const { error } = await supabase.from("quotes").delete().eq("id", quoteId).eq("user_id", user.id);
    if (error) {
      console.error("Erro ao excluir orçamento:", error);
      setMessage("Não foi possível excluir o orçamento agora.");
      setActionId("");
      return;
    }

    setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
    setSelectedQuoteId((current) => (current === quoteId ? "" : current));
    setMessage("Orçamento excluído com sucesso.");
    setActionId("");
  }

  async function updateQuoteStatus(quoteId: string, status: string) {
    if (!user) return;

    setActionId(`status-${quoteId}`);
    const { error } = await supabase
      .from("quotes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", quoteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao atualizar status do orçamento:", error);
      setMessage("Não foi possível atualizar o status do orçamento.");
      setActionId("");
      return;
    }

    setQuotes((current) => current.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)));
    setMessage("Status do orçamento atualizado.");
    setActionId("");
  }

  function getPublicUrl(token: string) {
    return `${window.location.origin}/proposta/${token}`;
  }

  async function updatePublicLink(quote: Quote, enabled: boolean) {
    if (!user) return null;
    setActionId(`link-${quote.id}`);
    const token = quote.public_token || crypto.randomUUID();
    const { error } = await supabase
      .from("quotes")
      .update({ public_token: token, public_link_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", quote.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao atualizar link público da proposta:", error);
      setMessage("Não foi possível atualizar o link da proposta agora.");
      setActionId("");
      return null;
    }

    setQuotes((current) => current.map((item) => (item.id === quote.id ? { ...item, public_token: token, public_link_enabled: enabled } : item)));
    setMessage(enabled ? "Link público ativado." : "Link público desativado.");
    setActionId("");
    return token;
  }

  async function copyPublicLink(quote: Quote) {
    const token = quote.public_link_enabled && quote.public_token ? quote.public_token : await updatePublicLink(quote, true);
    if (!token) return;
    try {
      await navigator.clipboard.writeText(getPublicUrl(token));
      setMessage("Link da proposta copiado com sucesso.");
    } catch (error) {
      console.error("Erro ao copiar link da proposta:", error);
      setMessage("Não foi possível copiar o link automaticamente. Tente novamente.");
    }
  }

  return (
    <AppShell>
      <AppHeader title="Orçamentos" subtitle="Acompanhe rascunhos, propostas enviadas, aprovações e PDFs." />
      <section className="px-5">
        <ActionButton href="/orcamentos/novo">+ Novo Orçamento</ActionButton>

        {!user && !isLoading ? (
          <div className="card mt-4 p-4">
            <h2 className="text-lg font-black text-graphite">Entre para ver seus orçamentos</h2>
            <p className="mt-1 text-sm text-cement">Os rascunhos e propostas ficam salvos na sua conta.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar ou criar conta
            </Link>
          </div>
        ) : null}

        <input className="input mt-5" placeholder="Buscar por cliente, WhatsApp ou código..." value={search} onChange={(event) => setSearch(event.target.value)} />
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando orçamentos...</div> : null}

        <div className="mt-5 space-y-3">
          {user && !isLoading && !filteredQuotes.length ? (
            <div className="card p-4 text-sm font-bold text-cement">Nenhum orçamento encontrado.</div>
          ) : null}

          {filteredQuotes.map((quote) => (
            <div key={quote.id} className={`card p-4 ${selectedQuoteId === quote.id ? "border-warning" : ""}`}>
              <button type="button" onClick={() => setSelectedQuoteId(quote.id)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black text-graphite">{getClientName(quote)}</h2>
                    <p className="mt-1 text-sm text-cement">
                      #{getQuoteCode(quote)} · {formatDate(quote.created_at)} · {quote.quote_items?.length ?? 0} serviços
                    </p>
                    {getClient(quote)?.whatsapp ? <p className="mt-1 text-xs font-bold text-cement">WhatsApp: {getClient(quote)?.whatsapp}</p> : null}
                  </div>
                  <StatusPill>{getStatusLabel(quote.status)}</StatusPill>
                </div>
                <p className="mt-3 text-xl font-black text-graphite">{currencyBRL(Number(quote.total_value ?? 0))}</p>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black">
                <Link href={`/orcamentos/${quote.id}`} className="rounded-xl bg-technical py-2 text-graphite">Abrir detalhes</Link>
                <Link href={`/orcamentos/novo?orcamento=${quote.id}`} className="rounded-xl bg-technical py-2">Editar</Link>
                <Link href={`/orcamentos/${quote.id}/proposta`} className="rounded-xl bg-warning py-2 text-graphite">Gerar PDF</Link>
                <button type="button" disabled={actionId === `delete-${quote.id}`} onClick={() => deleteQuote(quote.id)} className="rounded-xl bg-technical py-2 text-graphite disabled:opacity-60">{actionId === `delete-${quote.id}` ? "Excluindo..." : "Excluir"}</button>
              </div>
            </div>
          ))}
        </div>

        {selectedQuote ? (
          <section className="card mt-5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-wood">Detalhes do orçamento</p>
                <h2 className="mt-1 text-xl font-black text-graphite">{getClientName(selectedQuote)}</h2>
                <p className="mt-1 text-sm font-bold text-cement">#{getQuoteCode(selectedQuote)} · {formatDate(selectedQuote.created_at)}</p>
              </div>
              <StatusPill>{getStatusLabel(selectedQuote.status)}</StatusPill>
            </div>

            <div className="mt-4 rounded-2xl bg-technical p-4 text-sm text-cement">
              <p><strong className="text-graphite">WhatsApp:</strong> {getClient(selectedQuote)?.whatsapp || "não informado"}</p>
              <p className="mt-1"><strong className="text-graphite">E-mail:</strong> {getClient(selectedQuote)?.email || "não informado"}</p>
              <p className="mt-1"><strong className="text-graphite">Endereço:</strong> {getClient(selectedQuote)?.address || "não informado"}</p>
            </div>

            <label className="mt-4 block">
              <span className="label block">Status</span>
              <select className="input" disabled={actionId === `status-${selectedQuote.id}`} value={selectedQuote.status || "draft"} onChange={(event) => updateQuoteStatus(selectedQuote.id, event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="mt-4 space-y-3">
              <h3 className="font-black text-graphite">Serviços</h3>
              {!selectedQuote.quote_items?.length ? <p className="rounded-2xl bg-technical p-3 text-sm font-bold text-cement">Nenhum serviço cadastrado.</p> : null}
              {(selectedQuote.quote_items ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl bg-technical p-3 text-sm">
                  <p className="font-black text-graphite">{item.service_name || item.description || "Serviço não informado"}</p>
                  <p className="mt-1 text-cement">
                    {currencyBRL(Number(item.unit_price ?? 0))}/{item.unit || "serviço"} x{" "}
                    {formatQuantity(Number(item.quantity ?? 0), item.unit || "serviço")}
                  </p>
                  <p className="mt-1 font-black text-graphite">Subtotal: {currencyBRL(Number(item.total_price ?? 0))}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between rounded-2xl bg-graphite p-4 text-xl font-black text-white">
              <span>Total</span>
              <span className="text-warning">{currencyBRL(Number(selectedQuote.total_value ?? 0))}</span>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-cement shadow-sm">
              <p><strong className="text-graphite">Forma de pagamento:</strong> {selectedQuote.payment_terms || "A combinar"}</p>
              <p className="mt-2 whitespace-pre-line"><strong className="text-graphite">Condições comerciais:</strong> {selectedQuote.commercial_conditions || "A combinar"}</p>
              <p className="mt-2"><strong className="text-graphite">Observações:</strong> {selectedQuote.technical_notes || "não informadas"}</p>
              <p className="mt-2"><strong className="text-graphite">Garantia:</strong> {selectedQuote.warranty_text || "A combinar"}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm font-black">
              <Link href={`/orcamentos/novo?orcamento=${selectedQuote.id}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite">Editar</Link>
              <Link href={`/orcamentos/${selectedQuote.id}/proposta`} className="rounded-2xl bg-warning px-4 py-3 text-graphite shadow-soft">Gerar PDF</Link>
              <button type="button" onClick={() => copyPublicLink(selectedQuote)} disabled={actionId === `link-${selectedQuote.id}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite disabled:opacity-60">{actionId === `link-${selectedQuote.id}` ? "Gerando..." : "Copiar link"}</button>
              <button type="button" onClick={() => updatePublicLink(selectedQuote, !selectedQuote.public_link_enabled)} disabled={actionId === `link-${selectedQuote.id}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite disabled:opacity-60">{selectedQuote.public_link_enabled ? "Desativar link público" : "Ativar link público"}</button>
              <button type="button" onClick={() => deleteQuote(selectedQuote.id)} disabled={actionId === `delete-${selectedQuote.id}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite disabled:opacity-60">{actionId === `delete-${selectedQuote.id}` ? "Excluindo..." : "Excluir"}</button>
              <Link href={`/orcamentos/${selectedQuote.id}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite">Tela completa</Link>
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
