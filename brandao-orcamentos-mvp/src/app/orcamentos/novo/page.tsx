"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { currencyBRL } from "@/lib/format";
import { canCreateClient, canCreateQuoteThisMonth } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import Link from "next/link";

type QuoteItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
};

type SavedClient = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
};

type SavedService = {
  id: string;
  name: string;
  unit: string | null;
  default_price: number | null;
  description: string | null;
};

type CommercialTerms = {
  payment_terms: string;
  down_payment_value: string;
  down_payment_percent: string;
  validity_days: string;
  execution_deadline: string;
  commercial_notes: string;
  approval_text: string;
  warranty_text: string;
};

type ContactPickerContact = {
  name?: string[];
  tel?: string[];
  email?: string[];
};

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: Array<"name" | "tel" | "email">,
      options?: { multiple?: boolean },
    ) => Promise<ContactPickerContact[]>;
  };
};

const unitOptions = ["m²", "m", "unidade", "diária", "serviço"];
const quoteStatusOptions = [
  { value: "draft", label: "rascunho" },
  { value: "sent", label: "enviado" },
  { value: "approved", label: "aprovado" },
  { value: "rejected", label: "recusado" },
  { value: "completed", label: "concluído" },
];

const emptyCommercialTerms: CommercialTerms = {
  payment_terms: "",
  down_payment_value: "",
  down_payment_percent: "",
  validity_days: "",
  execution_deadline: "",
  commercial_notes: "",
  approval_text: "",
  warranty_text: "",
};

function NewBudgetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [client, setClient] = useState({ id: "", name: "", phone: "", email: "", address: "" });
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [clientAccess, setClientAccess] = useState<"checking" | "signed-in" | "signed-out">("checking");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [newService, setNewService] = useState({ name: "", unit: "m²", price: "", quantity: "" });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [commercialTerms, setCommercialTerms] = useState<CommercialTerms>(emptyCommercialTerms);
  const [commercialDefaults, setCommercialDefaults] = useState<CommercialTerms>(emptyCommercialTerms);
  const [quoteStatus, setQuoteStatus] = useState("draft");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [savedBudgetId, setSavedBudgetId] = useState("");
  const [proposalToken, setProposalToken] = useState("");
  const [proposalNumber, setProposalNumber] = useState("");
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const serviceSectionRef = useRef<HTMLDivElement | null>(null);
  const commercialSectionRef = useRef<HTMLDivElement | null>(null);
  const previewSectionRef = useRef<HTMLDivElement | null>(null);
  const total = useMemo(() => quoteItems.reduce((sum, service) => sum + service.price * service.quantity, 0), [quoteItems]);

  function scrollToSection(ref: { current: HTMLDivElement | null }) {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function valueOrEmpty(value: unknown) {
    return value === null || value === undefined ? "" : String(value);
  }

  function updateCommercialTerm(field: keyof CommercialTerms, value: string) {
    setCommercialTerms((current) => ({ ...current, [field]: value }));
  }

  const loadClients = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setClientAccess("signed-out");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setClientAccess("signed-out");
      return;
    }

    setClientAccess("signed-in");
    const { data, error } = await supabase
      .from("clients")
      .select("id,name,whatsapp,email,address")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar clientes para orçamento:", error);
      setMessage("Não foi possível carregar seus clientes agora. Tente novamente em instantes.");
      return;
    }

    setSavedClients(data ?? []);
  }, []);

  const loadSavedServices = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("services")
      .select("id,name,unit,default_price,description")
      .eq("user_id", userData.user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar serviços padrão:", error);
      return;
    }
    setSavedServices((data ?? []) as SavedService[]);
  }, []);

  const loadClientFromUrl = useCallback(async () => {
    const clientId = searchParams.get("cliente");
    if (!clientId || !isSupabaseConfigured) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setClientAccess("signed-out");
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("id,name,whatsapp,email,address")
      .eq("id", clientId)
      .eq("user_id", userData.user.id)
      .single();

    if (error) {
      console.error("Erro ao carregar cliente do orçamento:", error);
      setMessage("Não foi possível carregar este cliente agora. Tente novamente em instantes.");
      return;
    }

    if (data) selectClient(data);
  }, [searchParams]);

  const loadBudgetFromUrl = useCallback(async () => {
    const budgetId = searchParams.get("orcamento");
    if (!budgetId || !isSupabaseConfigured) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setClientAccess("signed-out");
      return;
    }

    const { data: budget, error: budgetError } = await supabase
      .from("quotes")
      .select("*,clients(id,name,whatsapp,email,address)")
      .eq("id", budgetId)
      .eq("user_id", userData.user.id)
      .single();

    if (budgetError) {
      console.error("Erro ao carregar orçamento para edição:", budgetError);
      setMessage("Não foi possível carregar o orçamento para edição.");
      return;
    }

    const { data: budgetItems, error: itemsError } = await supabase
      .from("quote_items")
      .select("id,service_name,description,unit,unit_price,quantity,total_price,sort_order")
      .eq("quote_id", budgetId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Erro ao carregar serviços do orçamento:", itemsError);
      setMessage("Não foi possível carregar os serviços do orçamento.");
      return;
    }

    const budgetClient = Array.isArray(budget.clients) ? budget.clients[0] : budget.clients;
    setClient({
      id: budgetClient?.id ?? budget.client_id ?? "",
      name: budgetClient?.name ?? budget.client_name ?? "",
      phone: budgetClient?.whatsapp ?? budget.client_whatsapp ?? "",
      email: budgetClient?.email ?? budget.client_email ?? "",
      address: budget.work_address ?? budgetClient?.address ?? budget.client_address ?? "",
    });

    setSavedBudgetId(budget.id);
    setProposalToken(budget.public_token ?? "");
    setProposalNumber(budget.proposal_number ?? "");
    setPublicLinkEnabled(Boolean(budget.public_link_enabled));
    setQuoteStatus(budget.status ?? "draft");
    setCommercialTerms({
      payment_terms: valueOrEmpty(budget.payment_terms),
      down_payment_value: valueOrEmpty(budget.down_payment_value),
      down_payment_percent: valueOrEmpty(budget.down_payment_percent),
      validity_days: valueOrEmpty(budget.validity_days),
      execution_deadline: valueOrEmpty(budget.execution_deadline),
      commercial_notes: valueOrEmpty(budget.commercial_terms || budget.commercial_conditions || budget.notes),
      approval_text: valueOrEmpty(budget.approval_text),
      warranty_text: valueOrEmpty(budget.warranty_text),
    });
    setTechnicalNotes(valueOrEmpty(budget.technical_notes));
    setQuoteItems(
      (budgetItems ?? []).map((item) => ({
        id: item.id,
        name: item.service_name || item.description || "",
        unit: item.unit ?? "serviço",
        price: Number(item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 1),
      })),
    );
    setMessage("Orçamento carregado para edição.");
  }, [searchParams]);

  const loadCommercialDefaults = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .limit(1);

    const profile = data?.[0];
    if (!profile) return;

    const defaults = {
      payment_terms: valueOrEmpty(profile.default_payment_terms),
      down_payment_value: valueOrEmpty(profile.default_down_payment_value),
      down_payment_percent: valueOrEmpty(profile.default_down_payment_percent),
      validity_days: valueOrEmpty(profile.default_quote_validity_days),
      execution_deadline: valueOrEmpty(profile.default_execution_deadline),
      commercial_notes: valueOrEmpty(profile.default_commercial_notes),
      approval_text: valueOrEmpty(profile.default_approval_text),
      warranty_text: valueOrEmpty(profile.default_warranty_text),
    };

    setCommercialDefaults(defaults);
    setCommercialTerms((current) => {
      const hasCurrentTerms = Object.values(current).some((value) => value.trim());
      return hasCurrentTerms ? current : defaults;
    });
  }, []);

  useEffect(() => {
    loadClients();
    loadSavedServices();
    loadClientFromUrl();
    loadBudgetFromUrl();
    loadCommercialDefaults();
  }, [loadClients, loadSavedServices, loadClientFromUrl, loadBudgetFromUrl, loadCommercialDefaults]);

  useEffect(() => {
    const pendingService = window.localStorage.getItem("brandao_pending_service");
    if (pendingService) {
      try {
        const service = JSON.parse(pendingService) as { name?: string; unit?: string; price?: string; quantity?: string; description?: string };
        setNewService({
          name: service.name || "",
          unit: service.unit || "serviço",
          price: service.price || "",
          quantity: service.quantity || "1",
        });
        window.localStorage.removeItem("brandao_pending_service");
        setMessage("Serviço periférico carregado para o orçamento.");
        scrollToSection(serviceSectionRef);
      } catch (error) {
        console.error("Erro ao carregar serviço preparado:", error);
      }
    }

    const pendingTechnicalNote = window.localStorage.getItem("brandao_pending_technical_note");
    if (pendingTechnicalNote) {
      setTechnicalNotes((current) => [current, pendingTechnicalNote].filter(Boolean).join("\n"));
      window.localStorage.removeItem("brandao_pending_technical_note");
      setMessage("Observação técnica aplicada ao orçamento.");
      scrollToSection(commercialSectionRef);
    }

    const pendingCommercialTerms = window.localStorage.getItem("brandao_pending_commercial_terms");
    if (pendingCommercialTerms) {
      setCommercialTerms((current) => ({ ...current, payment_terms: current.payment_terms || pendingCommercialTerms, commercial_notes: [current.commercial_notes, pendingCommercialTerms].filter(Boolean).join("\n") }));
      window.localStorage.removeItem("brandao_pending_commercial_terms");
      setMessage("Condição comercial aplicada ao orçamento.");
      scrollToSection(commercialSectionRef);
    }
  }, []);

  function parseMoneyValue(value: string) {
    const normalizedValue = value.replace(/\./g, "").replace(",", ".");
    const parsedValue = Number(normalizedValue);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  function formatQuantity(quantity: number, unit: string) {
    const formattedQuantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(quantity);
    return unit.length <= 3 ? `${formattedQuantity}${unit}` : `${formattedQuantity} ${unit}`;
  }

  function getValidUntilDate() {
    const days = Number(commercialTerms.validity_days.replace(/\D/g, ""));
    if (!days) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function buildCommercialConditions() {
    return [
      commercialTerms.execution_deadline.trim() ? `Prazo de execução: ${commercialTerms.execution_deadline.trim()}` : "",
      commercialTerms.down_payment_value.trim() ? `Sinal/entrada: ${commercialTerms.down_payment_value.trim()}` : "",
      commercialTerms.down_payment_percent.trim() ? `Sinal/entrada: ${commercialTerms.down_payment_percent.trim()}%` : "",
      commercialTerms.commercial_notes.trim(),
      commercialTerms.approval_text.trim() ? `Aprovação: ${commercialTerms.approval_text.trim()}` : "",
    ].filter(Boolean).join("\n");
  }

  function addService() {
    if (!newService.name.trim()) {
      setMessage("Informe o nome do serviço para adicionar.");
      return;
    }

    const price = parseMoneyValue(newService.price);
    const quantity = parseMoneyValue(newService.quantity);
    if (price <= 0) {
      setMessage("Informe um preço maior que zero para o serviço.");
      return;
    }
    if (quantity <= 0) {
      setMessage("Informe uma quantidade maior que zero para o serviço.");
      return;
    }

    const service = {
      id: editingItemId ?? `${Date.now()}`,
      name: newService.name.trim(),
      unit: newService.unit.trim() || "serviço",
      price,
      quantity,
    };

    setQuoteItems((current) =>
      editingItemId ? current.map((item) => (item.id === editingItemId ? service : item)) : [...current, service],
    );
    setNewService({ name: "", unit: "m²", price: "", quantity: "" });
    setEditingItemId(null);
    setMessage(editingItemId ? "Serviço atualizado no orçamento." : "Serviço adicionado ao orçamento.");
  }

  function editService(item: QuoteItem) {
    setEditingItemId(item.id);
    setNewService({
      name: item.name,
      unit: item.unit,
      price: String(item.price).replace(".", ","),
      quantity: String(item.quantity).replace(".", ","),
    });
    setMessage("Edite o serviço e clique em Atualizar serviço.");
    scrollToSection(serviceSectionRef);
  }

  async function importContactFromDevice() {
    const contactPicker = (navigator as ContactPickerNavigator).contacts;

    if (!contactPicker?.select) {
      setMessage("Seu navegador não permite importar contatos automaticamente. Preencha os dados manualmente.");
      return;
    }

    try {
      const contacts = await contactPicker.select(["name", "tel", "email"], { multiple: false });
      const contact = contacts[0];
      if (!contact) return;

      setClient((current) => ({
        ...current,
        name: contact.name?.[0] ?? current.name,
        phone: contact.tel?.[0] ?? current.phone,
        email: contact.email?.[0] ?? current.email,
      }));
      setMessage("Contato importado da agenda. Confira os dados antes de salvar.");
    } catch (error) {
      console.error("Erro ao importar contato da agenda:", error);
      setMessage("Não foi possível importar o contato. Preencha os dados manualmente.");
    }
  }

  function removeService(itemId: string) {
    setQuoteItems((current) => current.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
      setNewService({ name: "", unit: "m²", price: "", quantity: "" });
    }
    setMessage("Serviço removido do orçamento.");
  }

  function saveDraft() {
    persistBudget().then((result) => {
      if (!result) return;
      setShowPreview(false);
      setMessage("Rascunho salvo com sucesso. Você pode acessá-lo em Orçamentos.");
    });
  }

  function generatePreview() {
    persistBudget().then((result) => {
      if (!result) return;
      setShowPreview(true);
      setMessage("Proposta gerada. Abra a proposta para imprimir ou salvar em PDF.");
      scrollToSection(previewSectionRef);
    });
  }

  function selectClient(savedClient: SavedClient) {
    setClient({
      id: savedClient.id,
      name: savedClient.name,
      phone: savedClient.whatsapp,
      email: savedClient.email ?? "",
      address: savedClient.address ?? "",
    });
    setMessage("Cliente selecionado para o orçamento.");
  }

  function selectSavedService(serviceId: string) {
    const service = savedServices.find((item) => item.id === serviceId);
    if (!service) return;

    setNewService((current) => {
      const hasFilledPrice = Boolean(current.price.trim());
      const hasFilledQuantity = Boolean(current.quantity.trim());

      setMessage(
        hasFilledPrice || hasFilledQuantity
          ? "Serviço salvo aplicado. Mantive o valor e a quantidade já preenchidos."
          : "Serviço padrão carregado. Ajuste quantidade e preço antes de adicionar.",
      );

      return {
        name: service.name,
        unit: service.unit || current.unit || "serviço",
        price: current.price || (service.default_price ? String(service.default_price).replace(".", ",") : ""),
        quantity: current.quantity || "1",
      };
    });
  }

  async function ensureClient(userId: string) {
    if (client.id) return client.id;

    if (!client.name.trim() || !client.phone.trim()) {
      setMessage("Informe nome e WhatsApp do cliente antes de salvar o orçamento.");
      return null;
    }

    const clientLimit = await canCreateClient(userId);
    if (!clientLimit.allowed) {
      setMessage(clientLimit.message);
      return null;
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        name: client.name.trim(),
        whatsapp: client.phone.trim(),
        email: client.email.trim() || null,
        address: client.address.trim() || null,
      })
      .select("id,name,whatsapp,email,address")
      .single();

    if (error) {
      console.error("Erro ao salvar cliente do orçamento:", error);
      setMessage("Não foi possível salvar os dados do cliente agora. Confira os dados e tente novamente.");
      return null;
    }

    setClient({
      id: data.id,
      name: data.name,
      phone: data.whatsapp,
      email: data.email ?? "",
      address: data.address ?? "",
    });
    return data.id;
  }

  async function persistBudget() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase para salvar orçamentos.");
      return null;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage("Entre na sua conta para salvar orçamentos.");
      return null;
    }
    const userId = userData.user.id;

    if (!savedBudgetId) {
      const quoteLimit = await canCreateQuoteThisMonth(userId);
      if (!quoteLimit.allowed) {
        setMessage(quoteLimit.message);
        return null;
      }
    }

    if (!quoteItems.length) {
      setMessage("Adicione pelo menos um serviço ao orçamento antes de salvar.");
      return null;
    }

    const hasItemWithoutName = quoteItems.some((item) => !item.name.trim());
    if (hasItemWithoutName) {
      setMessage("Informe o nome do serviço antes de salvar.");
      return null;
    }
    if (quoteItems.some((item) => item.quantity <= 0)) {
      setMessage("Todos os serviços precisam ter quantidade maior que zero.");
      return null;
    }
    if (quoteItems.some((item) => item.price <= 0)) {
      setMessage("Todos os serviços precisam ter preço maior que zero.");
      return null;
    }

    setIsSaving(true);
    const clientId = await ensureClient(userId);
    if (!clientId) {
      setIsSaving(false);
      return null;
    }

    const token = proposalToken || crypto.randomUUID();
    const validityDays = Number(commercialTerms.validity_days.replace(/\D/g, "")) || null;
    const commercialText = buildCommercialConditions() || null;
    const nextProposalNumber = proposalNumber || `BO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const clientPayloadSnapshot = {
      client_name: client.name.trim(),
      client_whatsapp: client.phone.trim(),
      client_email: client.email.trim() || null,
      client_address: client.address.trim() || null,
      work_address: client.address.trim() || null,
    };
    const budgetPayload = {
      user_id: userId,
      client_id: clientId,
      ...clientPayloadSnapshot,
      status: quoteStatus,
      total_value: total,
      public_token: token,
      public_link_enabled: publicLinkEnabled,
      proposal_number: nextProposalNumber,
      valid_until: getValidUntilDate(),
      validity_days: validityDays,
      payment_terms: commercialTerms.payment_terms.trim() || null,
      commercial_terms: commercialText,
      commercial_conditions: commercialText,
      payment_method: commercialTerms.payment_terms.trim() || null,
      notes: commercialTerms.commercial_notes.trim() || null,
      technical_notes: technicalNotes.trim() || null,
      warranty_text: commercialTerms.warranty_text.trim() || null,
      down_payment_value: parseMoneyValue(commercialTerms.down_payment_value) || null,
      down_payment_percent: parseMoneyValue(commercialTerms.down_payment_percent) || null,
      execution_deadline: commercialTerms.execution_deadline.trim() || null,
      approval_text: commercialTerms.approval_text.trim() || null,
      updated_at: new Date().toISOString(),
    };

    async function saveQuote(payload: typeof budgetPayload) {
      return savedBudgetId
        ? supabase
            .from("quotes")
            .update(payload)
            .eq("id", savedBudgetId)
            .eq("user_id", userId)
            .select("id,public_token")
            .single()
        : supabase.from("quotes").insert(payload).select("id,public_token").single();
    }

    const { data: budget, error: budgetError } = await saveQuote(budgetPayload);
    if (budgetError) {
      console.error("Erro ao salvar orçamento:", budgetError);
      setMessage("Não foi possível salvar o orçamento agora.");
      setIsSaving(false);
      return null;
    }
    if (!budget) {
      setMessage("Não foi possível salvar o orçamento agora.");
      setIsSaving(false);
      return null;
    }

    if (savedBudgetId) {
      const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", savedBudgetId);
      if (deleteError) {
        console.error("Erro ao atualizar serviços do orçamento:", deleteError);
        setMessage("Não foi possível atualizar os serviços deste orçamento.");
        setIsSaving(false);
        return null;
      }
    }

    const budgetItems = quoteItems.map((item, index) => {
      const serviceName = item.name.trim();

      return {
        quote_id: budget.id,
        service_name: serviceName,
        description: serviceName,
        unit: item.unit,
        unit_price: item.price,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        sort_order: index + 1,
      };
    });

    const { error: itemsError } = await supabase.from("quote_items").insert(budgetItems);
    if (itemsError) {
      console.error("Erro ao salvar serviços do orçamento:", itemsError);
      setMessage("Não foi possível salvar os serviços do orçamento.");
      setIsSaving(false);
      return null;
    }

    setSavedBudgetId(budget.id);
    setProposalToken(budget.public_token ?? token);
    setProposalNumber(nextProposalNumber);
    setIsSaving(false);
    return { id: budget.id, token: budget.public_token ?? token };
  }

  return (
    <AppShell>
      <AppHeader title="Novo Orçamento" subtitle="Preço definido. Agora transforme esse valor em uma proposta profissional." />

      <section className="px-5">
        <div className="mb-4 grid grid-cols-7 gap-1">
          {[1,2,3,4,5,6,7].map((step) => (
            <div key={step} className={step <= 3 ? "h-2 rounded-full bg-warning" : "h-2 rounded-full bg-black/10"} />
          ))}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">1. Cliente</h2>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-technical p-3">
            <p className="text-sm font-bold text-cement">Selecione um cliente salvo ou preencha abaixo.</p>
            <Link href="/clientes" className="shrink-0 rounded-2xl bg-warning px-3 py-2 text-xs font-black text-graphite">
              Clientes
            </Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {savedClients.map((savedClient) => (
              <button
                key={savedClient.id}
                type="button"
                onClick={() => selectClient(savedClient)}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-cement shadow-sm"
              >
                {savedClient.name}
              </button>
            ))}
            {clientAccess === "checking" ? <span className="text-xs font-bold text-cement">Carregando clientes salvos...</span> : null}
            {clientAccess === "signed-in" && !savedClients.length ? <span className="text-xs font-bold text-cement">Nenhum cliente salvo carregado.</span> : null}
          </div>
          {clientAccess === "signed-out" ? (
            <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-cement">Entre na sua conta para buscar clientes salvos.</p>
              <Link href="/login" className="mt-3 block rounded-2xl bg-warning px-4 py-3 text-center text-sm font-black text-graphite">
                Entrar ou criar conta
              </Link>
            </div>
          ) : null}
          <button
            type="button"
            onClick={importContactFromDevice}
            className="mt-4 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite"
          >
            Importar da agenda
          </button>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Nome do cliente" value={client.name} onChange={(event) => setClient({ ...client, name: event.target.value })} />
            <input className="input" placeholder="Telefone / WhatsApp" value={client.phone} onChange={(event) => setClient({ ...client, phone: event.target.value })} />
            <input className="input" placeholder="E-mail do cliente" value={client.email} onChange={(event) => setClient({ ...client, email: event.target.value })} />
            <input className="input" placeholder="Endereço da obra" value={client.address} onChange={(event) => setClient({ ...client, address: event.target.value })} />
          </div>
        </div>

        <div ref={serviceSectionRef} className="card mt-4 p-4">
          <h2 className="text-lg font-black text-graphite">2. Serviço</h2>
          <p className="mt-1 text-sm text-cement">Cadastre um serviço para adicionar ao orçamento.</p>
          <div className="mt-4 space-y-3">
            <select className="input" onChange={(event) => selectSavedService(event.target.value)} value="">
              <option value="">Escolher serviço salvo</option>
              {savedServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <input className="input" placeholder="Nome do serviço" value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <select className="input" value={newService.unit} onChange={(event) => setNewService({ ...newService, unit: event.target.value })}>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input className="input" inputMode="decimal" placeholder="Preço" value={newService.price} onChange={(event) => setNewService({ ...newService, price: event.target.value })} />
              <input className="input" inputMode="decimal" placeholder="Qtd." value={newService.quantity} onChange={(event) => setNewService({ ...newService, quantity: event.target.value })} />
            </div>
          </div>
          <button type="button" onClick={addService} disabled={isSaving} className="mt-4 inline-block rounded-2xl border border-dashed border-wood px-4 py-3 text-sm font-black text-graphite disabled:opacity-60">
            {editingItemId ? "Atualizar serviço" : "+ Adicionar novo serviço"}
          </button>
          {editingItemId ? (
            <button
              type="button"
              onClick={() => {
                setEditingItemId(null);
                setNewService({ name: "", unit: "m²", price: "", quantity: "" });
                setMessage("Edição de serviço cancelada.");
              }}
              className="ml-2 mt-4 inline-block rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-graphite"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="card mt-4 p-4">
          <h2 className="text-lg font-black text-graphite">3. Valores</h2>
          <div className="mt-4 space-y-3">
            {!quoteItems.length ? (
              <p className="rounded-2xl bg-technical p-3 text-sm font-bold text-cement">Nenhum serviço adicionado ao orçamento.</p>
            ) : null}
            {quoteItems.map((service) => (
              <div key={service.id} className="rounded-2xl bg-technical p-3">
                <p className="font-black text-graphite">{service.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-cement">
                  <p>Preço unitário: <strong className="text-graphite">{currencyBRL(service.price)}</strong></p>
                  <p>Quantidade: <strong className="text-graphite">{formatQuantity(service.quantity, service.unit)}</strong></p>
                  <p>Unidade: <strong className="text-graphite">{service.unit}</strong></p>
                  <p>Subtotal: <strong className="text-graphite">{currencyBRL(service.price * service.quantity)}</strong></p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black">
                  <button type="button" onClick={() => editService(service)} className="rounded-xl bg-white py-2 text-graphite">
                    Editar
                  </button>
                  <button type="button" onClick={() => removeService(service.id)} className="rounded-xl bg-white py-2 text-graphite">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-graphite p-4 text-white">
            <span className="font-black">Total</span>
            <span className="text-xl font-black text-warning">{currencyBRL(total)}</span>
          </div>
        </div>

        <div ref={commercialSectionRef} className="card mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-graphite">4. Condições comerciais</h2>
              <p className="mt-1 text-sm text-cement">Use os padrões da sua conta ou ajuste este orçamento antes de salvar.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCommercialTerms(commercialDefaults);
                setMessage("Condições comerciais padrão aplicadas ao orçamento.");
              }}
              className="shrink-0 rounded-2xl bg-warning px-3 py-2 text-xs font-black text-graphite"
            >
              Usar padrão
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="label block">Status do orçamento</span>
              <select className="input" value={quoteStatus} onChange={(event) => setQuoteStatus(event.target.value)}>
                {quoteStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label block">Forma de pagamento</span>
              <textarea
                className="input min-h-20 resize-none"
                value={commercialTerms.payment_terms}
                onChange={(event) => updateCommercialTerm("payment_terms", event.target.value)}
                placeholder="Ex.: 50% na aprovação e 50% na conclusão."
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label block">Entrada em valor</span>
                <input className="input" inputMode="decimal" value={commercialTerms.down_payment_value} onChange={(event) => updateCommercialTerm("down_payment_value", event.target.value)} placeholder="Ex.: 500,00" />
              </label>
              <label className="block">
                <span className="label block">Entrada em %</span>
                <input className="input" inputMode="decimal" value={commercialTerms.down_payment_percent} onChange={(event) => updateCommercialTerm("down_payment_percent", event.target.value)} placeholder="Ex.: 30" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label block">Validade em dias</span>
                <input className="input" inputMode="numeric" value={commercialTerms.validity_days} onChange={(event) => updateCommercialTerm("validity_days", event.target.value)} placeholder="Ex.: 7" />
              </label>
              <label className="block">
                <span className="label block">Prazo de execução</span>
                <input className="input" value={commercialTerms.execution_deadline} onChange={(event) => updateCommercialTerm("execution_deadline", event.target.value)} placeholder="Ex.: 3 dias úteis" />
              </label>
            </div>

            <label className="block">
              <span className="label block">Observações comerciais</span>
              <textarea
                className="input min-h-20 resize-none"
                value={commercialTerms.commercial_notes}
                onChange={(event) => updateCommercialTerm("commercial_notes", event.target.value)}
                placeholder="Ex.: Valores sujeitos à confirmação após vistoria."
              />
            </label>

            <label className="block">
              <span className="label block">Texto de aprovação</span>
              <textarea
                className="input min-h-20 resize-none"
                value={commercialTerms.approval_text}
                onChange={(event) => updateCommercialTerm("approval_text", event.target.value)}
                placeholder="Ex.: A execução será agendada após aprovação e confirmação da entrada."
              />
            </label>

            <label className="block">
              <span className="label block">Garantia e condições</span>
              <textarea
                className="input min-h-20 resize-none"
                value={commercialTerms.warranty_text}
                onChange={(event) => updateCommercialTerm("warranty_text", event.target.value)}
                placeholder="Ex.: Garantia conforme serviço executado e condições da obra."
              />
            </label>

            <label className="block">
              <span className="label block">Observações técnicas / instruções da obra</span>
              <textarea
                className="input min-h-24 resize-none"
                value={technicalNotes}
                onChange={(event) => setTechnicalNotes(event.target.value)}
                placeholder="Ex.: Base precisa estar limpa, seca, firme e nivelada. Remoção de móveis não inclusa. Execução conforme condições verificadas em obra."
              />
            </label>
          </div>
        </div>

        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={saveDraft} disabled={isSaving} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-60">
            {isSaving ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button type="button" onClick={generatePreview} disabled={isSaving} className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
            {isSaving ? "Gerando..." : "Gerar PDF"}
          </button>
        </div>
        {savedBudgetId ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/orcamentos" className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
              Ir para Orçamentos
            </Link>
            <Link href={`/orcamentos/${savedBudgetId}/proposta`} className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Abrir proposta
            </Link>
          </div>
        ) : null}

        {showPreview ? (
          <div ref={previewSectionRef} className="card mt-5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Prévia do orçamento</p>
            <h2 className="mt-2 text-xl font-black text-graphite">{client.name || "Cliente não informado"}</h2>
            <p className="mt-1 text-sm text-cement">{client.phone || "Telefone não informado"}</p>
            <p className="text-sm text-cement">{client.email || "E-mail não informado"}</p>
            <p className="text-sm text-cement">{client.address || "Endereço não informado"}</p>
            <div className="mt-4 space-y-2">
              {quoteItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 border-b border-black/10 pb-2 text-sm">
                  <span className="font-bold text-cement">{item.name}</span>
                  <span className="font-black text-graphite">{currencyBRL(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xl font-black text-graphite">
              <span>Total</span>
              <span>{currencyBRL(total)}</span>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

export default function NewBudgetPage() {
  return (
    <Suspense fallback={null}>
      <NewBudgetContent />
    </Suspense>
  );
}
