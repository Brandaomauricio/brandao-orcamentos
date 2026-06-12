"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { canCreateClient } from "@/lib/plans";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Client = {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at?: string;
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

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", address: "", notes: "" });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClients = useCallback(async (currentUser: User) => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id,user_id,name,whatsapp,email,address,notes,created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      setMessage("Não foi possível carregar seus clientes agora. Tente novamente em instantes.");
    } else {
      setClients(data ?? []);
      setSelectedClient((data ?? [])[0] ?? null);
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
      if (error) {
        console.error("Erro ao verificar usuário na tela de clientes:", error);
        setMessage("Não foi possível verificar sua conta agora. Tente novamente em instantes.");
      }
      setUser(data.user);
      if (data.user) {
        loadClients(data.user);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadClients(session.user);
      } else {
        setClients([]);
        setSelectedClient(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadClients]);

  async function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.whatsapp.trim()) {
      setMessage("Preencha nome e WhatsApp para salvar o cliente");
      return;
    }

    if (!user) {
      setMessage("Faça login para salvar clientes.");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local antes de salvar clientes.");
      return;
    }

    const clientPayload = {
      user_id: user.id,
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };

    setIsSaving(true);
    setMessage("");

    if (!editingClientId) {
      const limit = await canCreateClient(user.id);
      if (!limit.allowed) {
        setMessage(limit.message);
        setIsSaving(false);
        return;
      }
    }

    const query = editingClientId
      ? supabase
          .from("clients")
          .update(clientPayload)
          .eq("id", editingClientId)
          .eq("user_id", user.id)
          .select("id,user_id,name,whatsapp,email,address,notes,created_at")
          .single()
      : supabase
          .from("clients")
          .insert(clientPayload)
          .select("id,user_id,name,whatsapp,email,address,notes,created_at")
          .single();

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao salvar cliente:", error);
      setMessage("Não foi possível salvar o cliente agora. Confira os dados e tente novamente.");
      setIsSaving(false);
      return;
    }

    setClients((current) =>
      data
        ? editingClientId
          ? current.map((client) => (client.id === data.id ? data : client))
          : [data, ...current]
        : current,
    );
    setSelectedClient(data ?? null);
    setForm({ name: "", whatsapp: "", email: "", address: "", notes: "" });
    setEditingClientId(null);
    setMessage(editingClientId ? "Cliente atualizado com sucesso" : "Cliente salvo com sucesso");
    setIsSaving(false);
  }

  function selectClient(client: Client) {
    setSelectedClient(client);
    setMessage("Cliente selecionado.");
  }

  function editClient() {
    if (!selectedClient) return;

    setEditingClientId(selectedClient.id);
    setForm({
      name: selectedClient.name,
      whatsapp: selectedClient.whatsapp,
      email: selectedClient.email ?? "",
      address: selectedClient.address ?? "",
      notes: selectedClient.notes ?? "",
    });
    setMessage("Edite os dados no formulário e clique em Atualizar cliente.");
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

      setForm((current) => ({
        ...current,
        name: contact.name?.[0] ?? current.name,
        whatsapp: contact.tel?.[0] ?? current.whatsapp,
        email: contact.email?.[0] ?? current.email,
      }));
      setMessage("Contato importado da agenda. Confira os dados antes de salvar.");
    } catch (error) {
      console.error("Erro ao importar contato da agenda:", error);
      setMessage("Não foi possível importar o contato. Preencha os dados manualmente.");
    }
  }

  async function deleteClient() {
    if (!selectedClient || !user) return;

    const confirmed = window.confirm(`Excluir o cliente ${selectedClient.name}? Orçamentos já salvos não serão apagados.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setMessage("");

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", selectedClient.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      setMessage("Não foi possível excluir o cliente agora. Tente novamente em instantes.");
      setIsDeleting(false);
      return;
    }

    setClients((current) => current.filter((client) => client.id !== selectedClient.id));
    setSelectedClient(null);
    if (editingClientId === selectedClient.id) {
      setEditingClientId(null);
      setForm({ name: "", whatsapp: "", email: "", address: "", notes: "" });
    }
    setMessage("Cliente excluído com sucesso");
    setIsDeleting(false);
  }

  function useClientInBudget() {
    if (!selectedClient) return;
    router.push(`/orcamentos/novo?cliente=${encodeURIComponent(selectedClient.id)}`);
  }

  return (
    <AppShell>
      <AppHeader title="Clientes" subtitle="Consulte contatos, obras e propostas recentes." />
      <section className="px-5">
        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Clientes salvos na sua conta</h2>
            <p className="mt-1 text-sm text-cement">Para salvar e acessar seus clientes, entre na sua conta.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar ou criar conta
            </Link>
          </div>
        ) : null}

        <form onSubmit={saveClient} className="card p-4">
          <h2 className="text-lg font-black text-graphite">{editingClientId ? "Editar cliente" : "Novo cliente"}</h2>
          <button
            type="button"
            onClick={importContactFromDevice}
            className="mt-4 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite"
          >
            Importar da agenda
          </button>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Nome do cliente" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="input" placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
            <input className="input" placeholder="E-mail opcional" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="input" placeholder="Endereço opcional" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            <textarea className="input min-h-28 resize-none" placeholder="Observações" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
          <button type="submit" disabled={!user || isSaving} className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
            {isSaving ? "Salvando..." : editingClientId ? "Atualizar cliente" : "Salvar Cliente"}
          </button>
          {editingClientId ? (
            <button
              type="button"
              onClick={() => {
                setEditingClientId(null);
                setForm({ name: "", whatsapp: "", email: "", address: "", notes: "" });
                setMessage("Edição cancelada.");
              }}
              className="mt-3 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite"
            >
              Cancelar edição
            </button>
          ) : null}
        </form>
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando clientes...</div> : null}
        <div className="mt-5 space-y-3">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => selectClient(client)}
              className={
                selectedClient?.id === client.id
                  ? "card block w-full border-2 border-warning p-4 text-left"
                  : "card block w-full p-4 text-left"
              }
            >
              <h2 className="font-black text-graphite">{client.name}</h2>
              <p className="mt-1 text-sm text-cement">{client.whatsapp || "WhatsApp não informado"}</p>
              <p className="mt-1 text-sm font-bold text-wood">{client.address || "Endereço não informado"}</p>
            </button>
          ))}
        </div>
        {selectedClient ? (
          <div className="card mt-5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Detalhes do cliente</p>
            <h2 className="mt-2 text-xl font-black text-graphite">{selectedClient.name}</h2>
            <p className="mt-1 text-sm text-cement">WhatsApp: {selectedClient.whatsapp || "não informado"}</p>
            <p className="mt-1 text-sm text-cement">E-mail: {selectedClient.email || "não informado"}</p>
            <p className="mt-1 text-sm text-cement">Endereço: {selectedClient.address || "não informado"}</p>
            <p className="mt-1 text-sm text-cement">Observações: {selectedClient.notes || "não informado"}</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <button type="button" onClick={editClient} className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
                Editar cliente
              </button>
              <button type="button" onClick={useClientInBudget} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
                Usar em novo orçamento
              </button>
              <button type="button" onClick={deleteClient} disabled={isDeleting} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite disabled:opacity-60">
                {isDeleting ? "Excluindo..." : "Excluir cliente"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
