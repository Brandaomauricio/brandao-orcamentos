"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const suggestions = [
  "movimentação de móveis",
  "subida de material",
  "retirada de rodapé antigo",
  "limpeza técnica da base",
  "descarte de entulho",
  "deslocamento",
  "busca de material",
  "preparação adicional de base",
];

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function PeripheralServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: suggestions[0], unit: "serviço", price: "", quantity: "1" });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const total = parseMoney(form.price) * (parseMoney(form.quantity) || 1);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Erro ao verificar usuário em serviços periféricos:", error);
      setUser(data.user);
    });
  }, []);

  function addToBudget() {
    if (!form.name.trim()) {
      setMessage("Informe o nome do serviço periférico.");
      return;
    }
    window.localStorage.setItem("brandao_pending_service", JSON.stringify(form));
    setMessage("Serviço preparado. Abra um orçamento para adicionar e ajustar os valores.");
  }

  async function saveAsDefault() {
    if (!user) {
      setMessage("Entre na sua conta para salvar como serviço padrão.");
      return;
    }
    if (!form.name.trim()) {
      setMessage("Informe o nome do serviço.");
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      name: form.name.trim(),
      unit: form.unit || "serviço",
      default_price: parseMoney(form.price) || null,
      category: "serviço periférico",
      description: "Serviço adicional sugerido pelas ferramentas do app.",
      default_description: "Serviço adicional sugerido pelas ferramentas do app.",
      active: true,
      is_active: true,
    });
    if (error) {
      console.error("Erro ao salvar serviço periférico:", error);
      setMessage("Não foi possível salvar o serviço padrão agora.");
    } else {
      setMessage("Serviço salvo como padrão.");
    }
    setIsSaving(false);
  }

  return (
    <AppShell>
      <AppHeader title="Serviços periféricos" subtitle="Itens adicionais que podem entrar no orçamento." />
      <section className="space-y-4 px-5">
        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">Montar serviço adicional</h2>
          <div className="mt-4 space-y-3">
            <select className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}>
              {suggestions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do serviço" />
            <div className="grid grid-cols-3 gap-2">
              <input className="input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="Unidade" />
              <input className="input" inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Preço" />
              <input className="input" inputMode="decimal" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Qtd." />
            </div>
          </div>
          <div className="mt-4 flex justify-between rounded-2xl bg-technical p-4 text-sm font-black text-graphite">
            <span>Total previsto</span>
            <span>{currencyBRL(total)}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm font-black">
            <button type="button" onClick={addToBudget} className="rounded-2xl bg-warning px-4 py-3 text-graphite shadow-soft">Adicionar ao orçamento</button>
            <button type="button" disabled={isSaving} onClick={saveAsDefault} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite disabled:opacity-60">{isSaving ? "Salvando..." : "Salvar padrão"}</button>
          </div>
          <Link href="/orcamentos/novo" className="mt-3 block rounded-2xl border border-black/10 bg-white px-4 py-3 text-center text-sm font-black text-graphite">Abrir novo orçamento</Link>
        </div>
        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
      </section>
    </AppShell>
  );
}
