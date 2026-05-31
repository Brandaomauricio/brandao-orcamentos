"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string; whatsapp: string | null };
type Quote = { id: string; proposal_number: string | null; client_name: string | null };

const appointmentTypes = ["visita técnica", "instalação", "medição", "retorno", "entrega", "outro"];
const statusOptions = ["agendado", "concluído", "cancelado"];
const emptyForm = { title: "", type: "visita técnica", date: "", start_time: "", end_time: "", client_id: "", quote_id: "", location: "", notes: "", status: "agendado" };

function AppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    const [clientsResult, quotesResult] = await Promise.all([
      supabase.from("clients").select("id,name,whatsapp").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
      supabase.from("quotes").select("id,proposal_number,client_name").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
    ]);

    if (clientsResult.error) {
      console.error("Erro ao carregar clientes para compromisso:", clientsResult.error);
      setMessage("Não foi possível carregar clientes agora.");
    } else {
      setClients((clientsResult.data ?? []) as Client[]);
    }

    if (quotesResult.error) {
      console.error("Erro ao carregar orçamentos para compromisso:", quotesResult.error);
    } else {
      setQuotes((quotesResult.data ?? []) as Quote[]);
    }

    if (appointmentId) {
      const { data, error } = await supabase
        .from("appointments")
        .select("title,type,date,start_time,end_time,client_id,quote_id,location,address,notes,status")
        .eq("id", appointmentId)
        .eq("user_id", currentUser.id)
        .single();
      if (error) {
        console.error("Erro ao carregar compromisso:", error);
        setMessage("Não foi possível carregar este compromisso.");
      } else if (data) {
        setForm({
          title: data.title ?? "",
          type: data.type ?? "visita técnica",
          date: data.date ?? "",
          start_time: data.start_time?.slice(0, 5) ?? "",
          end_time: data.end_time?.slice(0, 5) ?? "",
          client_id: data.client_id ?? "",
          quote_id: data.quote_id ?? "",
          location: data.location || data.address || "",
          notes: data.notes ?? "",
          status: data.status ?? "agendado",
        });
      }
    }
    setIsLoading(false);
  }, [appointmentId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      setIsLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Erro ao verificar usuário no compromisso:", error);
      setUser(data.user);
      if (data.user) loadData(data.user);
      else setIsLoading(false);
    });
  }, [loadData]);

  async function saveAppointment() {
    if (!user) {
      setMessage("Entre na sua conta para salvar compromissos.");
      return;
    }
    if (!form.title.trim() || !form.date) {
      setMessage("Informe título e data do compromisso.");
      return;
    }

    setIsSaving(true);
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      client_id: form.client_id || null,
      quote_id: form.quote_id || null,
      location: form.location.trim() || null,
      address: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    const query = appointmentId
      ? supabase.from("appointments").update(payload).eq("id", appointmentId).eq("user_id", user.id)
      : supabase.from("appointments").insert(payload);
    const { error } = await query;
    if (error) {
      console.error("Erro ao salvar compromisso:", error);
      setMessage("Não foi possível salvar o compromisso agora.");
    } else {
      setMessage(appointmentId ? "Compromisso atualizado." : "Compromisso salvo.");
      router.push("/agenda");
    }
    setIsSaving(false);
  }

  return (
    <AppShell>
      <AppHeader title={appointmentId ? "Editar Compromisso" : "Novo Compromisso"} subtitle="Registre visitas técnicas, medições, instalações e retornos." />
      <section className="px-5">
        {isLoading ? <div className="card p-4 text-sm font-black text-cement">Carregando dados...</div> : null}
        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Entre para salvar compromissos</h2>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Entrar ou criar conta</Link>
          </div>
        ) : null}
        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">Dados do compromisso</h2>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{appointmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} />
              <input className="input" type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} />
            </div>
            <select className="input" value={form.client_id} onChange={(event) => setForm({ ...form, client_id: event.target.value })}>
              <option value="">Sem cliente vinculado</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <select className="input" value={form.quote_id} onChange={(event) => setForm({ ...form, quote_id: event.target.value })}>
              <option value="">Sem orçamento vinculado</option>
              {quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.proposal_number || quote.id.slice(0, 8)} · {quote.client_name || "cliente"}</option>)}
            </select>
            <input className="input" placeholder="Local" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            <textarea className="input min-h-28 resize-none" placeholder="Observações" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/agenda" className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Cancelar</Link>
          <button type="button" disabled={isSaving} onClick={saveAppointment} className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">{isSaving ? "Salvando..." : "Salvar compromisso"}</button>
        </div>
      </section>
    </AppShell>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div />}>
      <AppointmentForm />
    </Suspense>
  );
}
