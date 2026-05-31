"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";
import { HomeHighlightsCarousel, type HomeHighlightSlide } from "@/components/HomeHighlightsCarousel";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string; whatsapp: string | null; created_at: string | null };
type Quote = { id: string; client_name: string | null; total_value: number | null; status: string | null; created_at: string | null; clients: { name: string | null } | { name: string | null }[] | null };
type Appointment = { id: string; title: string; date: string; start_time: string | null; status: string | null; clients: { name: string | null } | { name: string | null }[] | null };

const ebookHighlights: HomeHighlightSlide[] = [
  {
    title: "Método Orçamento Sem Medo",
    description: "9 passos práticos para precificar sua mão de obra com mais segurança, lucro e profissionalismo.",
    tag: "Ebook gratuito",
    actionLabel: "Acessar ebook",
    href: "#",
  },
  {
    title: "Serviços Periféricos",
    description: "Aprenda a separar instalação de serviços adicionais e valorizar melhor cada etapa da obra.",
    tag: "Ebook gratuito",
    actionLabel: "Acessar ebook",
    href: "#",
  },
  {
    title: "Método Obra Fechada",
    description: "Curso para instaladores que querem precificar, negociar e vender com mais segurança.",
    tag: "Em breve",
    actionLabel: "Conhecer proposta",
    href: "#",
  },
];

function first<T>(value: T | T[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [highlightMessage, setHighlightMessage] = useState("");

  function openHighlight(href: string) {
    if (href === "#") {
      setHighlightMessage("Link será configurado em breve.");
      return;
    }

    window.location.href = href;
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) console.error("Erro ao carregar dashboard:", error);
      if (!data.user) return;

      setIsSignedIn(true);
      const [clientsResult, quotesResult, appointmentsResult, profileResult] = await Promise.all([
        supabase.from("clients").select("id,name,whatsapp,created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("quotes").select("id,client_name,total_value,status,created_at,clients(name)").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("appointments").select("id,title,date,start_time,status,clients(name)").eq("user_id", data.user.id).gte("date", new Date().toISOString().slice(0, 10)).order("date", { ascending: true }).limit(3),
        supabase.from("profiles").select("professional_name,whatsapp,city,state").eq("user_id", data.user.id).limit(1),
      ]);

      if (clientsResult.error) console.error("Erro ao carregar clientes recentes:", clientsResult.error);
      if (quotesResult.error) console.error("Erro ao carregar orçamentos recentes:", quotesResult.error);
      if (appointmentsResult.error) console.error("Erro ao carregar compromissos recentes:", appointmentsResult.error);
      if (profileResult.error) console.error("Erro ao carregar perfil no dashboard:", profileResult.error);

      setClients((clientsResult.data ?? []) as Client[]);
      setQuotes((quotesResult.data ?? []) as Quote[]);
      setAppointments((appointmentsResult.data ?? []) as Appointment[]);
      const profile = profileResult.data?.[0];
      setProfileComplete(Boolean(profile?.professional_name && profile?.whatsapp && profile?.city && profile?.state));
    });
  }, []);

  useEffect(() => {
    if (!highlightMessage) return;

    const timeout = window.setTimeout(() => {
      setHighlightMessage("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [highlightMessage]);

  return (
    <AppShell>
      <AppHeader title="Obra Fechada" subtitle="por Brandão · Orçamentos profissionais para instaladores que querem vender com mais segurança." />

      <section className="px-5 pb-4">
        <HomeHighlightsCarousel slides={ebookHighlights} onAction={openHighlight} message={highlightMessage} />

        <div className="mt-5">
          <ActionButton href="/novo">+ Novo Orçamento / Compromisso</ActionButton>
        </div>

        {!isSignedIn ? (
          <div className="card mt-5 p-5">
            <h2 className="text-xl font-black text-graphite">Área do Instalador</h2>
            <p className="mt-2 text-sm leading-5 text-cement">Entre para salvar clientes, orçamentos e compromissos com segurança.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Entrar ou criar conta</Link>
          </div>
        ) : null}

        {isSignedIn && !profileComplete ? (
          <div className="card mt-5 p-5">
            <h2 className="text-xl font-black text-graphite">Configure sua conta</h2>
            <p className="mt-2 text-sm leading-5 text-cement">Complete seus dados profissionais para aparecerem nas propostas e PDFs.</p>
            <Link href="/minha-conta" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Completar minha conta</Link>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <CardLink href="/orcamentos" title="Orçamentos" description="Propostas, PDFs e links." />
          <CardLink href="/agenda" title="Agenda" description="Visitas e instalações." />
          <CardLink href="/minha-conta" title="Minha Conta" description="Dados profissionais." />
          <CardLink href="/ferramentas" title="Ferramentas" description="Checklists e modelos." />
        </div>

        <div className="mt-6 space-y-5">
          <section>
            <h2 className="text-lg font-black text-graphite">Últimos orçamentos</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !quotes.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum orçamento criado ainda.</div> : null}
              {quotes.map((quote) => {
                const client = first(quote.clients);
                return (
                  <Link key={quote.id} href={`/orcamentos/${quote.id}`} className="card flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-black text-graphite">{client?.name || quote.client_name || "Cliente não informado"}</p>
                      <p className="text-sm text-cement">{quote.created_at ? new Date(quote.created_at).toLocaleDateString("pt-BR") : "sem data"} · {currencyBRL(Number(quote.total_value ?? 0))}</p>
                    </div>
                    <StatusPill>{quote.status || "rascunho"}</StatusPill>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-graphite">Próximos compromissos</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !appointments.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum compromisso agendado ainda.</div> : null}
              {appointments.map((appointment) => {
                const client = first(appointment.clients);
                return (
                  <Link key={appointment.id} href="/agenda" className="card block p-4">
                    <p className="font-black text-graphite">{appointment.title}</p>
                    <p className="text-sm text-cement">{client?.name || "Cliente não vinculado"} · {new Date(`${appointment.date}T00:00:00`).toLocaleDateString("pt-BR")} {appointment.start_time?.slice(0, 5) || ""}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-graphite">Últimos clientes</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !clients.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum cliente cadastrado ainda.</div> : null}
              {clients.map((client) => (
                <Link key={client.id} href="/clientes" className="card block p-4">
                  <p className="font-black text-graphite">{client.name}</p>
                  <p className="text-sm text-cement">{client.whatsapp || "WhatsApp não informado"}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
