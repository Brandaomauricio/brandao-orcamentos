"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Service = {
  id: string;
  name: string;
  unit: string | null;
  default_price: number | null;
  category: string | null;
  description: string | null;
  active: boolean | null;
};

const unitOptions = ["m²", "m", "unidade", "diária", "serviço"];
const categories = ["instalação", "regularização", "rodapé", "remoção", "logística", "limpeza", "serviço periférico", "outro"];
const emptyForm = { name: "", unit: "m²", default_price: "", category: "instalação", description: "", active: true };

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function MyServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState("");

  const loadServices = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id,name,unit,default_price,category,description,active")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar serviços:", error);
      setMessage("Não foi possível carregar seus serviços agora.");
    } else {
      setServices((data ?? []) as Service[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Erro ao verificar usuário em serviços:", error);
      setUser(data.user);
      if (data.user) loadServices(data.user);
      else setIsLoading(false);
    });
  }, [loadServices]);

  async function saveService() {
    if (!user) {
      setMessage("Entre na sua conta para salvar serviços.");
      return;
    }
    if (!form.name.trim()) {
      setMessage("Informe o nome do serviço.");
      return;
    }

    setIsSaving(true);
    const price = parseMoney(form.default_price);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      unit: form.unit,
      default_price: price || null,
      category: form.category,
      description: form.description.trim() || null,
      default_description: form.description.trim() || null,
      active: form.active,
      is_active: form.active,
      updated_at: new Date().toISOString(),
    };
    const query = editingId ? supabase.from("services").update(payload).eq("id", editingId).eq("user_id", user.id) : supabase.from("services").insert(payload);
    const { error } = await query;

    if (error) {
      console.error("Erro ao salvar serviço:", error);
      setMessage("Não foi possível salvar o serviço agora.");
    } else {
      setMessage(editingId ? "Serviço atualizado." : "Serviço salvo.");
      setForm(emptyForm);
      setEditingId("");
      await loadServices(user);
      setActionId("");
    }
    setIsSaving(false);
  }

  async function toggleService(service: Service) {
    if (!user) return;
    setActionId(`toggle-${service.id}`);
    const { error } = await supabase
      .from("services")
      .update({ active: !service.active, is_active: !service.active, updated_at: new Date().toISOString() })
      .eq("id", service.id)
      .eq("user_id", user.id);
    if (error) {
      console.error("Erro ao alterar serviço:", error);
      setMessage("Não foi possível alterar o serviço agora.");
    } else {
      setMessage(service.active ? "Serviço inativado." : "Serviço ativado.");
      await loadServices(user);
    }
    setActionId("");
  }

  async function deleteService(service: Service) {
    if (!user || !window.confirm("Excluir este serviço padrão?")) return;
    setActionId(`delete-${service.id}`);
    const { error } = await supabase.from("services").delete().eq("id", service.id).eq("user_id", user.id);
    if (error) {
      console.error("Erro ao excluir serviço:", error);
      setMessage("Não foi possível excluir o serviço agora.");
    } else {
      setMessage("Serviço excluído.");
      await loadServices(user);
    }
    setActionId("");
  }

  function editService(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      unit: service.unit || "serviço",
      default_price: service.default_price ? String(service.default_price).replace(".", ",") : "",
      category: service.category || "outro",
      description: service.description || "",
      active: service.active ?? true,
    });
    setMessage("Edite o serviço e salve as alterações.");
  }

  return (
    <AppShell>
      <AppHeader title="Meus serviços" subtitle="Cadastre serviços padrão para reutilizar nos orçamentos." />
      <section className="space-y-4 px-5">
        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">{editingId ? "Editar serviço" : "Novo serviço padrão"}</h2>
          <div className="mt-4 space-y-3">
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do serviço" />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>{unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
              <input className="input" inputMode="decimal" value={form.default_price} onChange={(event) => setForm({ ...form, default_price: event.target.value })} placeholder="Preço padrão" />
            </div>
            <select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <textarea className="input min-h-24 resize-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descrição técnica" />
            <label className="flex items-center gap-3 text-sm font-black text-graphite"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativo</label>
          </div>
          <button type="button" disabled={isSaving} onClick={saveService} className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">{isSaving ? "Salvando..." : editingId ? "Atualizar serviço" : "Salvar serviço"}</button>
        </div>

        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando serviços...</div> : null}
        {!isLoading && !services.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum serviço padrão cadastrado ainda.</div> : null}

        {services.map((service) => (
          <div key={service.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-graphite">{service.name}</h3>
                <p className="mt-1 text-sm text-cement">{service.category || "sem categoria"} · {service.unit || "serviço"} · {currencyBRL(Number(service.default_price ?? 0))}</p>
                {service.description ? <p className="mt-2 text-sm text-cement">{service.description}</p> : null}
              </div>
              <span className="rounded-full bg-technical px-3 py-1 text-[11px] font-black text-cement">{service.active ? "ativo" : "inativo"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black">
              <button type="button" onClick={() => editService(service)} className="rounded-xl bg-warning py-2 text-graphite">Editar</button>
              <button type="button" disabled={actionId === `toggle-${service.id}`} onClick={() => toggleService(service)} className="rounded-xl bg-technical py-2 text-graphite disabled:opacity-60">{actionId === `toggle-${service.id}` ? "Alterando..." : service.active ? "Inativar" : "Ativar"}</button>
              <button type="button" disabled={actionId === `delete-${service.id}`} onClick={() => deleteService(service)} className="rounded-xl bg-technical py-2 text-graphite disabled:opacity-60">{actionId === `delete-${service.id}` ? "Excluindo..." : "Excluir"}</button>
              <Link href="/orcamentos/novo" className="rounded-xl bg-technical py-2 text-graphite">Usar em orçamento</Link>
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
