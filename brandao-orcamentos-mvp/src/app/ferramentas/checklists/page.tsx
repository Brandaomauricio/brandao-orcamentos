"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";

const items = ["Medidas conferidas", "Base avaliada", "Materiais confirmados", "Prazo combinado", "Condições comerciais revisadas"];

export default function ChecklistsPage() {
  const [checked, setChecked] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("brandao_checklist");
    if (saved) setChecked(JSON.parse(saved));
  }, []);

  function toggle(item: string) {
    const next = checked.includes(item) ? checked.filter((value) => value !== item) : [...checked, item];
    setChecked(next);
    window.localStorage.setItem("brandao_checklist", JSON.stringify(next));
    setMessage("Checklist atualizado neste aparelho.");
  }

  function clearChecklist() {
    setChecked([]);
    window.localStorage.removeItem("brandao_checklist");
    setMessage("Checklist limpo.");
  }

  return (
    <AppShell>
      <AppHeader title="Checklists" subtitle="Pontos essenciais para visita técnica e instalação." />
      <section className="space-y-3 px-5">
        {items.map((item) => (
          <label key={item} className="card flex items-center gap-3 p-4 text-sm font-black text-graphite">
            <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} className="h-5 w-5 accent-warning" />
            {item}
          </label>
        ))}
        <button type="button" onClick={clearChecklist} className="block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Limpar checklist</button>
        {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
      </section>
    </AppShell>
  );
}
