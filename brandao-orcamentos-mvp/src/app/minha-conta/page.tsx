"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type ProfileForm = {
  professional_name: string;
  responsible_name: string;
  whatsapp: string;
  email: string;
  instagram: string;
  address: string;
  city: string;
  state: string;
  document_number: string;
  signature_text: string;
  logo_url: string;
  default_payment_terms: string;
  default_down_payment_value: string;
  default_down_payment_percent: string;
  default_quote_validity_days: string;
  default_execution_deadline: string;
  default_commercial_notes: string;
  default_approval_text: string;
  default_warranty_text: string;
};

type ProfileRow = ProfileForm & {
  id: string;
  user_id: string;
  city_state?: string | null;
  document?: string | null;
  institutional_note?: string | null;
  current_plan?: string | null;
};

type AccountSection = {
  id: string;
  title: string;
  description: string;
};

const emptyProfile: ProfileForm = {
  professional_name: "",
  responsible_name: "",
  whatsapp: "",
  email: "",
  instagram: "",
  address: "",
  city: "",
  state: "",
  document_number: "",
  signature_text: "",
  logo_url: "",
  default_payment_terms: "",
  default_down_payment_value: "",
  default_down_payment_percent: "",
  default_quote_validity_days: "",
  default_execution_deadline: "",
  default_commercial_notes: "",
  default_approval_text: "",
  default_warranty_text: "",
};

const sections: AccountSection[] = [
  { id: "perfil", title: "Perfil profissional", description: "Dados que aparecem na proposta e no PDF." },
  { id: "identidade", title: "Identidade do orçamento", description: "Logo e apresentação visual." },
  { id: "comerciais", title: "Dados comerciais", description: "Padrões de pagamento, garantia e prazos." },
  { id: "servicos", title: "Meus serviços", description: "Tabela de serviços e valores." },
  { id: "textos", title: "Modelos de texto", description: "Mensagens e observações prontas." },
  { id: "preferencias", title: "Preferências do app", description: "Configurações de uso." },
  { id: "plano", title: "Plano atual", description: "Informações da assinatura." },
];

const LOGO_BUCKET = "profile-logos";
const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function valueOrEmpty(value: string | null | undefined) {
  return value ?? "";
}

function trimToNull(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function splitCityState(cityState: string | null | undefined) {
  const [city = "", state = ""] = (cityState ?? "").split("/").map((part) => part.trim());
  return { city, state };
}

function DefaultAccountLogo() {
  return (
    <div className="flex h-28 w-full flex-col items-center justify-center rounded-xl border border-black/10 bg-technical px-3 text-center">
      <span className="text-2xl font-black leading-none text-graphite">Obra Fechada</span>
      <span className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-wood">por Brandão</span>
    </div>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [activeSection, setActiveSection] = useState("perfil");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`user_id.eq.${currentUser.id},id.eq.${currentUser.id}`)
      .limit(1);

    if (error) {
      console.error("Erro ao carregar perfil profissional:", error);
      setMessage("Não foi possível carregar seus dados profissionais agora. Tente novamente em instantes.");
      return;
    }

    const profile = (data?.[0] as ProfileRow | undefined) ?? null;
    const fallbackLocation = splitCityState(profile?.city_state);
    setProfileId(profile?.id ?? null);
    setCurrentPlan(profile?.current_plan ?? "free");
    setForm({
      professional_name: valueOrEmpty(profile?.professional_name),
      responsible_name: valueOrEmpty(profile?.responsible_name),
      whatsapp: valueOrEmpty(profile?.whatsapp),
      email: valueOrEmpty(profile?.email),
      instagram: valueOrEmpty(profile?.instagram),
      address: valueOrEmpty(profile?.address),
      city: valueOrEmpty(profile?.city || fallbackLocation.city),
      state: valueOrEmpty(profile?.state || fallbackLocation.state),
      document_number: valueOrEmpty(profile?.document_number || profile?.document),
      signature_text: valueOrEmpty(profile?.signature_text || profile?.institutional_note),
      logo_url: valueOrEmpty(profile?.logo_url),
      default_payment_terms: valueOrEmpty(profile?.default_payment_terms),
      default_down_payment_value: valueOrEmpty(profile?.default_down_payment_value),
      default_down_payment_percent: valueOrEmpty(profile?.default_down_payment_percent),
      default_quote_validity_days: valueOrEmpty(profile?.default_quote_validity_days),
      default_execution_deadline: valueOrEmpty(profile?.default_execution_deadline),
      default_commercial_notes: valueOrEmpty(profile?.default_commercial_notes),
      default_approval_text: valueOrEmpty(profile?.default_approval_text),
      default_warranty_text: valueOrEmpty(profile?.default_warranty_text),
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local para acessar sua conta.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        setMessage("Não foi possível verificar sua conta agora.");
      }

      setUser(data.user);
      if (data.user) {
        await loadProfile(data.user);
      } else {
        setMessage("Entre na sua conta para editar seus dados profissionais.");
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfileId(null);
        setForm(emptyProfile);
        setMessage("Entre na sua conta para editar seus dados profissionais.");
      } else {
        loadProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveLogoUrl(currentUser: User, logoUrl: string | null) {
    const city = form.city.trim() || "Não informado";
    const state = form.state.trim().toUpperCase() || "BR";
    const updatedAt = new Date().toISOString();
    const payload = {
      id: currentUser.id,
      user_id: currentUser.id,
      professional_name: form.professional_name.trim() || "Obra Fechada",
      responsible_name: trimToNull(form.responsible_name),
      whatsapp: form.whatsapp.trim() || "Não informado",
      email: trimToNull(form.email),
      instagram: trimToNull(form.instagram),
      address: trimToNull(form.address),
      city,
      state,
      city_state: `${city}/${state}`,
      document: trimToNull(form.document_number),
      document_number: trimToNull(form.document_number),
      institutional_note: trimToNull(form.signature_text),
      signature_text: trimToNull(form.signature_text),
      logo_url: logoUrl,
      updated_at: updatedAt,
    };

    let { data: savedProfile, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao salvar logo por user_id:", error);
      const retryResult = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select("id").single();
      savedProfile = retryResult.data;
      error = retryResult.error;
    }

    if (error || !savedProfile) {
      console.error("Erro ao salvar logo no perfil:", error);
      throw new Error("Não foi possível salvar a logo no perfil agora.");
    }

    setProfileId(savedProfile.id);
  }

  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local para enviar sua logo.");
      return;
    }

    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setMessage("Escolha uma imagem em PNG, JPG, JPEG ou WEBP.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Erro ao verificar usuário antes de enviar logo:", authError);
      setMessage("Não foi possível verificar sua conta agora. Tente novamente em instantes.");
      return;
    }

    if (!user) {
      setMessage("Entre na sua conta para enviar sua logo.");
      return;
    }

    setIsLogoUploading(true);
    setMessage("Enviando sua logo...");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${user.id}/logo-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });

      if (uploadError) {
        console.error("Erro ao enviar logo:", uploadError);
        setMessage(`Não foi possível enviar a logo. Confira se o bucket "${LOGO_BUCKET}" existe no Supabase Storage e tente novamente.`);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
      await saveLogoUrl(user, publicUrlData.publicUrl);
      setForm((current) => ({ ...current, logo_url: publicUrlData.publicUrl }));
      setMessage("Logo enviada e salva com sucesso.");
    } catch (error) {
      console.error("Erro inesperado ao enviar logo:", error);
      setMessage("Não foi possível enviar sua logo agora. Tente novamente em instantes.");
    } finally {
      setIsLogoUploading(false);
    }
  }

  async function removeLogo() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local para remover sua logo.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Erro ao verificar usuário antes de remover logo:", authError);
      setMessage("Não foi possível verificar sua conta agora. Tente novamente em instantes.");
      return;
    }

    if (!user) {
      setMessage("Entre na sua conta para remover sua logo.");
      return;
    }

    setIsLogoUploading(true);
    setMessage("");

    try {
      await saveLogoUrl(user, null);
      setForm((current) => ({ ...current, logo_url: "" }));
      setMessage("Logo removida. A proposta voltou para a marca padrão Obra Fechada por Brandão.");
    } catch (error) {
      console.error("Erro inesperado ao remover logo:", error);
      setMessage("Não foi possível remover sua logo agora. Tente novamente em instantes.");
    } finally {
      setIsLogoUploading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local para salvar seus dados profissionais.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Erro ao verificar usuário antes de salvar perfil:", authError);
      setMessage("Não foi possível verificar sua conta agora. Tente novamente em instantes.");
      return;
    }

    if (!user) {
      setMessage("Entre na sua conta para salvar seus dados profissionais.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const city = form.city.trim() || "Não informado";
    const state = form.state.trim().toUpperCase() || "BR";
    const document = trimToNull(form.document_number);
    const institutionalNote = trimToNull(form.signature_text);
    const logoUrl = trimToNull(form.logo_url);
    const updatedAt = new Date().toISOString();

    const professionalPayload = {
      id: user.id,
      user_id: user.id,
      professional_name: form.professional_name.trim() || "Obra Fechada",
      responsible_name: trimToNull(form.responsible_name),
      whatsapp: form.whatsapp.trim() || "Não informado",
      email: trimToNull(form.email),
      instagram: trimToNull(form.instagram),
      address: trimToNull(form.address),
      city,
      state,
      city_state: `${city}/${state}`,
      document,
      document_number: document,
      institutional_note: institutionalNote,
      signature_text: institutionalNote,
      logo_url: logoUrl,
      updated_at: updatedAt,
    };

    const commercialPayload = {
      id: user.id,
      user_id: user.id,
      professional_name: form.professional_name.trim() || "Obra Fechada",
      responsible_name: trimToNull(form.responsible_name),
      whatsapp: form.whatsapp.trim() || "Não informado",
      email: trimToNull(form.email),
      instagram: trimToNull(form.instagram),
      address: trimToNull(form.address),
      city,
      state,
      city_state: `${city}/${state}`,
      document,
      document_number: document,
      institutional_note: institutionalNote,
      signature_text: institutionalNote,
      logo_url: logoUrl,
      default_payment_terms: form.default_payment_terms.trim() || null,
      default_down_payment_value: form.default_down_payment_value.trim() || null,
      default_down_payment_percent: form.default_down_payment_percent.trim() || null,
      default_quote_validity_days: form.default_quote_validity_days.trim() || null,
      default_execution_deadline: form.default_execution_deadline.trim() || null,
      default_commercial_notes: form.default_commercial_notes.trim() || null,
      default_approval_text: form.default_approval_text.trim() || null,
      default_warranty_text: form.default_warranty_text.trim() || null,
      updated_at: updatedAt,
    };

    const payload = activeSection === "comerciais" ? commercialPayload : professionalPayload;

    try {
      let { data: savedProfile, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select("id")
        .single();

      if (error) {
        console.error("Erro ao salvar perfil profissional por user_id:", error);
        const retryResult = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select("id").single();
        savedProfile = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("Erro ao salvar perfil profissional:", error);
        setMessage("Não foi possível salvar seus dados profissionais agora. Tente novamente em instantes.");
        return;
      }

      if (!savedProfile) {
        setMessage("Não foi possível confirmar o salvamento agora. Tente novamente em instantes.");
        return;
      }

      setProfileId(savedProfile.id);
      setForm((current) => ({
        ...current,
        state: payload.state,
        professional_name: payload.professional_name,
      }));
      setMessage(activeSection === "comerciais" ? "Condições comerciais salvas com sucesso." : "Dados profissionais salvos com sucesso.");
    } catch (error) {
      console.error("Erro inesperado ao salvar perfil profissional:", error);
      setMessage("Não foi possível salvar seus dados profissionais agora. Tente novamente em instantes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao sair da conta:", error);
    setMessage(error ? "Não foi possível sair da conta agora." : "Você saiu da sua conta.");
  }

  function openSection(sectionId: string) {
    setActiveSection(sectionId);
    if (!user) {
      setMessage("Entre na sua conta para editar seus dados profissionais.");
    } else if (sectionId !== "perfil" && sectionId !== "identidade" && sectionId !== "comerciais" && sectionId !== "servicos" && sectionId !== "textos" && sectionId !== "preferencias" && sectionId !== "plano") {
      setMessage("Esta área está em desenvolvimento.");
    } else {
      setMessage("");
    }
  }

  return (
    <AppShell>
      <AppHeader title="Minha Conta" subtitle="Acesse login, dados profissionais e configurações do instalador." />
      <section className="px-5">
        {!isLoading && !user ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Área do Instalador</h2>
            <p className="mt-1 text-sm text-cement">Entre para salvar clientes, orçamentos e compromissos com segurança.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar ou criar conta
            </Link>
          </div>
        ) : null}

        {user ? (
          <div className="card p-4">
            <p className="text-sm font-bold text-cement">Conta conectada</p>
            <h2 className="mt-1 break-words text-lg font-black text-graphite">{user.email}</h2>
            <p className="mt-1 text-sm text-cement">Dados profissionais e configurações ficam vinculados a este acesso.</p>
            <button type="button" onClick={signOut} className="mt-4 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
              Sair
            </button>
          </div>
        ) : null}

        {isLoading ? <div className="card p-4 text-sm font-black text-cement">Verificando conta...</div> : null}
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}

        <div className="mt-4 space-y-3">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => openSection(section.id)}
              className={`card flex w-full items-center justify-between p-4 text-left ${activeSection === section.id ? "border-warning" : ""}`}
            >
              <div>
                <h3 className="font-black text-graphite">{section.title}</h3>
                <p className="text-sm text-cement">{section.description}</p>
              </div>
              <span className="text-xl font-black text-wood">›</span>
            </button>
          ))}
        </div>

        <section className="mt-4 card p-4">
          {activeSection === "perfil" ? (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Perfil profissional</p>
                <h2 className="mt-1 text-xl font-black text-graphite">Dados do instalador</h2>
                <p className="mt-1 text-sm text-cement">Estas informações aparecem automaticamente na proposta e no PDF.</p>
              </div>

              <label className="block">
                <span className="label block">Nome profissional ou empresa</span>
                <input className="input" value={form.professional_name} onChange={(event) => updateField("professional_name", event.target.value)} placeholder="Ex.: Sua empresa de instalação" />
              </label>

              <label className="block">
                <span className="label block">Nome do responsável</span>
                <input className="input" value={form.responsible_name} onChange={(event) => updateField("responsible_name", event.target.value)} placeholder="Ex.: Nome do responsável" />
              </label>

              <label className="block">
                <span className="label block">WhatsApp</span>
                <input className="input" value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} placeholder="(00) 00000-0000" />
              </label>

              <label className="block">
                <span className="label block">E-mail</span>
                <input className="input" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="contato@empresa.com.br" />
              </label>

              <label className="block">
                <span className="label block">Instagram ou site</span>
                <input className="input" value={form.instagram} onChange={(event) => updateField("instagram", event.target.value)} placeholder="@suaempresa ou site.com.br" />
              </label>

              <label className="block">
                <span className="label block">Endereço profissional</span>
                <input className="input" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Rua, número, bairro" />
              </label>

              <div className="grid grid-cols-[1fr_92px] gap-3">
                <label className="block">
                  <span className="label block">Cidade</span>
                  <input className="input" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Cidade" />
                </label>
                <label className="block">
                  <span className="label block">UF</span>
                  <input className="input uppercase" maxLength={2} value={form.state} onChange={(event) => updateField("state", event.target.value)} placeholder="UF" />
                </label>
              </div>

              <label className="block">
                <span className="label block">Documento profissional</span>
                <input className="input" value={form.document_number} onChange={(event) => updateField("document_number", event.target.value)} placeholder="CNPJ, CPF, MEI ou registro" />
              </label>

              <label className="block">
                <span className="label block">Observação institucional curta</span>
                <textarea
                  className="input min-h-24 resize-none"
                  maxLength={180}
                  value={form.signature_text}
                  onChange={(event) => updateField("signature_text", event.target.value)}
                  placeholder="Ex.: Instalação profissional de pisos vinílicos e laminados."
                />
              </label>

              <button type="submit" disabled={isSaving} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
                {isSaving ? "Salvando..." : "Salvar dados profissionais"}
              </button>
            </form>
          ) : activeSection === "identidade" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Identidade do orçamento</p>
                <h2 className="mt-1 text-xl font-black text-graphite">Logo da proposta</h2>
                <p className="mt-1 text-sm text-cement">Envie uma imagem da sua marca. Se não houver logo salva, a proposta usa Obra Fechada por Brandão.</p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-cement">Prévia da logo</p>
                {form.logo_url ? (
                  <div className="flex h-32 items-center justify-center rounded-xl bg-technical p-3">
                    <img src={form.logo_url} alt="Logo salva" className="max-h-full max-w-full rounded-md object-contain" />
                  </div>
                ) : (
                  <DefaultAccountLogo />
                )}
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseLogo}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isLogoUploading}
                className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60"
              >
                {isLogoUploading ? "Enviando..." : "Escolher imagem"}
              </button>

              <button
                type="button"
                onClick={removeLogo}
                disabled={isLogoUploading || !form.logo_url}
                className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-50"
              >
                Remover logo
              </button>
            </div>
          ) : activeSection === "comerciais" ? (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Condições comerciais</p>
                <h2 className="mt-1 text-xl font-black text-graphite">Padrões do orçamento</h2>
                <p className="mt-1 text-sm text-cement">Esses textos entram como padrão no novo orçamento e podem ser ajustados antes de salvar.</p>
              </div>

              <label className="block">
                <span className="label block">Forma de pagamento padrão</span>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.default_payment_terms}
                  onChange={(event) => updateField("default_payment_terms", event.target.value)}
                  placeholder="Ex.: 50% na aprovação e 50% na conclusão do serviço."
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label block">Entrada em valor</span>
                  <input className="input" inputMode="decimal" value={form.default_down_payment_value} onChange={(event) => updateField("default_down_payment_value", event.target.value)} placeholder="Ex.: 500,00" />
                </label>
                <label className="block">
                  <span className="label block">Entrada em %</span>
                  <input className="input" inputMode="decimal" value={form.default_down_payment_percent} onChange={(event) => updateField("default_down_payment_percent", event.target.value)} placeholder="Ex.: 30" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label block">Validade padrão em dias</span>
                  <input className="input" inputMode="numeric" value={form.default_quote_validity_days} onChange={(event) => updateField("default_quote_validity_days", event.target.value)} placeholder="Ex.: 7" />
                </label>
                <label className="block">
                  <span className="label block">Prazo de execução</span>
                  <input className="input" value={form.default_execution_deadline} onChange={(event) => updateField("default_execution_deadline", event.target.value)} placeholder="Ex.: 3 dias úteis" />
                </label>
              </div>

              <label className="block">
                <span className="label block">Observações comerciais padrão</span>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.default_commercial_notes}
                  onChange={(event) => updateField("default_commercial_notes", event.target.value)}
                  placeholder="Ex.: Valores sujeitos à confirmação após vistoria e condições da obra."
                />
              </label>

              <label className="block">
                <span className="label block">Texto de aprovação da proposta</span>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.default_approval_text}
                  onChange={(event) => updateField("default_approval_text", event.target.value)}
                  placeholder="Ex.: A execução será agendada após aprovação da proposta e confirmação da entrada."
                />
              </label>

              <label className="block">
                <span className="label block">Garantia e condições</span>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.default_warranty_text}
                  onChange={(event) => updateField("default_warranty_text", event.target.value)}
                  placeholder="Ex.: Garantia conforme serviço executado, materiais aplicados e condições verificadas em obra."
                />
              </label>

              <button type="submit" disabled={isSaving} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
                {isSaving ? "Salvando..." : "Salvar condições comerciais"}
              </button>
            </form>
          ) : activeSection === "servicos" ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Meus serviços</p>
              <h2 className="mt-1 text-xl font-black text-graphite">Serviços padrão</h2>
              <p className="mt-2 text-sm leading-6 text-cement">Cadastre serviços, unidades e preços para reutilizar nos orçamentos.</p>
              <Link href="/ferramentas/meus-servicos" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
                Abrir meus serviços
              </Link>
            </div>
          ) : activeSection === "plano" ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Plano atual</p>
              <h2 className="mt-1 text-xl font-black text-graphite">{currentPlan === "pro" ? "Pró" : currentPlan === "aluno" ? "Aluno" : "Grátis"}</h2>
              <p className="mt-2 text-sm leading-6 text-cement">Pagamento e bloqueio de recursos serão implementados em uma próxima versão.</p>
              <Link href="/planos" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
                Ver planos
              </Link>
            </div>
          ) : activeSection === "textos" ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Modelos de texto</p>
              <h2 className="mt-1 text-xl font-black text-graphite">Mensagens e observacoes prontas</h2>
              <p className="mt-2 text-sm leading-6 text-cement">Acesse modelos para copiar textos ou enviar observacoes e condicoes para o proximo orcamento.</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Link href="/ferramentas/modelos-de-mensagens" className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Abrir mensagens</Link>
                <Link href="/ferramentas/observacoes-tecnicas" className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Abrir observacoes tecnicas</Link>
                <Link href="/ferramentas/condicoes-comerciais" className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Abrir condicoes comerciais</Link>
              </div>
            </div>
          ) : activeSection === "preferencias" ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Preferencias do app</p>
              <h2 className="mt-1 text-xl font-black text-graphite">Ajustes para uso no beta</h2>
              <p className="mt-2 text-sm leading-6 text-cement">Nesta versao, as preferencias praticas ficam nas ferramentas de apoio e no tutorial.</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Link href="/ferramentas/checklists" className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Abrir checklists</Link>
                <Link href="/tutorial-e-dicas" className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Abrir tutorial e dicas</Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">{sections.find((section) => section.id === activeSection)?.title}</p>
              <h2 className="mt-1 text-xl font-black text-graphite">Em desenvolvimento</h2>
              <p className="mt-2 text-sm leading-6 text-cement">Esta seção já está preparada para receber os próximos ajustes. Por enquanto, o perfil profissional é a área funcional desta tela.</p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
