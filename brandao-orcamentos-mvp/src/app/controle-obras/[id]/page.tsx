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

type DiarioObra = {
  id: string;
  obra_id: string;
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
  user_id: string;
  obra_id: string;
  diario_id: string;
  path: string;
  url: string | null;
  created_at?: string | null;
};

type Categoria = Record<string, unknown>;
type ResumoObra = Record<string, unknown>;
type PeriodoFiltro = "todos" | "hoje" | "semana" | "mes" | "personalizado";

const diarioFotosBucket = "obra-diarios";

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

const emptyDiario = {
  data_relatorio: new Date().toISOString().slice(0, 10),
  equipe: "",
  atividades_realizadas: "",
  problemas_encontrados: "",
  pendencias: "",
  proxima_etapa: "",
  clima: "",
  observacoes: "",
};

const statusLancamentoOptions = [
  { value: "pago", label: "pago" },
  { value: "pendente", label: "pendente" },
  { value: "cancelado", label: "cancelado" },
];

const emptyFilters = {
  periodo: "todos" as PeriodoFiltro,
  dataInicial: "",
  dataFinal: "",
  tipo: "todos",
  status: "todos",
  categoria: "todas",
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

function formatFormNumber(value: number | null) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

function localDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function periodRange(periodo: PeriodoFiltro, dataInicial: string, dataFinal: string) {
  const today = new Date();

  if (periodo === "hoje") {
    const currentDate = localDateInput(today);
    return { start: currentDate, end: currentDate };
  }

  if (periodo === "semana") {
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = addDays(today, -daysFromMonday);
    const end = addDays(start, 6);
    return { start: localDateInput(start), end: localDateInput(end) };
  }

  if (periodo === "mes") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: localDateInput(start), end: localDateInput(end) };
  }

  if (periodo === "personalizado") {
    return { start: dataInicial, end: dataFinal };
  }

  return { start: "", end: "" };
}

function lancamentoValue(lancamento: Lancamento) {
  return Number(lancamento.valor ?? 0);
}

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
}

export default function DetalheControleObraPage() {
  const params = useParams<{ id: string }>();
  const obraId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [obra, setObra] = useState<ObraControle | null>(null);
  const [resumo, setResumo] = useState<ResumoObra | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [diarioFotos, setDiarioFotos] = useState<DiarioFoto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(emptyLancamento);
  const [diarioForm, setDiarioForm] = useState(emptyDiario);
  const [diarioFiles, setDiarioFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDiario, setIsSavingDiario] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDiarioForm, setShowDiarioForm] = useState(false);
  const [editingLancamentoId, setEditingLancamentoId] = useState("");
  const [deletingLancamentoId, setDeletingLancamentoId] = useState("");
  const [editingDiarioId, setEditingDiarioId] = useState("");
  const [deletingDiarioId, setDeletingDiarioId] = useState("");
  const [deletingFotoId, setDeletingFotoId] = useState("");
  const [filters, setFilters] = useState(emptyFilters);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((categoria) => String(categoria.tipo ?? "").toLowerCase() === form.tipo);
  }, [categorias, form.tipo]);

  const categoriaFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    const hasLancamentoSemCategoria = lancamentos.some((lancamento) => !lancamento.categoria);

    categorias.forEach((categoria) => {
      const label = categoriaLabel(categoria);
      if (label) labels.add(label);
    });

    lancamentos.forEach((lancamento) => {
      if (lancamento.categoria) labels.add(lancamento.categoria);
    });

    return {
      labels: Array.from(labels).sort((a, b) => a.localeCompare(b, "pt-BR")),
      hasSemCategoria: hasLancamentoSemCategoria,
    };
  }, [categorias, lancamentos]);

  const lancamentosFiltrados = useMemo(() => {
    const range = periodRange(filters.periodo, filters.dataInicial, filters.dataFinal);

    return lancamentos.filter((lancamento) => {
      const dataLancamento = lancamento.data_lancamento || "";
      const tipo = String(lancamento.tipo ?? "").toLowerCase();
      const status = String(lancamento.status ?? "").toLowerCase();
      const categoria = lancamento.categoria || "";

      if (range.start && (!dataLancamento || dataLancamento < range.start)) return false;
      if (range.end && (!dataLancamento || dataLancamento > range.end)) return false;
      if (filters.tipo !== "todos" && tipo !== filters.tipo) return false;
      if (filters.status !== "todos" && status !== filters.status) return false;
      if (filters.categoria === "sem-categoria" && categoria) return false;
      if (filters.categoria !== "todas" && filters.categoria !== "sem-categoria" && categoria !== filters.categoria) return false;

      return true;
    });
  }, [filters, lancamentos]);

  const resumoFiltrado = useMemo(() => {
    return lancamentosFiltrados.reduce(
      (acc, lancamento) => {
        const value = lancamentoValue(lancamento);
        const tipo = String(lancamento.tipo ?? "").toLowerCase();
        const status = String(lancamento.status ?? "").toLowerCase();

        if (tipo === "entrada") {
          acc.entradas += value;
          if (status === "pendente") acc.pendenteReceber += value;
        }

        if (tipo === "saida") {
          acc.saidas += value;
          if (status === "pendente") acc.pendentePagar += value;
        }

        acc.saldo = acc.entradas - acc.saidas;
        return acc;
      },
      { entradas: 0, saidas: 0, saldo: 0, pendenteReceber: 0, pendentePagar: 0 },
    );
  }, [lancamentosFiltrados]);

  const resumoPorCategoria = useMemo(() => {
    const map = new Map<string, { categoria: string; entradas: number; saidas: number; saldo: number }>();

    lancamentosFiltrados.forEach((lancamento) => {
      const categoria = lancamento.categoria || "Sem categoria";
      const current = map.get(categoria) ?? { categoria, entradas: 0, saidas: 0, saldo: 0 };
      const value = lancamentoValue(lancamento);

      if (lancamento.tipo === "entrada") current.entradas += value;
      if (lancamento.tipo === "saida") current.saidas += value;
      current.saldo = current.entradas - current.saidas;
      map.set(categoria, current);
    });

    return Array.from(map.values()).sort((a, b) => a.categoria.localeCompare(b.categoria, "pt-BR"));
  }, [lancamentosFiltrados]);

  const fotosPorDiario = useMemo(() => {
    return diarioFotos.reduce<Record<string, DiarioFoto[]>>((acc, foto) => {
      if (!acc[foto.diario_id]) acc[foto.diario_id] = [];
      acc[foto.diario_id].push(foto);
      return acc;
    }, {});
  }, [diarioFotos]);

  const loadDetalhes = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setMessage("");

    const [obraResult, resumoResult, lancamentosResult, diariosResult, fotosResult, categoriasResult] = await Promise.all([
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
        .from("obra_diarios")
        .select("id,obra_id,data_relatorio,equipe,atividades_realizadas,problemas_encontrados,pendencias,proxima_etapa,clima,observacoes,created_at")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("data_relatorio", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("obra_diario_fotos")
        .select("id,user_id,obra_id,diario_id,path,url,created_at")
        .eq("obra_id", obraId)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true }),
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

    if (diariosResult.error) {
      console.error("Erro ao carregar diario da obra:", diariosResult.error);
      setMessage((current) => current || "Nao foi possivel carregar o diario da obra agora.");
      setDiarios([]);
    } else {
      setDiarios((diariosResult.data ?? []) as DiarioObra[]);
    }

    if (fotosResult.error) {
      console.error("Erro ao carregar fotos do diario:", fotosResult.error);
      setDiarioFotos([]);
    } else {
      setDiarioFotos((fotosResult.data ?? []) as DiarioFoto[]);
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

    const lancamentoPayload = {
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
    };

    const { error } = editingLancamentoId
      ? await supabase
          .from("obra_lancamentos")
          .update(lancamentoPayload)
          .eq("id", editingLancamentoId)
          .eq("obra_id", obra.id)
          .eq("user_id", user.id)
      : await supabase.from("obra_lancamentos").insert(lancamentoPayload);

    if (error) {
      console.error("Erro ao salvar lancamento:", error);
      setMessage("Nao foi possivel salvar o lancamento agora.");
      setIsSaving(false);
      return;
    }

    setForm({ ...emptyLancamento, tipo: form.tipo, data_lancamento: new Date().toISOString().slice(0, 10) });
    setEditingLancamentoId("");
    setShowForm(false);
    setMessage(editingLancamentoId ? "Lancamento atualizado com sucesso." : "Lancamento salvo com sucesso.");
    await loadDetalhes(user);
    setIsSaving(false);
  }

  function editLancamento(lancamento: Lancamento) {
    setEditingLancamentoId(lancamento.id);
    setForm({
      data_lancamento: lancamento.data_lancamento || new Date().toISOString().slice(0, 10),
      tipo: lancamento.tipo === "saida" ? "saida" : "entrada",
      categoria: lancamento.categoria || "",
      descricao: lancamento.descricao || "",
      valor: formatFormNumber(lancamento.valor),
      status: lancamento.status || "pago",
      forma_pagamento: lancamento.forma_pagamento || "",
      observacao: lancamento.observacao || "",
    });
    setShowForm(true);
    setMessage("Edite o lancamento e salve as alteracoes.");
  }

  function cancelEditLancamento() {
    setEditingLancamentoId("");
    setForm({ ...emptyLancamento, data_lancamento: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    setMessage("Edicao de lancamento cancelada.");
  }

  async function deleteLancamento(lancamentoId: string) {
    if (!user || !obra) return;
    const confirmed = window.confirm("Excluir este lancamento financeiro?");
    if (!confirmed) return;

    setDeletingLancamentoId(lancamentoId);
    setMessage("");

    const { error } = await supabase
      .from("obra_lancamentos")
      .delete()
      .eq("id", lancamentoId)
      .eq("obra_id", obra.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir lancamento:", error);
      setMessage("Nao foi possivel excluir o lancamento agora.");
      setDeletingLancamentoId("");
      return;
    }

    if (editingLancamentoId === lancamentoId) {
      setEditingLancamentoId("");
      setForm({ ...emptyLancamento, data_lancamento: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    }

    setMessage("Lancamento excluido com sucesso.");
    await loadDetalhes(user);
    setDeletingLancamentoId("");
  }

  async function saveDiario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !obra) {
      setMessage("Entre na sua conta para adicionar relatorios no diario.");
      return;
    }
    if (!diarioForm.atividades_realizadas.trim()) {
      setMessage("Informe as atividades realizadas no diario da obra.");
      return;
    }

    setIsSavingDiario(true);
    setMessage("");

    const diarioPayload = {
      user_id: user.id,
      obra_id: obra.id,
      data_relatorio: diarioForm.data_relatorio || null,
      equipe: diarioForm.equipe.trim() || null,
      atividades_realizadas: diarioForm.atividades_realizadas.trim(),
      problemas_encontrados: diarioForm.problemas_encontrados.trim() || null,
      pendencias: diarioForm.pendencias.trim() || null,
      proxima_etapa: diarioForm.proxima_etapa.trim() || null,
      clima: diarioForm.clima.trim() || null,
      observacoes: diarioForm.observacoes.trim() || null,
    };

    const { data: savedDiario, error } = editingDiarioId
      ? await supabase
          .from("obra_diarios")
          .update(diarioPayload)
          .eq("id", editingDiarioId)
          .eq("obra_id", obra.id)
          .eq("user_id", user.id)
          .select("id")
          .single()
      : await supabase.from("obra_diarios").insert(diarioPayload).select("id").single();

    if (error) {
      console.error("Erro ao salvar diario da obra:", error);
      setMessage("Nao foi possivel salvar o diario da obra agora.");
      setIsSavingDiario(false);
      return;
    }

    const diarioId = savedDiario?.id || editingDiarioId;

    if (diarioId && diarioFiles.length) {
      const uploaded: Array<{ user_id: string; obra_id: string; diario_id: string; path: string; url: string }> = [];

      for (const file of diarioFiles) {
        const path = `${user.id}/${obra.id}/${diarioId}/${Date.now()}-${safeFileName(file.name)}`;
        const uploadResult = await supabase.storage.from(diarioFotosBucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadResult.error) {
          console.error("Erro ao enviar foto do diario:", uploadResult.error);
          setMessage("O diario foi salvo, mas uma ou mais fotos nao puderam ser enviadas.");
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from(diarioFotosBucket).getPublicUrl(path);
        uploaded.push({
          user_id: user.id,
          obra_id: obra.id,
          diario_id: diarioId,
          path,
          url: publicUrlData.publicUrl,
        });
      }

      if (uploaded.length) {
        const { error: fotosError } = await supabase.from("obra_diario_fotos").insert(uploaded);

        if (fotosError) {
          console.error("Erro ao salvar vinculo das fotos do diario:", fotosError);
          setMessage("O diario foi salvo, mas nao foi possivel vincular todas as fotos.");
        }
      }
    }

    setDiarioForm({ ...emptyDiario, data_relatorio: new Date().toISOString().slice(0, 10) });
    setDiarioFiles([]);
    setEditingDiarioId("");
    setShowDiarioForm(false);
    setMessage((current) => current || (editingDiarioId ? "Relatorio do diario atualizado com sucesso." : "Relatorio do diario salvo com sucesso."));
    await loadDetalhes(user);
    setIsSavingDiario(false);
  }

  function editDiario(diario: DiarioObra) {
    setEditingDiarioId(diario.id);
    setDiarioForm({
      data_relatorio: diario.data_relatorio || new Date().toISOString().slice(0, 10),
      equipe: diario.equipe || "",
      atividades_realizadas: diario.atividades_realizadas || "",
      problemas_encontrados: diario.problemas_encontrados || "",
      pendencias: diario.pendencias || "",
      proxima_etapa: diario.proxima_etapa || "",
      clima: diario.clima || "",
      observacoes: diario.observacoes || "",
    });
    setDiarioFiles([]);
    setShowDiarioForm(true);
    setMessage("Edite o relatorio do diario e salve as alteracoes.");
  }

  function cancelEditDiario() {
    setEditingDiarioId("");
    setDiarioForm({ ...emptyDiario, data_relatorio: new Date().toISOString().slice(0, 10) });
    setDiarioFiles([]);
    setShowDiarioForm(false);
    setMessage("Edicao do diario cancelada.");
  }

  async function deleteDiario(diarioId: string) {
    if (!user || !obra) return;
    const confirmed = window.confirm("Excluir este relatorio do diario de obra?");
    if (!confirmed) return;

    setDeletingDiarioId(diarioId);
    setMessage("");

    const fotosDoDiario = diarioFotos.filter((foto) => foto.diario_id === diarioId);
    if (fotosDoDiario.length) {
      await supabase.storage.from(diarioFotosBucket).remove(fotosDoDiario.map((foto) => foto.path));
    }

    const { error } = await supabase
      .from("obra_diarios")
      .delete()
      .eq("id", diarioId)
      .eq("obra_id", obra.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir diario da obra:", error);
      setMessage("Nao foi possivel excluir o diario da obra agora.");
      setDeletingDiarioId("");
      return;
    }

    if (editingDiarioId === diarioId) {
      setEditingDiarioId("");
      setDiarioForm({ ...emptyDiario, data_relatorio: new Date().toISOString().slice(0, 10) });
      setShowDiarioForm(false);
    }

    setMessage("Relatorio do diario excluido com sucesso.");
    await loadDetalhes(user);
    setDeletingDiarioId("");
  }

  async function deleteDiarioFoto(foto: DiarioFoto) {
    if (!user || !obra) return;
    const confirmed = window.confirm("Remover esta foto do diario?");
    if (!confirmed) return;

    setDeletingFotoId(foto.id);
    setMessage("");

    const storageResult = await supabase.storage.from(diarioFotosBucket).remove([foto.path]);
    if (storageResult.error) {
      console.error("Erro ao remover foto do Storage:", storageResult.error);
    }

    const { error } = await supabase
      .from("obra_diario_fotos")
      .delete()
      .eq("id", foto.id)
      .eq("obra_id", obra.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao remover registro da foto:", error);
      setMessage("Nao foi possivel remover a foto agora.");
      setDeletingFotoId("");
      return;
    }

    setMessage("Foto removida com sucesso.");
    await loadDetalhes(user);
    setDeletingFotoId("");
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

            <section className="card mt-6 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cement">Registro da obra</p>
                  <h2 className="mt-1 text-lg font-black text-graphite">Diario de Obra</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showDiarioForm && editingDiarioId) {
                      cancelEditDiario();
                      return;
                    }
                    if (showDiarioForm) setDiarioFiles([]);
                    setShowDiarioForm((current) => !current);
                  }}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-graphite"
                >
                  {showDiarioForm ? "Fechar" : "+ Novo"}
                </button>
              </div>

              {showDiarioForm ? (
                <form onSubmit={saveDiario} className="mt-4 space-y-3">
                  <h3 className="text-base font-black text-graphite">{editingDiarioId ? "Editar relatorio" : "Novo relatorio diario"}</h3>
                  <label className="block">
                    <span className="label block">Data do relatorio</span>
                    <input className="input" type="date" value={diarioForm.data_relatorio} onChange={(event) => setDiarioForm({ ...diarioForm, data_relatorio: event.target.value })} />
                  </label>
                  <input className="input" placeholder="Equipe presente" value={diarioForm.equipe} onChange={(event) => setDiarioForm({ ...diarioForm, equipe: event.target.value })} />
                  <textarea className="input min-h-28 resize-none" placeholder="Atividades realizadas" value={diarioForm.atividades_realizadas} onChange={(event) => setDiarioForm({ ...diarioForm, atividades_realizadas: event.target.value })} required />
                  <textarea className="input min-h-24 resize-none" placeholder="Problemas encontrados" value={diarioForm.problemas_encontrados} onChange={(event) => setDiarioForm({ ...diarioForm, problemas_encontrados: event.target.value })} />
                  <textarea className="input min-h-24 resize-none" placeholder="Pendencias" value={diarioForm.pendencias} onChange={(event) => setDiarioForm({ ...diarioForm, pendencias: event.target.value })} />
                  <textarea className="input min-h-24 resize-none" placeholder="Proxima etapa" value={diarioForm.proxima_etapa} onChange={(event) => setDiarioForm({ ...diarioForm, proxima_etapa: event.target.value })} />
                  <input className="input" placeholder="Clima" value={diarioForm.clima} onChange={(event) => setDiarioForm({ ...diarioForm, clima: event.target.value })} />
                  <textarea className="input min-h-24 resize-none" placeholder="Observacoes" value={diarioForm.observacoes} onChange={(event) => setDiarioForm({ ...diarioForm, observacoes: event.target.value })} />
                  <label className="block">
                    <span className="label block">Fotos</span>
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => setDiarioFiles(Array.from(event.target.files ?? []))}
                    />
                  </label>
                  {diarioFiles.length ? (
                    <div className="rounded-2xl bg-technical p-3 text-sm font-bold text-cement">
                      {diarioFiles.length} foto{diarioFiles.length === 1 ? "" : "s"} selecionada{diarioFiles.length === 1 ? "" : "s"}.
                    </div>
                  ) : null}
                  <button type="submit" disabled={isSavingDiario} className="mobile-action mobile-action-primary w-full disabled:opacity-60">
                    {isSavingDiario ? "Salvando..." : editingDiarioId ? "Salvar alteracoes" : "Salvar diario"}
                  </button>
                  {editingDiarioId ? (
                    <button type="button" onClick={cancelEditDiario} disabled={isSavingDiario} className="mobile-action w-full border border-black/10 bg-white text-graphite disabled:opacity-60">
                      Cancelar edicao
                    </button>
                  ) : null}
                </form>
              ) : null}

              <div className="mt-4 space-y-3">
                {!diarios.length ? <div className="rounded-2xl bg-technical p-4 text-sm font-bold text-cement">Nenhum relatorio diario cadastrado ainda.</div> : null}
                {diarios.map((diario) => (
                  <article key={diario.id} className="rounded-2xl bg-technical p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">Relatorio</p>
                        <p className="mt-1 text-lg font-black text-graphite">{formatDate(diario.data_relatorio)}</p>
                      </div>
                      {diario.clima ? <StatusPill>{diario.clima}</StatusPill> : null}
                    </div>
                    {diario.equipe ? <p className="mt-3 text-sm text-cement"><strong className="text-graphite">Equipe:</strong> {diario.equipe}</p> : null}
                    <p className="mt-3 whitespace-pre-line text-sm text-cement"><strong className="text-graphite">Atividades:</strong> {diario.atividades_realizadas || "nao informado"}</p>
                    {diario.problemas_encontrados ? <p className="mt-2 whitespace-pre-line text-sm text-cement"><strong className="text-graphite">Problemas:</strong> {diario.problemas_encontrados}</p> : null}
                    {diario.pendencias ? <p className="mt-2 whitespace-pre-line text-sm text-cement"><strong className="text-graphite">Pendencias:</strong> {diario.pendencias}</p> : null}
                    {diario.proxima_etapa ? <p className="mt-2 whitespace-pre-line text-sm text-cement"><strong className="text-graphite">Proxima etapa:</strong> {diario.proxima_etapa}</p> : null}
                    {diario.observacoes ? <p className="mt-2 whitespace-pre-line text-sm text-cement"><strong className="text-graphite">Observacoes:</strong> {diario.observacoes}</p> : null}
                    {fotosPorDiario[diario.id]?.length ? (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {fotosPorDiario[diario.id].map((foto) => {
                          const imageUrl = foto.url || supabase.storage.from(diarioFotosBucket).getPublicUrl(foto.path).data.publicUrl;

                          return (
                            <div key={foto.id} className="overflow-hidden rounded-2xl bg-white">
                              <img src={imageUrl} alt="Foto do diario de obra" className="h-32 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => deleteDiarioFoto(foto)}
                                disabled={deletingFotoId === foto.id}
                                className="w-full px-3 py-2 text-xs font-black text-graphite disabled:opacity-60"
                              >
                                {deletingFotoId === foto.id ? "Removendo..." : "Remover foto"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm font-black">
                      <button type="button" onClick={() => editDiario(diario)} disabled={isSavingDiario || deletingDiarioId === diario.id} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-graphite disabled:opacity-60">
                        Editar
                      </button>
                      <button type="button" onClick={() => deleteDiario(diario.id)} disabled={isSavingDiario || deletingDiarioId === diario.id} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-graphite disabled:opacity-60">
                        {deletingDiarioId === diario.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => {
                if (showForm && editingLancamentoId) {
                  cancelEditLancamento();
                  return;
                }
                setShowForm((current) => !current);
              }}
              className="mobile-action mobile-action-primary mt-5 w-full"
            >
              {showForm ? "Fechar lancamento" : "+ Adicionar lancamento"}
            </button>

            {showForm ? (
              <form onSubmit={saveLancamento} className="card mt-4 p-4">
                <h2 className="text-lg font-black text-graphite">{editingLancamentoId ? "Editar lancamento" : "Novo lancamento"}</h2>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="label block">Data</span>
                    <input className="input" type="date" value={form.data_lancamento} onChange={(event) => setForm({ ...form, data_lancamento: event.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="label block">Tipo</span>
                      <select className="input" value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value, categoria: "" })}>
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
                  {isSaving ? "Salvando..." : editingLancamentoId ? "Salvar alteracoes" : "Salvar lancamento"}
                </button>
                {editingLancamentoId ? (
                  <button type="button" onClick={cancelEditLancamento} disabled={isSaving} className="mobile-action mt-3 w-full border border-black/10 bg-white text-graphite disabled:opacity-60">
                    Cancelar edicao
                  </button>
                ) : null}
              </form>
            ) : null}

            <section className="card mt-6 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cement">Filtros</p>
                  <h2 className="mt-1 text-lg font-black text-graphite">Lancamentos financeiros</h2>
                </div>
                <button type="button" onClick={() => setFilters(emptyFilters)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-graphite">
                  Limpar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="label block">Periodo</span>
                  <select className="input" value={filters.periodo} onChange={(event) => setFilters({ ...filters, periodo: event.target.value as PeriodoFiltro })}>
                    <option value="todos">todos</option>
                    <option value="hoje">hoje</option>
                    <option value="semana">esta semana</option>
                    <option value="mes">este mes</option>
                    <option value="personalizado">personalizado</option>
                  </select>
                </label>

                {filters.periodo === "personalizado" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="label block">Data inicial</span>
                      <input className="input" type="date" value={filters.dataInicial} onChange={(event) => setFilters({ ...filters, dataInicial: event.target.value })} />
                    </label>
                    <label className="block">
                      <span className="label block">Data final</span>
                      <input className="input" type="date" value={filters.dataFinal} onChange={(event) => setFilters({ ...filters, dataFinal: event.target.value })} />
                    </label>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label block">Tipo</span>
                    <select className="input" value={filters.tipo} onChange={(event) => setFilters({ ...filters, tipo: event.target.value })}>
                      <option value="todos">todos</option>
                      <option value="entrada">entrada</option>
                      <option value="saida">saida</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label block">Status</span>
                    <select className="input" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                      <option value="todos">todos</option>
                      {statusLancamentoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="label block">Categoria</span>
                  <select className="input" value={filters.categoria} onChange={(event) => setFilters({ ...filters, categoria: event.target.value })}>
                    <option value="todas">todas</option>
                    {categoriaFilterOptions.hasSemCategoria ? <option value="sem-categoria">sem categoria</option> : null}
                    {categoriaFilterOptions.labels.map((label) => <option key={label} value={label}>{label}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">Entradas filtradas</p>
                <p className="mt-2 text-lg font-black text-graphite">{currencyBRL(resumoFiltrado.entradas)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">Saidas filtradas</p>
                <p className="mt-2 text-lg font-black text-wood">{currencyBRL(resumoFiltrado.saidas)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">Saldo filtrado</p>
                <p className="mt-2 text-lg font-black text-graphite">{currencyBRL(resumoFiltrado.saldo)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">A receber</p>
                <p className="mt-2 text-lg font-black text-graphite">{currencyBRL(resumoFiltrado.pendenteReceber)}</p>
              </div>
              <div className="card col-span-2 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cement">A pagar</p>
                <p className="mt-2 text-lg font-black text-wood">{currencyBRL(resumoFiltrado.pendentePagar)}</p>
              </div>
            </section>

            <section className="card mt-4 p-4">
              <h2 className="text-lg font-black text-graphite">Resumo por categoria</h2>
              <div className="mt-3 space-y-3">
                {!resumoPorCategoria.length ? <p className="text-sm font-bold text-cement">Nenhuma categoria no periodo filtrado.</p> : null}
                {resumoPorCategoria.map((categoria) => (
                  <div key={categoria.categoria} className="rounded-2xl bg-technical p-3">
                    <p className="font-black text-graphite">{categoria.categoria}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-black text-cement">
                      <div>
                        <p>Entradas</p>
                        <p className="mt-1 text-graphite">{currencyBRL(categoria.entradas)}</p>
                      </div>
                      <div>
                        <p>Saidas</p>
                        <p className="mt-1 text-wood">{currencyBRL(categoria.saidas)}</p>
                      </div>
                      <div>
                        <p>Saldo</p>
                        <p className="mt-1 text-graphite">{currencyBRL(categoria.saldo)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <h2 className="mt-6 text-lg font-black text-graphite">Lancamentos financeiros</h2>
            <div className="mt-3 space-y-3">
              {!lancamentos.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum lancamento cadastrado ainda.</div> : null}
              {lancamentos.length && !lancamentosFiltrados.length ? <div className="card p-4 text-sm font-bold text-cement">Nenhum lancamento encontrado para os filtros selecionados.</div> : null}
              {lancamentosFiltrados.map((lancamento) => (
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
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm font-black">
                    <button type="button" onClick={() => editLancamento(lancamento)} disabled={isSaving || deletingLancamentoId === lancamento.id} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-graphite disabled:opacity-60">
                      Editar
                    </button>
                    <button type="button" onClick={() => deleteLancamento(lancamento.id)} disabled={isSaving || deletingLancamentoId === lancamento.id} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-graphite disabled:opacity-60">
                      {deletingLancamentoId === lancamento.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
