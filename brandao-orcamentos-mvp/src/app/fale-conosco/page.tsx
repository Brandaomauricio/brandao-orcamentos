"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [notice, setNotice] = useState("");

  function registerMessage() {
    if (!form.name.trim() || !form.message.trim()) {
      setNotice("Informe seu nome e mensagem.");
      return;
    }
    window.localStorage.setItem("brandao_last_contact", JSON.stringify({ ...form, created_at: new Date().toISOString() }));
    setNotice("Mensagem registrada localmente. Em breve teremos envio automático.");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <AppShell>
      <AppHeader title="Fale conosco" subtitle="Precisa de ajuda? Tire dúvidas, envie sugestões ou fale sobre parcerias." />
      <section className="space-y-4 px-5">
        <div className="grid grid-cols-1 gap-3">
          <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="card block p-4">
            <h3 className="text-base font-black text-graphite">WhatsApp de suporte</h3>
            <p className="mt-1 text-sm leading-5 text-cement">Abrir conversa no WhatsApp.</p>
          </a>
          <a href="mailto:suporte@brandaoorcamentos.com.br?subject=Suporte%20Obra%20Fechada" className="card block p-4">
            <h3 className="text-base font-black text-graphite">E-mail de suporte</h3>
            <p className="mt-1 text-sm leading-5 text-cement">Enviar mensagem pelo seu aplicativo de e-mail.</p>
          </a>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">Mensagem rápida</h2>
          <div className="mt-4 space-y-3">
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Seu nome" />
            <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Seu e-mail" />
            <textarea className="input min-h-32 resize-none" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Escreva sua mensagem" />
          </div>
          <button type="button" onClick={registerMessage} className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Registrar mensagem</button>
        </div>
        {notice ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{notice}</div> : null}
      </section>
    </AppShell>
  );
}
