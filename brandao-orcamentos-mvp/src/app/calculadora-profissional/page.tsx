"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { currencyBRL } from "@/lib/format";

type CalculatorForm = {
  rendaMensal: string;
  custosFixos: string;
  diasTrabalhadosMes: string;
  metragem: string;
  diasObra: string;
  diariaAjudante: string;
  diasAjudante: string;
  deslocamento: string;
  outrosCustos: string;
  dificuldadePercentual: string;
  margemLucro: string;
  margemNegociacao: string;
};

const initialForm: CalculatorForm = {
  rendaMensal: "",
  custosFixos: "",
  diasTrabalhadosMes: "22",
  metragem: "",
  diasObra: "",
  diariaAjudante: "",
  diasAjudante: "",
  deslocamento: "",
  outrosCustos: "",
  dificuldadePercentual: "",
  margemLucro: "20",
  margemNegociacao: "10",
};

function parseNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputValue(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuantityValue(value: number) {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}

export default function ProfessionalCalculatorPage() {
  const router = useRouter();
  const [form, setForm] = useState<CalculatorForm>(initialForm);
  const [message, setMessage] = useState("");

  const results = useMemo(() => {
    const rendaMensal = parseNumber(form.rendaMensal);
    const custosFixos = parseNumber(form.custosFixos);
    const diasTrabalhadosMes = parseNumber(form.diasTrabalhadosMes);
    const metragem = parseNumber(form.metragem);
    const diasObra = parseNumber(form.diasObra);
    const diariaAjudante = parseNumber(form.diariaAjudante);
    const diasAjudante = parseNumber(form.diasAjudante);
    const deslocamento = parseNumber(form.deslocamento);
    const outrosCustos = parseNumber(form.outrosCustos);
    const dificuldadePercentual = parseNumber(form.dificuldadePercentual);
    const margemLucroPercentual = parseNumber(form.margemLucro);
    const margemNegociacaoPercentual = parseNumber(form.margemNegociacao);

    const diariaMinima = diasTrabalhadosMes > 0 ? (rendaMensal + custosFixos) / diasTrabalhadosMes : 0;
    const custoAjudante = diariaAjudante * diasAjudante;
    const custosObra = custoAjudante + deslocamento + outrosCustos;
    const maoDeObra = diariaMinima * diasObra;
    const base = maoDeObra + custosObra;
    const acrescimoDificuldade = (base * dificuldadePercentual) / 100;
    const subtotal = base + acrescimoDificuldade;
    const lucro = (subtotal * margemLucroPercentual) / 100;
    const precoMinimo = subtotal + lucro;
    const margemNegociacao = (precoMinimo * margemNegociacaoPercentual) / 100;
    const precoRecomendado = precoMinimo + margemNegociacao;
    const precoMetro = metragem > 0 ? precoRecomendado / metragem : 0;

    return {
      metragem,
      diariaMinima,
      custosObra,
      precoMinimo,
      precoRecomendado,
      precoMetro,
    };
  }, [form]);

  function updateField(field: keyof CalculatorForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function useValueInBudget() {
    const hasMeterage = results.metragem > 0;
    const price = hasMeterage ? results.precoMetro : results.precoRecomendado;

    if (price <= 0) {
      setMessage("Preencha os dados da obra para gerar um valor antes de enviar ao orçamento.");
      return;
    }

    window.localStorage.setItem(
      "brandao_pending_service",
      JSON.stringify({
        name: "Mão de obra calculada - Calculadora Profissional",
        unit: hasMeterage ? "m²" : "serviço",
        price: formatInputValue(price),
        quantity: hasMeterage ? formatQuantityValue(results.metragem) : "1",
      }),
    );

    router.push("/orcamentos/novo");
  }

  return (
    <AppShell>
      <AppHeader title="Calculadora Profissional" subtitle="Beta para calcular diária, custos, lucro e margem antes de montar a proposta." />

      <section className="space-y-4 px-5">
        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">1. Base da diária</p>
          <div className="mt-4 space-y-3">
            <input className="input" inputMode="decimal" placeholder="Quanto quer tirar por mês" value={form.rendaMensal} onChange={(event) => updateField("rendaMensal", event.target.value)} />
            <div>
              <input className="input" inputMode="decimal" placeholder="Custos fixos mensais da profissão" value={form.custosFixos} onChange={(event) => updateField("custosFixos", event.target.value)} />
              <p className="mt-2 text-xs font-bold leading-5 text-cement">
                Não coloque aqui custos específicos da obra. Use este campo para despesas mensais da profissão, como ferramentas, manutenção, telefone, internet, app, contador, EPI e divulgação.
              </p>
            </div>
            <input className="input" inputMode="decimal" placeholder="Dias trabalhados no mês" value={form.diasTrabalhadosMes} onChange={(event) => updateField("diasTrabalhadosMes", event.target.value)} />
          </div>
          <div className="mt-4 rounded-2xl bg-technical p-4">
            <p className="text-sm font-bold text-cement">Sua diária mínima</p>
            <p className="mt-1 text-2xl font-black text-warning">{currencyBRL(results.diariaMinima)}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-cement">
              Essa é a base mínima do seu dia de trabalho antes de considerar os custos específicos da obra.
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">2. Dados da obra</p>
          <p className="mt-3 rounded-2xl bg-technical p-3 text-sm font-bold leading-6 text-cement">
            Regra para não repetir custo: o que é mensal entra na Base da diária. O que é causado por esta obra entra em Dados da obra.
          </p>
          <div className="mt-4 space-y-3">
            <input className="input" inputMode="decimal" placeholder="Metragem" value={form.metragem} onChange={(event) => updateField("metragem", event.target.value)} />
            <input className="input" inputMode="decimal" placeholder="Dias estimados de execução" value={form.diasObra} onChange={(event) => updateField("diasObra", event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" inputMode="decimal" placeholder="Diária do ajudante" value={form.diariaAjudante} onChange={(event) => updateField("diariaAjudante", event.target.value)} />
              <input className="input" inputMode="decimal" placeholder="Dias do ajudante" value={form.diasAjudante} onChange={(event) => updateField("diasAjudante", event.target.value)} />
            </div>
            <div>
              <input className="input" inputMode="decimal" placeholder="Deslocamento desta obra" value={form.deslocamento} onChange={(event) => updateField("deslocamento", event.target.value)} />
              <p className="mt-2 text-xs font-bold leading-5 text-cement">
                Coloque aqui apenas o custo de deslocamento desta obra: combustível, pedágio, estacionamento ou viagem fora do padrão.
              </p>
            </div>
            <input className="input" inputMode="decimal" placeholder="Outros custos" value={form.outrosCustos} onChange={(event) => updateField("outrosCustos", event.target.value)} />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">3. Margens</p>
          <div className="mt-4 space-y-3">
            <input className="input" inputMode="decimal" placeholder="Acréscimo por dificuldade %" value={form.dificuldadePercentual} onChange={(event) => updateField("dificuldadePercentual", event.target.value)} />
            <input className="input" inputMode="decimal" placeholder="Margem de lucro %" value={form.margemLucro} onChange={(event) => updateField("margemLucro", event.target.value)} />
            <input className="input" inputMode="decimal" placeholder="Margem de negociação %" value={form.margemNegociacao} onChange={(event) => updateField("margemNegociacao", event.target.value)} />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-wood">Resultado</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
              <span className="font-bold text-cement">Diária mínima</span>
              <strong className="text-graphite">{currencyBRL(results.diariaMinima)}</strong>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
              <span className="font-bold text-cement">Custos da obra</span>
              <strong className="text-graphite">{currencyBRL(results.custosObra)}</strong>
            </div>
            <div className="rounded-2xl bg-technical p-4">
              <p className="text-sm font-bold text-cement">Não fechar abaixo de</p>
              <p className="mt-1 text-2xl font-black text-warning">{currencyBRL(results.precoMinimo)}</p>
            </div>
            <div className="rounded-2xl bg-warning p-4 text-graphite">
              <p className="text-sm font-black">Preço recomendado</p>
              <p className="mt-1 text-3xl font-black">{currencyBRL(results.precoRecomendado)}</p>
            </div>
            {results.metragem > 0 ? (
              <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                <span className="font-bold text-cement">Preço por m²</span>
                <strong className="text-graphite">{currencyBRL(results.precoMetro)}</strong>
              </div>
            ) : null}
          </div>

          <button type="button" onClick={useValueInBudget} className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
            Usar esse valor no orçamento
          </button>
          {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        </div>
      </section>
    </AppShell>
  );
}
