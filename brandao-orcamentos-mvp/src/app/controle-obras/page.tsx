"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type ObraControle = {
  id: string;
  user_id?: string | null;
  nome_obra: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  endereco: string | null;
  tipo_piso: string | null;
  metragem_total: number | null;
  valor_fechado: number | null;
  data_inicio: string | null;
  data_previsao_conclusao: string | null;
  status_obra: string | null;
  observacoes: string | null;
  created_at?: string | null;
};

type ResumoObra = Record<string, unknown>;

const emptyForm = {
  nome_obra: "",
  cliente_nome: "",
  cliente_telefone: "",
  endereco: "",
  tipo_piso: "",
  metragem_total: "",
  valor_fechado: "",
  data_inicio: "",
  data_previsao_conclusao: "",
  status_obra: "em_andamento",
  observacoes: "",
};

const statusOptions = [
  { value: "em_andamento", label: "em andamento" },
  { value: "concluida", label: "concluida" },
  { value: "pausada", label: "pausada" },
  { value: "cancelada", label: "cancelada" },
];

type DashboardTotals = {
  valorFechado: number;
  entradasRecebidas: number;
  saidasPagas: number;
  saldoRealizado: number;
  valorAReceber: number;
  valorAPagar: number;
  resultadoPrevisto: number;
};

function parseNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function numberFrom(row: ResumoObra | ObraControle | null | undefined, keys: string[]) {
  if (!row) return 0;
  for (const key of keys) {
    const value = (row as Record<string, unknown>)[key];
    if (value !== null && value !== undefined && value !== "") {
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? 0 : numberValue;
    }
  }
  return 0;
}

function textFrom(row: ResumoObra | null | undefined, keys: string[]) {
  if (!row) return "";
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value);
  }
  return "";
}

function getResumoObraId(row: ResumoObra) {
  return textFrom(row, ["obra_id", "id_obra", "id"]);
}

function getResumoValue(row: ResumoObra | null | undefined, field: string) {
  const map: Record<string, string[]> = {
    valor_fechado: ["valor_fechado", "total_fechado", "valor_total_fechado"],
    entradas_recebidas: ["entradas_recebidas", "total_entradas_recebidas", "entradas_pagas", "total_entradas"],
    saidas_pagas: ["saidas_pagas", "total_saidas_pagas", "despesas_pagas", "total_saidas"],
    saldo_realizado: ["saldo_realizado", "resultado_realizado"],
    valor_a_receber: ["valor_a_receber", "entradas_a_receber", "total_a_receber"],
    valor_a_pagar: ["valor_a_pagar", "saidas_a_pagar", "total_a_pagar"],
    resultado_previsto: ["resultado_previsto", "saldo_previsto"],
  };
  return numberFrom(row, map[field] ?? [field]);
}

function formatDecimal(value: number | null) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default function ControleObrasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [obras, setObras] = useState<ObraControle[]>([]);
  const [resumos, setResumos] = useState<ResumoObra[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const resumoByObraId = useMemo(() => {
    const map = new Map<string, ResumoObra>();
    resumos.forEach((row) => {
      const id = getResumoObraId(row);
      if (id) map.set(id, row);
    });
    return map;
  }, [resumos]);

  const dashboard = useMemo(() => {
    const totals = resumos.reduce<DashboardTotals>(
      (acc, row) => ({
        valorFechado: acc.valorFechado + getResumoValue(row, "valor_fechado"),
        entradasRecebidas: acc.entradasRecebidas + getResumoValue(row, "entradas_recebidas"),
        saidasPagas: acc.saidasPagas + getResumoValue(row, "saidas_pagas"),
        saldoRealizado: acc.saldoRealizado + getResumoValue(row, "saldo_realizado"),
        valorAReceber: acc.valorAReceber + getResumoValue(row, "valor_a_receber"),
        valorAPagar: acc.valorAPagar + getResumoValue(row, "valor_a_pagar"),
        resultadoPrevisto: acc.resultadoPrevisto + getResumoValue(row, "resultado_previsto"),
      }),
      {
        valorFechado: 0,
        entradasRecebidas: 0,
        saidasPagas: 0,
        saldoRealizado: 0,
        valorAReceber: 0,
        valorAPagar: 0,
        resultadoPrevisto: 0,
      },
    );

    return {
      totalObras: obras.length,
      obrasEmAndamento: obras.filter((obra) => (obra.status_obra || "").toLowerCase() === "em_andamento").length,
      ...totals,
    };
  }, [obras, resumos]);

  const loadObras = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setMessage("");

    const [obrasResult, resumosResult] = await Promise.all([
      supabase
        .from("obras_controle")
        .select("id,user_id,nome_obra,cliente_nome,cliente_telefone,endereco,tipo_piso,metragem_total,valor_fechado,data_inicio,data_previsao_conclusao,status_obra,observacoes,created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("resumo_obras_financeiro")
        .select("*")
        .eq("user_id", currentUser.id),
    ]);

    if (obrasResult.error) {
      console.error("Erro ao carregar obras:", obrasResult.error);
      setMessage("Nao foi possivel carregar suas obras agora.");
      setObras([]);
    } else {
      setObras((obrasResult.data ?? []) as ObraControle[]);
    }

    if (resumosResult.error) {
      console.error("Erro ao carregar resumo financeiro das obras:", resumosResult.error);
      setMessage((current) => current || "Nao foi possivel carregar o resumo financeiro agora.");
      setResumos([]);
    } else {
      setResumos((resumosResult.data ?? []) as ResumoObra[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexao com o Supabase ainda nao esta configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Erro ao verificar usuario no controle de obras:", error);
      setUser(data.user);
      if (data.user) loadObras(data.user);
      else setIsLoading(false);
    });
  }, [loadObras]);

  async function saveObra(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("Entre na sua conta para cadastrar obras.");
      return;
    }
    if (!form.nome_obra.trim() || !form.cliente_nome.trim()) {
      setMessage("Informe o nome da obra e o cliente.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const { error } = await supabase.from("obras_controle").insert({
      user_id: user.id,
      nome_obra: form.nome_obra.trim(),
      cliente_nome: form.cliente_nome.trim(),
      cliente_telefone: form.cliente_telefone.trim() || null,
      endereco: form.endereco.trim() || null,
      tipo_piso: form.tipo_piso.trim() || null,
      metragem_total: parseNumber(form.metragem_total) || null,
      valor_fechado: parseNumber(form.valor_fechado) || null,
      data_inicio: form.data_inicio || null,
      data_previsao_conclusao: form.data_previsao_conclusao || null,
      status_obra: form.status_obra,
      observacoes: form.observacoes.trim() || null,
    });

    if (error) {
      console.error("Erro ao salvar obra:", error);
      setMessage("Nao foi possivel salvar a obra agora.");
      setIsSaving(false);
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    setMessage("Obra cadastrada com sucesso.");
    await loadObras(user);
    setIsSaving(false);
  }

  const cards = [
    { label: "Total de obras", value: String(dashboard.totalObras) },
    { label: "Em andamento", value: String(dashboard.obrasEmAndamento) },
    { label: "Valor fechado", value: currencyBRL(dashboard.valorFechado) },
    { label: "Entradas recebidas", value: currencyBRL(dashboard.entradasRecebidas) },
    { label: "Saidas pagas", value: currencyBRL(dashboard.saidasPagas) },
    { label: "Saldo realizado", value: currencyBRL(dashboard.saldoRealizado) },
    { label: "Valor a receber", value: currencyBRL(dashboard.valorAReceber) },
    { label: "Valor a pagar", value: currencyBRL(dashboard.valorAPagar) },
    { label: "Resultado previsto", value: currencyBRL(dashboard.resultadoPrevisto) },
  ];

  return (
    <AppShell>
      <AppHeader title="Controle de Obras" subtitle="Acompanhe obras fechadas, entradas, saidas e resultado previsto." />
      <section className="px-5">
        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Entre para ver suas obras</h2>
            <p className="mt-1 text-sm text-cement">O controle financeiro fica salvo na sua conta.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar ou criar conta
            </Link>
          </div>
        ) : null}

        {user ? (
          <button type="button" onClick={() => setShowForm((current) => !current)} className="mobile-action mobile-action-primary w-full">
            {showForm ? "Fechar cadastro" : "+ Nova obra"}
          </button>
        ) : null}

        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando controle de obras...</div> : null}

        {user && showForm ? (
          <form onSubmit={saveObra} className="card mt-4 p-4">
            <h2 className="text-lg font-black text-graphite">Cadastrar obra</h2>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Nome da obra" value={form.nome_obra} onChange={(event) => setForm({ ...form, nome_obra: event.target.value })} />
              <input className="input" placeholder="Nome do cliente" value={form.cliente_nome} onChange={(event) => setForm({ ...form, cliente_nome: event.target.value })} />
              <input className="input" placeholder="Telefone do cliente" value={form.cliente_telefone} onChange={(event) => setForm({ ...form, cliente_telefone: event.target.value })} />
              <input className="input" placeholder="Endereco" value={form.endereco} onChange={(event) => setForm({ ...form, endereco: event.target.value })} />
              <input className="input" placeholder="Tipo de piso" value={form.tipo_piso} onChange={(event) => setForm({ ...form, tipo_piso: event.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" inputMode="decimal" placeholder="Metragem" value={form.metragem_total} onChange={(event) => setForm({ ...form, metragem_total: event.target.value })} />
                <input className="input" inputMode="decimal" placeholder="Valor fechado" value={form.valor_fechado} onChange={(event) => setForm({ ...form, valor_fechado: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label block">Inicio</span>
                  <input className="input" type="date" value={form.data_inicio} onChange={(event) => setForm({ ...form, data_inicio: event.target.value })} />
                </label>
                <label className="block">
                  <span className="label block">Previsao</span>
                  <input className="input" type="date" value={form.data_previsao_conclusao} onChange={(event) => setForm({ ...form, data_previsao_conclusao: event.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="label block">Status</span>
                <select className="input" value={form.status_obra} onChange={(event) => setForm({ ...form, status_obra: event.target.value })}>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <textarea className="input min-h-24 resize-none" placeholder="Observacoes" value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} />
            </div>
            <button type="submit" disabled={isSaving} className="mobile-action mobile-action-primary mt-4 w-full disabled:opacity-60">
              {isSaving ? "Salvando..." : "Salvar obra"}
            </button>
          </form>
        ) : null}

        {user ? (
          <>
            <section className="mt-5 grid grid-cols-2 gap-3">
              {cards.map((card, index) => (
                <div key={card.label} className={`card p-4 ${index === cards.length - 1 ? "col-span-2" : ""}`}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cement">{card.label}</p>
                  <p className="mt-2 text-xl font-black text-graphite">{card.value}</p>
                </div>
              ))}
            </section>

            <h2 className="mt-6 text-lg font-black text-graphite">Obras cadastradas</h2>
            <div className="mt-3 space-y-3">
              {!isLoading && !obras.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhuma obra cadastrada ainda.</div> : null}
              {obras.map((obra) => {
                const resumo = resumoByObraId.get(obra.id);
                return (
                  <article key={obra.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-graphite">{obra.nome_obra || "Obra sem nome"}</h3>
                        <p className="mt-1 text-sm text-cement">{obra.cliente_nome || "Cliente nao informado"}</p>
                        <p className="mt-1 text-sm text-cement">{obra.tipo_piso || "Tipo de piso nao informado"} · {formatDecimal(obra.metragem_total)} m²</p>
                      </div>
                      <StatusPill>{obra.status_obra || "em andamento"}</StatusPill>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-technical p-3 text-sm">
                      <p className="font-bold text-cement">Valor fechado<br /><strong className="text-graphite">{currencyBRL(numberFrom(obra, ["valor_fechado"]))}</strong></p>
                      <p className="font-bold text-cement">Saldo realizado<br /><strong className="text-graphite">{currencyBRL(getResumoValue(resumo, "saldo_realizado"))}</strong></p>
                      <p className="col-span-2 font-bold text-cement">Resultado previsto<br /><strong className="text-graphite">{currencyBRL(getResumoValue(resumo, "resultado_previsto"))}</strong></p>
                    </div>
                    <Link href={`/controle-obras/${obra.id}`} className="mobile-action mobile-action-strong mt-4 w-full">
                      Abrir detalhes
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
