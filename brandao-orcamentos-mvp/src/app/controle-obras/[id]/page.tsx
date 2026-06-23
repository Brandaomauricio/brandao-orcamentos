"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { currencyBRL } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type ObraControle = {
  id: string;
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
};

type Lancamento = {
  id: string;
  obra_id: string;
  data_lancamento: string | null;
  tipo: "entrada" | "saida" | string | null;
  categoria: string | null;
  descricao: string | null;
  valor: number | null;
  status: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
  created_at?: string | null;
};

type Categoria = Record<string, unknown>;
type ResumoObra = Record<string, unknown>;

const emptyLancamento = {
  data_lancamento: new Date().toISOString().slice(0, 10),
  tipo: "entrada",
  categoria: "",
  descricao: "",
  valor: "",
  status: "pago",
  forma_pagamento: "",
  observacao: "",
};

const statusLancamentoOptions = [
  { value: "pago", label: "pago" },
  { value: "pendente", label: "pendente" },
  { value: "cancelado", label: "cancelado" },
];

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

function formatDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "nao informado";
}

function formatDecimal(value: number | null) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function categoriaLabel(categoria: Categoria) {
  return String(categoria.nome ?? categoria.categoria ?? categoria.descricao ?? categoria.name ?? "");
}

export default function DetalheControleObraPage() {
  const params = useParams<{ id: string }>();
  const obraId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [obra, setObra] = useState<ObraControle | null>(null);
  const [resumo, setResumo] = useState<ResumoObra | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(emptyLancamento);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((categoria) => String(categoria.tipo ?? "").toLowerCase() === form.tipo);
  }, [categorias, form.tipo]);

  const loadDetalhes = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setMessage("");

    const [obraResult, resumoResult, lancamentosResult, categoriasResult] = await Promise.all([
      supabase
        .from("obras_controle")
        .select("id,nome_obra,cliente_nome,cliente_telefone,endereco,tipo_piso,metragem_total,valor_fechado,data_inicio,data_previsao_conclusao,status_obra,observacoes")
        .eq("id", obraId)
        .eq("user_id", currentUser.id)
        .single(),
      supabase
        .from("resumo_obras_financeiro")
        .select("*")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .maybeSingle(),
      supabase
        .from("obra_lancamentos")
        .select("id,obra_id,data_lancamento,tipo,categoria,descricao,valor,status,forma_pagamento,observacao,created_at")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("data_lancamento", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("obra_categorias_financeiras")
        .select("*")
        .order("tipo", { ascending: true }),
    ]);

    if (obraResult.error) {
      console.error("Erro ao carregar obra:", obraResult.error);
      setMessage("Nao foi possivel carregar esta obra ou ela nao pertence a sua conta.");
      setObra(null);
    } else {
      setObra(obraResult.data as ObraControle);
    }

    if (resumoResult.error) {
      console.error("Erro ao carregar resumo da obra:", resumoResult.error);
      setResumo(null);
    } else {
      setResumo((resumoResult.data ?? null) as ResumoObra | null);
    }

    if (lancamentosResult.error) {
      console.error("Erro ao carregar lancamentos da obra:", lancamentosResult.error);
      setMessage((current) => current || "Nao foi possivel carregar os lancamentos agora.");
      setLancamentos([]);
    } else {
      setLancamentos((lancamentosResult.data ?? []) as Lancamento[]);
    }

    if (categoriasResult.error) {
      console.error("Erro ao carregar categorias financeiras:", categoriasResult.error);
      setCategorias([]);
    } else {
      setCategorias((categoriasResult.data ?? []) as Categoria[]);
    }

    setIsLoading(false);
  }, [obraId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexao com o Supabase ainda nao esta configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Erro ao verificar usuario no detalhe da obra:", error);
      setUser(data.user);
      if (data.user) loadDetalhes(data.user);
      else setIsLoading(false);
    });
  }, [loadDetalhes]);

  useEffect(() => {
    setForm((current) => ({ ...current, categoria: "" }));
  }, [form.tipo]);

  async function saveLancamento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !obra) {
      setMessage("Entre na sua conta para adicionar lancamentos.");
      return;
    }
    if (!form.descricao.trim() || !form.valor.trim()) {
      setMessage("Informe descricao e valor do lancamento.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const { error } = await supabase.from("obra_lancamentos").insert({
      user_id: user.id,
      obra_id: obra.id,
      data_lancamento: form.data_lancamento || null,
      tipo: form.tipo,
      categoria: form.categoria || null,
      descricao: form.descricao.trim(),
      valor: parseNumber(form.valor),
      status: form.status,
      forma_pagamento: form.forma_pagamento.trim() || null,
      observacao: form.observacao.trim() || null,
    });

    if (error) {
      console.error("Erro ao salvar lancamento:", error);
      setMessage("Nao foi possivel salvar o lancamento agora.");
      setIsSaving(false);
      return;
    }

    setForm({ ...emptyLancamento, tipo: form.tipo, data_lancamento: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    setMessage("Lancamento salvo com sucesso.");
    await loadDetalhes(user);
    setIsSaving(false);
  }

  const resumoCards = [
    { label: "Valor fechado", value: currencyBRL(getResumoValue(resumo, "valor_fechado") || numberFrom(obra, ["valor_fechado"])) },
    { label: "Entradas recebidas", value: currencyBRL(getResumoValue(resumo, "entradas_recebidas")) },
    { label: "Saidas pagas", value: currencyBRL(getResumoValue(resumo, "saidas_pagas")) },
    { label: "Saldo realizado", value: currencyBRL(getResumoValue(resumo, "saldo_realizado")) },
    { label: "Valor a receber", value: currencyBRL(getResumoValue(resumo, "valor_a_receber")) },
    { label: "Valor a pagar", value: currencyBRL(getResumoValue(resumo, "valor_a_pagar")) },
    { label: "Resultado previsto", value: currencyBRL(getResumoValue(resumo, "resultado_previsto")) },
  ];

  return (
    <AppShell>
      <AppHeader title="Detalhes da Obra" subtitle="Dados da obra, resumo financeiro e lancamentos." />
      <section className="px-5">
        <Link href="/controle-obras" className="mb-4 inline-flex rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-graphite">
          Voltar para Controle de Obras
        </Link>

        {!user && !isLoading ? (
          <div className="card p-4">
            <h2 className="text-lg font-black text-graphite">Entre para ver esta obra</h2>
            <p className="mt-1 text-sm text-cement">Os dados financeiros ficam salvos na sua conta.</p>
            <Link href="/login" className="mt-4 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
              Entrar ou criar conta
            </Link>
          </div>
        ) : null}

        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {isLoading ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando detalhes da obra...</div> : null}

        {obra ? (
          <>
            <section className="card mt-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-wood">Obra</p>
                  <h2 className="mt-1 text-xl font-black text-graphite">{obra.nome_obra || "Obra sem nome"}</h2>
                  <p className="mt-1 text-sm text-cement">{obra.cliente_nome || "Cliente nao informado"}</p>
                </div>
                <StatusPill>{obra.status_obra || "em andamento"}</StatusPill>
              </div>
              <div className="mt-4 rounded-2xl bg-technical p-4 text-sm text-cement">
                <p><strong className="text-graphite">Telefone:</strong> {obra.cliente_telefone || "nao informado"}</p>
                <p className="mt-1"><strong className="text-graphite">Endereco:</strong> {obra.endereco || "nao informado"}</p>
                <p className="mt-1"><strong className="text-graphite">Tipo de piso:</strong> {obra.tipo_piso || "nao informado"}</p>
                <p className="mt-1"><strong className="text-graphite">Metragem:</strong> {formatDecimal(obra.metragem_total)} m²</p>
                <p className="mt-1"><strong className="text-graphite">Inicio:</strong> {formatDate(obra.data_inicio)}</p>
                <p className="mt-1"><strong className="text-graphite">Previsao:</strong> {formatDate(obra.data_previsao_conclusao)}</p>
                <p className="mt-1 whitespace-pre-line"><strong className="text-graphite">Observacoes:</strong> {obra.observacoes || "nao informadas"}</p>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              {resumoCards.map((card, index) => (
                <div key={card.label} className={`card p-4 ${index === resumoCards.length - 1 ? "col-span-2" : ""}`}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cement">{card.label}</p>
                  <p className="mt-2 text-xl font-black text-graphite">{card.value}</p>
                </div>
              ))}
            </section>

            <button type="button" onClick={() => setShowForm((current) => !current)} className="mobile-action mobile-action-primary mt-5 w-full">
              {showForm ? "Fechar lancamento" : "+ Adicionar lancamento"}
            </button>

            {showForm ? (
              <form onSubmit={saveLancamento} className="card mt-4 p-4">
                <h2 className="text-lg font-black text-graphite">Novo lancamento</h2>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="label block">Data</span>
                    <input className="input" type="date" value={form.data_lancamento} onChange={(event) => setForm({ ...form, data_lancamento: event.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="label block">Tipo</span>
                      <select className="input" value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                        <option value="entrada">entrada</option>
                        <option value="saida">saida</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="label block">Status</span>
                      <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                        {statusLancamentoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="label block">Categoria</span>
                    <select className="input" value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })}>
                      <option value="">Selecionar categoria</option>
                      {categoriasFiltradas.map((categoria) => {
                        const label = categoriaLabel(categoria);
                        return label ? <option key={String(categoria.id ?? label)} value={label}>{label}</option> : null;
                      })}
                    </select>
                  </label>
                  <input className="input" placeholder="Descricao" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
                  <input className="input" inputMode="decimal" placeholder="Valor" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} />
                  <input className="input" placeholder="Forma de pagamento" value={form.forma_pagamento} onChange={(event) => setForm({ ...form, forma_pagamento: event.target.value })} />
                  <textarea className="input min-h-24 resize-none" placeholder="Observacao" value={form.observacao} onChange={(event) => setForm({ ...form, observacao: event.target.value })} />
                </div>
                <button type="submit" disabled={isSaving} className="mobile-action mobile-action-primary mt-4 w-full disabled:opacity-60">
                  {isSaving ? "Salvando..." : "Salvar lancamento"}
                </button>
              </form>
            ) : null}

            <h2 className="mt-6 text-lg font-black text-graphite">Lancamentos financeiros</h2>
            <div className="mt-3 space-y-3">
              {!lancamentos.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum lancamento cadastrado ainda.</div> : null}
              {lancamentos.map((lancamento) => (
                <article key={lancamento.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-graphite">{lancamento.descricao || "Lancamento sem descricao"}</p>
                      <p className="mt-1 text-sm text-cement">{formatDate(lancamento.data_lancamento)} · {lancamento.categoria || "sem categoria"}</p>
                    </div>
                    <StatusPill>{lancamento.status || "pendente"}</StatusPill>
                  </div>
                  <p className={`mt-3 text-2xl font-black ${lancamento.tipo === "saida" ? "text-wood" : "text-graphite"}`}>
                    {lancamento.tipo === "saida" ? "- " : "+ "}{currencyBRL(Number(lancamento.valor ?? 0))}
                  </p>
                  <p className="mt-1 text-sm font-bold text-cement">{lancamento.tipo || "tipo nao informado"} · {lancamento.forma_pagamento || "forma nao informada"}</p>
                  {lancamento.observacao ? <p className="mt-2 whitespace-pre-line text-sm text-cement">{lancamento.observacao}</p> : null}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
