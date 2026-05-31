"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { StatusPill } from "@/components/StatusPill";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Appointment = {
  id: string;
  title: string;
  type: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  notes: string | null;
  status: string | null;
  clients: { name: string | null; whatsapp: string | null } | { name: string | null; whatsapp: string | null }[] | null;
  quotes: { proposal_number: string | null; client_name: string | null } | { proposal_number: string | null; client_name: string | null }[] | null;
};

function relation<T>(value: T | T[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export default function AgendaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const filteredAppointments = useMemo(() => {
    return filterDate ? appointments.filter((item) => item.date === filterDate) : appointments;
  }, [appointments, filterDate]);

  const selectedAppointment = useMemo(() => appointments.find((item) => item.id === selectedId) ?? null, [appointments, selectedId]);

  const loadAppointments = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id,title,type,date,start_time,end_time,location,address,notes,status,clients(name,whatsapp),quotes(proposal_number,client_name)")
      .eq("user_id", currentUser.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Erro ao carregar compromissos:", error);
      setMessage("Não foi possível carregar seus compromissos agora.");
    } else {
      const loaded = (data ?? []) as Appointment[];
      setAppointments(loaded);
      setSelectedId((current) => current || loaded[0]?.id || "");
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
      if (error) console.error("Erro ao verificar usuário na agenda:", error);
      setUser(data.user);
      if (data.user) loadAppointments(data.user);
      else setIsLoading(false);
    });
  }, [loadAppointments]);

  async function deleteAppointment(id: string) {
    if (!user || !window.confirm("Excluir este compromisso?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("appointments").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      console.error("Erro ao excluir compromisso:", error);
      setMessage("Não foi possível excluir o compromisso agora.");
    } else {
      setAppointments((current) => current.filter((item) => item.id !== id));
      setSelectedId((current) => (current === id ? "" : current));
      setMessage("Compromisso excluído.");
    }
    setDeletingId("");
  }

  return (
    <AppShell>
      <AppHeader title="Agenda" subtitle="Organize visitas técnicas, medições, instalações e retornos." />
      <section className="px-5">
        <ActionButton href="/compromissos/novo">+ Novo compromisso</ActionButton>

        {!user && !isLoading ? (
          <div className="card mt-4 p-4">
            <h2 className="text-lg font-black text-graphite">Entre para ver sua agenda</h2>
            <p className="mt-1 text-sm text-cement">Compromissos ficam salvos na sua conta.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Entrar ou criar conta</Link>
          </div>
        ) : null}

        <label className="mt-5 block">
          <span className="label block">Filtrar por data</span>
          <input className="input" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
        </label>
        {filterDate ? <button type="button" onClick={() => setFilterDate("")} className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs font-black text-graphite">Limpar filtro</button> : null}

        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando compromissos...</div> : null}

        <h2 className="mt-6 text-lg font-black text-graphite">Compromissos</h2>
        <div className="mt-3 space-y-3">
          {user && !isLoading && !filteredAppointments.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum compromisso agendado ainda.</div> : null}
          {filteredAppointments.map((item) => {
            const client = relation(item.clients);
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`card block w-full p-4 text-left ${selectedId === item.id ? "border-warning" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-graphite">{item.title}</h3>
                    <p className="mt-1 text-sm text-cement">{client?.name || "Cliente não vinculado"}</p>
                    <p className="mt-1 text-sm font-bold text-wood">{new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")} {item.start_time ? `às ${item.start_time.slice(0, 5)}` : ""}</p>
                  </div>
                  <StatusPill>{item.status || "agendado"}</StatusPill>
                </div>
              </button>
            );
          })}
        </div>

        {selectedAppointment ? (
          <section className="card mt-5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Detalhes</p>
            <h2 className="mt-2 text-xl font-black text-graphite">{selectedAppointment.title}</h2>
            <p className="mt-1 text-sm text-cement">Tipo: {selectedAppointment.type || "outro"}</p>
            <p className="mt-1 text-sm text-cement">Status: {selectedAppointment.status || "agendado"}</p>
            <p className="mt-1 text-sm text-cement">Horário: {selectedAppointment.start_time?.slice(0, 5) || "--:--"} {selectedAppointment.end_time ? `até ${selectedAppointment.end_time.slice(0, 5)}` : ""}</p>
            <p className="mt-1 text-sm text-cement">Local: {selectedAppointment.location || selectedAppointment.address || "não informado"}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-cement">Observações: {selectedAppointment.notes || "não informadas"}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm font-black">
              <Link href={`/compromissos/novo?id=${selectedAppointment.id}`} className="rounded-2xl bg-warning px-4 py-3 text-graphite shadow-soft">Editar</Link>
              <button type="button" disabled={deletingId === selectedAppointment.id} onClick={() => deleteAppointment(selectedAppointment.id)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-graphite disabled:opacity-60">{deletingId === selectedAppointment.id ? "Excluindo..." : "Excluir"}</button>
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
