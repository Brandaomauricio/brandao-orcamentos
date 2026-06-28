"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
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

type DiarioObra = {
  id: string;
  data_relatorio: string | null;
  equipe: string | null;
  atividades_realizadas: string | null;
  problemas_encontrados: string | null;
  pendencias: string | null;
  proxima_etapa: string | null;
  clima: string | null;
  observacoes: string | null;
  created_at?: string | null;
};

type DiarioFoto = {
  id: string;
  diario_id: string;
  path: string;
  url: string | null;
};

type ResumoObra = Record<string, unknown>;

const diarioFotosBucket = "obra-diarios";

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

function valueOrFallback(value: string | null | undefined) {
  return value?.trim() || "nao informado";
}

export default function RelatorioControleObraPage() {
  const params = useParams<{ id: string }>();
  const obraId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [obra, setObra] = useState<ObraControle | null>(null);
  const [resumo, setResumo] = useState<ResumoObra | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [diarioFotos, setDiarioFotos] = useState<DiarioFoto[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fotosPorDiario = useMemo(() => {
    return diarioFotos.reduce<Record<string, DiarioFoto[]>>((acc, foto) => {
      if (!acc[foto.diario_id]) acc[foto.diario_id] = [];
      acc[foto.diario_id].push(foto);
      return acc;
    }, {});
  }, [diarioFotos]);

  const resumoCards = [
    { label: "Valor fechado", value: currencyBRL(getResumoValue(resumo, "valor_fechado") || numberFrom(obra, ["valor_fechado"])) },
    { label: "Entradas recebidas", value: currencyBRL(getResumoValue(resumo, "entradas_recebidas")) },
    { label: "Saidas pagas", value: currencyBRL(getResumoValue(resumo, "saidas_pagas")) },
    { label: "Saldo realizado", value: currencyBRL(getResumoValue(resumo, "saldo_realizado")) },
    { label: "Valor a receber", value: currencyBRL(getResumoValue(resumo, "valor_a_receber")) },
    { label: "Valor a pagar", value: currencyBRL(getResumoValue(resumo, "valor_a_pagar")) },
    { label: "Resultado previsto", value: currencyBRL(getResumoValue(resumo, "resultado_previsto")) },
  ];

  const loadRelatorio = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setMessage("");

    const [obraResult, resumoResult, lancamentosResult, diariosResult, fotosResult] = await Promise.all([
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
        .select("id,data_lancamento,tipo,categoria,descricao,valor,status,forma_pagamento,observacao,created_at")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("data_lancamento", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("obra_diarios")
        .select("id,data_relatorio,equipe,atividades_realizadas,problemas_encontrados,pendencias,proxima_etapa,clima,observacoes,created_at")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("data_relatorio", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("obra_diario_fotos")
        .select("id,diario_id,path,url")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true }),
    ]);

    if (obraResult.error) {
      console.error("Erro ao carregar obra para relatorio:", obraResult.error);
      setMessage("Nao foi possivel carregar esta obra ou ela nao pertence a sua conta.");
      setObra(null);
    } else {
      setObra(obraResult.data as ObraControle);
    }

    if (resumoResult.error) {
      console.error("Erro ao carregar resumo do relatorio:", resumoResult.error);
      setResumo(null);
    } else {
      setResumo((resumoResult.data ?? null) as ResumoObra | null);
    }

    if (lancamentosResult.error) {
      console.error("Erro ao carregar lancamentos do relatorio:", lancamentosResult.error);
      setLancamentos([]);
    } else {
      setLancamentos((lancamentosResult.data ?? []) as Lancamento[]);
    }

    if (diariosResult.error) {
      console.error("Erro ao carregar diarios do relatorio:", diariosResult.error);
      setDiarios([]);
    } else {
      setDiarios((diariosResult.data ?? []) as DiarioObra[]);
    }

    if (fotosResult.error) {
      console.error("Erro ao carregar fotos do relatorio:", fotosResult.error);
      setDiarioFotos([]);
    } else {
      setDiarioFotos((fotosResult.data ?? []) as DiarioFoto[]);
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
      if (error) console.error("Erro ao verificar usuario no relatorio da obra:", error);
      setUser(data.user);
      if (data.user) loadRelatorio(data.user);
      else setIsLoading(false);
    });
  }, [loadRelatorio]);

  return (
    <main className="obra-report-shell min-h-screen bg-technical px-4 py-4 text-graphite sm:px-6">
      <div className="obra-report-actions mx-auto mb-4 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/controle-obras/${obraId}`} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-center text-sm font-black text-graphite">
          Voltar para obra
        </Link>
        <button type="button" onClick={() => window.print()} className="rounded-2xl bg-warning px-4 py-3 text-sm font-black text-graphite shadow-soft">
          Imprimir / Salvar PDF
        </button>
      </div>

      {!user && !isLoading ? (
        <section className="mx-auto max-w-5xl rounded-xl bg-white p-5 text-sm font-bold text-cement">
          Entre na sua conta para visualizar este relatorio.
        </section>
      ) : null}

      {message ? <section className="mx-auto mb-4 max-w-5xl rounded-xl bg-white p-4 text-sm font-black text-wood">{message}</section> : null}
      {isLoading ? <section className="mx-auto max-w-5xl rounded-xl bg-white p-4 text-sm font-black text-cement">Carregando relatorio da obra...</section> : null}

      {obra ? (
        <article className="obra-report-page mx-auto max-w-5xl bg-white p-5 shadow-soft sm:p-8">
          <header className="border-b-4 border-graphite pb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-wood">Obra Fechada</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black leading-tight text-graphite">Relatorio da Obra</h1>
                <p className="mt-1 text-lg font-black text-graphite">{obra.nome_obra || "Obra sem nome"}</p>
              </div>
              <p className="rounded-full border border-black/10 px-4 py-2 text-sm font-black text-cement">{valueOrFallback(obra.status_obra)}</p>
            </div>
          </header>

          <section className="obra-report-section mt-6">
            <h2 className="obra-report-title">Dados principais</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ReportItem label="Cliente" value={valueOrFallback(obra.cliente_nome)} />
              <ReportItem label="Telefone" value={valueOrFallback(obra.cliente_telefone)} />
              <ReportItem label="Endereco" value={valueOrFallback(obra.endereco)} />
              <ReportItem label="Tipo de piso" value={valueOrFallback(obra.tipo_piso)} />
              <ReportItem label="Metragem" value={`${formatDecimal(obra.metragem_total)} m²`} />
              <ReportItem label="Inicio" value={formatDate(obra.data_inicio)} />
              <ReportItem label="Previsao de conclusao" value={formatDate(obra.data_previsao_conclusao)} />
              <ReportItem label="Status" value={valueOrFallback(obra.status_obra)} />
            </div>
            <div className="mt-3 rounded-xl border border-black/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">Observacoes</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-graphite">{valueOrFallback(obra.observacoes)}</p>
            </div>
          </section>

          <section className="obra-report-section mt-7">
            <h2 className="obra-report-title">Resumo financeiro</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {resumoCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-black/10 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-cement">{card.label}</p>
                  <p className="mt-2 text-base font-black text-graphite">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="obra-report-section mt-7">
            <h2 className="obra-report-title">Lancamentos financeiros</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="obra-report-table w-full border-collapse text-left text-xs">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descricao</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {!lancamentos.length ? (
                    <tr><td colSpan={7}>Nenhum lancamento cadastrado.</td></tr>
                  ) : null}
                  {lancamentos.map((lancamento) => (
                    <tr key={lancamento.id}>
                      <td>{formatDate(lancamento.data_lancamento)}</td>
                      <td>
                        <p className="font-bold text-graphite">{valueOrFallback(lancamento.descricao)}</p>
                        {lancamento.observacao ? <p className="mt-1 whitespace-pre-line text-cement">{lancamento.observacao}</p> : null}
                      </td>
                      <td>{valueOrFallback(lancamento.tipo)}</td>
                      <td>{lancamento.categoria || "sem categoria"}</td>
                      <td className="font-black">{currencyBRL(Number(lancamento.valor ?? 0))}</td>
                      <td>{valueOrFallback(lancamento.status)}</td>
                      <td>{valueOrFallback(lancamento.forma_pagamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="obra-report-section mt-7">
            <h2 className="obra-report-title">Diario de Obra</h2>
            <div className="mt-3 space-y-4">
              {!diarios.length ? <p className="rounded-xl border border-black/10 p-4 text-sm font-bold text-cement">Nenhum relatorio diario cadastrado.</p> : null}
              {diarios.map((diario) => (
                <article key={diario.id} className="obra-report-diary rounded-xl border border-black/10 p-4">
                  <div className="flex flex-col gap-1 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-black text-graphite">{formatDate(diario.data_relatorio)}</h3>
                    <p className="text-sm font-bold text-cement">{diario.clima || "clima nao informado"}</p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ReportBlock label="Equipe" value={diario.equipe} />
                    <ReportBlock label="Atividades realizadas" value={diario.atividades_realizadas} />
                    <ReportBlock label="Problemas encontrados" value={diario.problemas_encontrados} />
                    <ReportBlock label="Pendencias" value={diario.pendencias} />
                    <ReportBlock label="Proxima etapa" value={diario.proxima_etapa} />
                    <ReportBlock label="Observacoes" value={diario.observacoes} />
                  </div>
                  {fotosPorDiario[diario.id]?.length ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {fotosPorDiario[diario.id].map((foto) => {
                        const imageUrl = foto.url || supabase.storage.from(diarioFotosBucket).getPublicUrl(foto.path).data.publicUrl;
                        return <img key={foto.id} src={imageUrl} alt="Foto do diario de obra" className="obra-report-photo h-28 w-full rounded-lg border border-black/10 object-cover" />;
                      })}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </article>
      ) : null}
    </main>
  );
}

function ReportItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-bold text-graphite">{value}</p>
    </div>
  );
}

function ReportBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.1em] text-cement">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-graphite">{value}</p>
    </div>
  );
}
