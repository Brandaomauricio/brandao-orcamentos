"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { recentBudgets } from "@/data/mock";

type Client = {
  id: number;
  name: string;
  whatsapp: string;
  email: string;
  address: string;
};

export default function ClientsPage() {
  const initialClients = recentBudgets.map((budget, index) => ({
    id: index + 1,
    name: budget.client,
    whatsapp: "",
    email: "",
    address: `Último orçamento: ${budget.date}`,
  }));
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", address: "" });
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] ?? null);
  const [message, setMessage] = useState("");

  function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.whatsapp.trim()) {
      setMessage("Preencha nome e WhatsApp para salvar o cliente");
      return;
    }

    const client = {
      id: Date.now(),
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    setClients((current) => [client, ...current]);
    setSelectedClient(client);
    setForm({ name: "", whatsapp: "", email: "", address: "" });
    setMessage("Cliente salvo com sucesso");
  }

  return (
    <AppShell>
      <AppHeader title="Clientes" subtitle="Consulte contatos, obras e propostas recentes." />
      <section className="px-5">
        <form onSubmit={saveClient} className="card p-4">
          <h2 className="text-lg font-black text-graphite">Novo cliente</h2>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Nome do cliente" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="input" placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
            <input className="input" placeholder="E-mail opcional" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="input" placeholder="Endereço opcional" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </div>
          <button type="submit" className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
            Salvar Cliente
          </button>
        </form>
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        <div className="mt-5 space-y-3">
          {clients.map((client) => (
            <button key={client.id} type="button" onClick={() => setSelectedClient(client)} className="card block w-full p-4 text-left">
              <h2 className="font-black text-graphite">{client.name}</h2>
              <p className="mt-1 text-sm text-cement">{client.whatsapp || "WhatsApp não informado"}</p>
              <p className="mt-1 text-sm font-bold text-wood">{client.address || "Endereço não informado"}</p>
            </button>
          ))}
        </div>
        {selectedClient ? (
          <div className="card mt-5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Detalhes</p>
            <h2 className="mt-2 text-xl font-black text-graphite">{selectedClient.name}</h2>
            <p className="mt-1 text-sm text-cement">WhatsApp: {selectedClient.whatsapp || "não informado"}</p>
            <p className="mt-1 text-sm text-cement">E-mail: {selectedClient.email || "não informado"}</p>
            <p className="mt-1 text-sm text-cement">Endereço: {selectedClient.address || "não informado"}</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
