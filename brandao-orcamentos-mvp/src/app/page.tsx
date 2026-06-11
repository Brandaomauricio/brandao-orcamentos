"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string; whatsapp: string | null; created_at: string | null };
type Quote = { id: string; client_name: string | null; total_value: number | null; status: string | null; created_at: string | null; clients: { name: string | null } | { name: string | null }[] | null };
type Appointment = { id: string; title: string; date: string; start_time: string | null; status: string | null; clients: { name: string | null } | { name: string | null }[] | null };

const productHighlights = [
  {
    title: "M\u00e9todo Pre\u00e7o Certo",
    description: "Pare de cobrar no achismo e monte propostas com mais seguran\u00e7a.",
    tag: "M\u00e9todo completo",
    actionLabel: "Acessar m\u00e9todo",
    href: "https://brandaoazulejista67.hotmart.host/precocertoobralucrativa",
  },
  {
    title: "Calculadora Profissional",
    description: "Calcule custo, di\u00e1ria, margem e pre\u00e7o final com mais clareza.",
    tag: "Ferramenta",
    actionLabel: "Conhecer",
    href: "https://brandaoazulejista67.hotmart.host/calculadoraprofissional",
  },
  {
    title: "Requisitos da Base",
    description: "Ebook gratuito sobre os cuidados antes da instala\u00e7\u00e3o de pisos.",
    tag: "Ebook gratuito",
    actionLabel: "Baixar ebook",
    href: "https://brandaoazulejista67.hotmart.host/nova-pagina-7b7a7b63-b2f2-41b1-a9ec-6aebc9268cf3",
  },
] as const;

const productPages = Array.from({ length: Math.ceil(productHighlights.length / 2) }, (_, index) =>
  productHighlights.slice(index * 2, index * 2 + 2),
);

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
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const showcaseRef = useRef<HTMLDivElement | null>(null);

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
      if (quotesResult.error) console.error("Erro ao carregar or\u00e7amentos recentes:", quotesResult.error);
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
    const interval = window.setInterval(() => {
      setCurrentHighlightIndex((current) => {
        const next = (current + 1) % productPages.length;
        const container = showcaseRef.current;
        const page = container?.children.item(next) as HTMLElement | null;

        if (container && page) {
          container.scrollTo({ left: page.offsetLeft, behavior: "smooth" });
        }

        return next;
      });
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);


  return (
    <AppShell>
      <AppHeader title="Obra Fechada" subtitle={"por Brand\u00e3o \u00b7 Or\u00e7amentos profissionais para instaladores que querem vender com mais seguran\u00e7a."} />

      <section className="px-4 pb-4">
        <section className="-mx-4 overflow-hidden bg-gradient-to-br from-[#11100d] via-[#1d1a15] to-[#080808] px-4 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.26)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-warning">{"Vitrine Brand\u00e3o"}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">{"Cursos e ferramentas Brand\u00e3o"}</h2>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-5 text-white/70">
              {"Materiais pr\u00e1ticos para o instalador vender melhor, calcular com seguran\u00e7a e executar com mais profissionalismo."}
            </p>
          </div>

          <div
            ref={showcaseRef}
            data-active-index={currentHighlightIndex}
            className="mt-5 flex snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {productPages.map((page, pageIndex) => (
              <div key={pageIndex} className="grid min-w-full snap-start grid-cols-2 gap-3">
                {page.map((item) => (
                  <article
                    key={item.title}
                    className="relative flex min-h-[245px] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#241d14] p-4 shadow-[0_18px_35px_rgba(0,0,0,0.34)] sm:p-5"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,181,48,0.24),transparent_36%),linear-gradient(135deg,rgba(118,74,29,0.44),transparent_46%)]" />
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-warning/20" />
                    <div className="relative">
                      <span className="inline-flex rounded-full border border-warning/35 bg-black/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-warning">
                        {item.tag}
                      </span>
                      <h3 className="mt-5 text-xl font-black leading-6 text-white sm:text-2xl sm:leading-7">{item.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-5 text-white/75">{item.description}</p>
                    </div>

                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative mt-6 inline-flex items-center justify-center rounded-2xl bg-warning px-5 py-4 text-sm font-black text-graphite shadow-[0_12px_24px_rgba(245,181,48,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ffd15a]"
                    >
                      {item.actionLabel}
                    </a>
                  </article>
                ))}
                {page.length === 1 ? <div aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5">
          <ActionButton href="/novo">{"+ Novo Or\u00e7amento / Compromisso"}</ActionButton>
        </div>

        {!isSignedIn ? (
          <div className="card mt-5 p-5">
            <h2 className="text-xl font-black text-graphite">{"\u00c1rea do Instalador"}</h2>
            <p className="mt-2 text-sm leading-5 text-cement">{"Entre para salvar clientes, or\u00e7amentos e compromissos com seguran\u00e7a."}</p>
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
          <CardLink href="/orcamentos" title={"Or\u00e7amentos"} description="Propostas, PDFs e links." />
          <CardLink href="/agenda" title="Agenda" description={"Visitas e instala\u00e7\u00f5es."} />
          <CardLink href="/minha-conta" title="Minha Conta" description="Dados profissionais." />
          <CardLink href="/ferramentas" title="Ferramentas" description="Checklists e modelos." />
        </div>

        <div className="mt-5 space-y-4">
          <section>
            <h2 className="text-lg font-black text-graphite">{"\u00daltimos or\u00e7amentos"}</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !quotes.length ? <div className="card p-4 text-sm font-bold text-cement">{"Nenhum or\u00e7amento criado ainda."}</div> : null}
              {quotes.map((quote) => {
                const client = first(quote.clients);
                return (
                  <Link key={quote.id} href={`/orcamentos/${quote.id}`} className="card flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-black text-graphite">{client?.name || quote.client_name || "Cliente n\u00e3o informado"}</p>
                      <p className="text-sm text-cement">{quote.created_at ? new Date(quote.created_at).toLocaleDateString("pt-BR") : "sem data"} {"\u00b7"} {currencyBRL(Number(quote.total_value ?? 0))}</p>
                    </div>
                    <StatusPill>{quote.status || "rascunho"}</StatusPill>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-graphite">{"Pr\u00f3ximos compromissos"}</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !appointments.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum compromisso agendado ainda.</div> : null}
              {appointments.map((appointment) => {
                const client = first(appointment.clients);
                return (
                  <Link key={appointment.id} href="/agenda" className="card block p-4">
                    <p className="font-black text-graphite">{appointment.title}</p>
                    <p className="text-sm text-cement">{client?.name || "Cliente n\u00e3o vinculado"} {"\u00b7"} {new Date(`${appointment.date}T00:00:00`).toLocaleDateString("pt-BR")} {appointment.start_time?.slice(0, 5) || ""}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-graphite">{"\u00daltimos clientes"}</h2>
            <div className="mt-3 space-y-3">
              {isSignedIn && !clients.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum cliente cadastrado ainda.</div> : null}
              {clients.map((client) => (
                <Link key={client.id} href="/clientes" className="card block p-4">
                  <p className="font-black text-graphite">{client.name}</p>
                  <p className="text-sm text-cement">{client.whatsapp || "WhatsApp n\u00e3o informado"}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
