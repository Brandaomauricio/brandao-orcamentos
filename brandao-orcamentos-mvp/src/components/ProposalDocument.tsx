import Link from "next/link";
import { currencyBRL } from "@/lib/format";

export type ProposalItem = {
  id: string;
  service_name: string | null;
  description: string | null;
  unit: string | null;
  unit_price: number | null;
  quantity: number | null;
  total_price: number | null;
  sort_order?: number | null;
};

export type ProposalClient = {
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
} | null;

export type ProposalProfile = {
  professional_name: string | null;
  responsible_name: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  city_state?: string | null;
  document?: string | null;
  document_number: string | null;
  signature_text: string | null;
  institutional_note?: string | null;
  logo_url: string | null;
} | null;

export type ProposalBudget = {
  id: string;
  proposal_number: string | null;
  status: string | null;
  total_value: number | null;
  created_at: string | null;
  valid_until: string | null;
  down_payment_value: number | null;
  down_payment_percent: number | null;
  payment_terms: string | null;
  commercial_terms?: string | null;
  commercial_conditions: string | null;
  execution_deadline: string | null;
  approval_text: string | null;
  notes?: string | null;
  technical_notes: string | null;
  warranty_text: string | null;
  quote_items: ProposalItem[] | null;
};

type ProposalDocumentProps = {
  budget: ProposalBudget;
  client: ProposalClient;
  profile: ProposalProfile;
  showActions?: boolean;
};

const statusLabels: Record<string, string> = {
  draft: "rascunho",
  sent: "enviado",
  approved: "aprovado",
  rejected: "recusado",
  completed: "concluído",
};

function formatQuantity(quantity: number, unit: string) {
  const formattedQuantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(quantity);
  return unit.length <= 3 ? `${formattedQuantity}${unit}` : `${formattedQuantity} ${unit}`;
}

export function hasRealValue(value: unknown) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== "" && normalized !== "não informado" && normalized !== "nao informado" && normalized !== "-" && normalized !== "--";
}

function realValue(value: unknown) {
  return hasRealValue(value) ? String(value).trim() : "";
}

function DefaultProposalLogo() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-graphite/10 bg-white px-2 text-center">
      <span className="text-[20px] font-black leading-none text-graphite">Obra Fechada</span>
      <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-wood">por Brandão</span>
    </div>
  );
}

function FieldRow({ label, value, withBorder = true, valueClassName = "text-right font-black text-graphite" }: { label: string; value: unknown; withBorder?: boolean; valueClassName?: string }) {
  if (!hasRealValue(value)) return null;

  return (
    <div className={`flex justify-between gap-3 ${withBorder ? "border-b border-black/5 pb-2" : ""}`}>
      <dt className="font-bold text-cement">{label}</dt>
      <dd className={valueClassName}>{String(value).trim()}</dd>
    </div>
  );
}

export function ProposalDocument({ budget, client, profile, showActions = true }: ProposalDocumentProps) {
  const proposalDate = budget.created_at ? new Date(budget.created_at).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");
  const validUntil = hasRealValue(budget.valid_until) ? new Date(String(budget.valid_until)).toLocaleDateString("pt-BR") : "A combinar";
  const quoteCode = budget.proposal_number || budget.id.slice(0, 8).toUpperCase();
  const statusLabel = statusLabels[budget.status || ""] || budget.status || "rascunho";
  const commercialSource = realValue(budget.commercial_terms) || realValue(budget.commercial_conditions);
  const commercialLines = commercialSource.split("\n").map((line) => line.trim()).filter(hasRealValue);
  const executionDeadlineFromText = commercialLines.find((line) => line.toLowerCase().startsWith("prazo de execução:"))?.replace(/prazo de execução:/i, "").trim();
  const downPaymentFromText = commercialLines.find((line) => line.toLowerCase().startsWith("sinal/entrada:"))?.replace(/sinal\/entrada:/i, "").trim();
  const approvalTextFromText = commercialLines.find((line) => line.toLowerCase().startsWith("aprovação:"))?.replace(/aprovação:/i, "").trim();
  const commercialNotes = commercialLines
    .filter((line) => !line.toLowerCase().startsWith("prazo de execução:"))
    .filter((line) => !line.toLowerCase().startsWith("sinal/entrada:"))
    .filter((line) => !line.toLowerCase().startsWith("aprovação:"))
    .join("\n");
  const downPaymentLabel = budget.down_payment_value
    ? currencyBRL(Number(budget.down_payment_value))
    : budget.down_payment_percent
      ? `${Number(budget.down_payment_percent).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
      : realValue(downPaymentFromText) || "A combinar";
  const professionalName = realValue(profile?.professional_name) || "Dados do profissional";
  const clientName = realValue(client?.name) || "Cliente";
  const professionalLocation = realValue(profile?.city_state) || [realValue(profile?.city), realValue(profile?.state)].filter(Boolean).join("/");
  const professionalDocument = realValue(profile?.document_number) || realValue(profile?.document);
  const signatureText = realValue(profile?.signature_text) || realValue(profile?.institutional_note) || "Gerado pelo Obra Fechada — por Brandão.";
  const technicalNotes = realValue(budget.technical_notes) || realValue(budget.notes);
  const customLogoUrl = realValue(profile?.logo_url);

  return (
    <div className="proposal-page mx-auto max-w-[794px] bg-white p-7 shadow-soft print:max-w-none print:p-0 print:shadow-none">
      <header className="proposal-section overflow-hidden rounded-2xl border border-black/10">
        <div className="bg-graphite p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex h-[105px] w-[170px] items-center justify-center rounded-xl bg-white p-3 [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
              {customLogoUrl ? <img src={customLogoUrl} alt={professionalName} className="h-full w-full rounded-md object-contain" /> : <DefaultProposalLogo />}
            </div>
            <div className="sm:text-right">
              <p className="text-3xl font-black leading-tight text-white">Proposta Comercial</p>
              <h1 className="mt-2 text-lg font-black uppercase tracking-[0.16em] text-warning">{professionalName}</h1>
              <p className="mt-2 text-xs font-bold text-white/75">Documento técnico-comercial para execução de serviços</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-t-4 border-warning bg-white text-sm sm:grid-cols-4">
          <div className="border-b border-r border-black/10 p-4 sm:border-b-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">Código</p>
            <p className="mt-1 font-black text-graphite">#{quoteCode}</p>
          </div>
          <div className="border-b border-black/10 p-4 sm:border-b-0 sm:border-r">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">Emissão</p>
            <p className="mt-1 font-black text-graphite">{proposalDate}</p>
          </div>
          <div className="border-r border-black/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">Validade</p>
            <p className="mt-1 font-black text-graphite">{validUntil}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">Status</p>
            <p className="mt-1 inline-block rounded-full bg-warning px-3 py-1 text-xs font-black text-graphite">{statusLabel}</p>
          </div>
        </div>
      </header>

      <section className="proposal-section mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-wood">Dados do profissional</p>
          <h2 className="mt-3 text-xl font-black text-graphite">{professionalName}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <FieldRow label="Responsável" value={profile?.responsible_name} />
            <FieldRow label="WhatsApp" value={profile?.whatsapp} />
            <FieldRow label="E-mail" value={profile?.email} />
            <FieldRow label="Cidade/UF" value={professionalLocation} />
            <FieldRow label="Documento" value={professionalDocument} withBorder={false} />
          </dl>
        </div>

        <div className="rounded-2xl border border-black/10 bg-technical p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-wood">Dados do cliente</p>
          <h2 className="mt-3 text-xl font-black text-graphite">{clientName}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <FieldRow label="WhatsApp" value={client?.whatsapp} />
            <FieldRow label="E-mail" value={client?.email} />
            <FieldRow label="Endereço da obra" value={client?.address} withBorder={false} valueClassName="max-w-[230px] text-right font-black text-graphite" />
          </dl>
        </div>
      </section>

      <section className="proposal-section mt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-wood">Composição da proposta</p>
            <h2 className="mt-1 text-2xl font-black text-graphite">Serviços e valores</h2>
          </div>
          <span className="rounded-full bg-graphite px-4 py-2 text-sm font-black text-warning">Mão de obra profissional</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="proposal-table w-full min-w-[680px] border-collapse text-sm">
            <thead className="bg-graphite text-white">
              <tr>
                <th className="w-[42%] px-4 py-4 text-left font-black">Serviço</th>
                <th className="px-4 py-4 text-left font-black">Unidade</th>
                <th className="px-4 py-4 text-right font-black">Quantidade</th>
                <th className="px-4 py-4 text-right font-black">Valor unitário</th>
                <th className="px-4 py-4 text-right font-black">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(budget.quote_items ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center font-bold text-cement">Nenhum serviço adicionado à proposta.</td></tr>
              ) : null}
              {(budget.quote_items ?? []).map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-technical"}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-black text-graphite">{item.service_name || item.description || "Serviço não informado"}</p>
                    {item.description && item.description !== item.service_name ? <p className="mt-1 text-xs text-cement">{item.description}</p> : null}
                  </td>
                  <td className="px-4 py-4 align-top text-cement">{item.unit || "serviço"}</td>
                  <td className="px-4 py-4 text-right align-top text-cement">{formatQuantity(Number(item.quantity ?? 0), item.unit || "serviço")}</td>
                  <td className="px-4 py-4 text-right align-top text-cement">{currencyBRL(Number(item.unit_price ?? 0))}</td>
                  <td className="px-4 py-4 text-right align-top font-black text-graphite">{currencyBRL(Number(item.total_price ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="proposal-total mt-5 flex justify-end">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-graphite bg-graphite text-white">
            <div className="bg-warning px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-graphite">Total da proposta</div>
            <div className="flex items-center justify-between gap-4 px-5 py-5 text-2xl font-black"><span>Valor final</span><span className="text-warning">{currencyBRL(Number(budget.total_value ?? 0))}</span></div>
          </div>
        </div>
      </section>

      <section className="proposal-section mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 p-5">
          <h2 className="text-lg font-black text-graphite">Condições comerciais</h2>
          <div className="mt-3 space-y-2 text-sm text-cement">
            <p><strong className="text-graphite">Forma de pagamento:</strong> {realValue(budget.payment_terms) || "A combinar"}</p>
            <p><strong className="text-graphite">Sinal/entrada:</strong> {downPaymentLabel}</p>
            <p><strong className="text-graphite">Prazo de execução:</strong> {realValue(budget.execution_deadline) || realValue(executionDeadlineFromText) || "A combinar"}</p>
            <p><strong className="text-graphite">Validade da proposta:</strong> {validUntil}</p>
            <p className="whitespace-pre-line"><strong className="text-graphite">Observações comerciais:</strong> {commercialNotes || "A combinar."}</p>
            <p><strong className="text-graphite">Aprovação:</strong> {realValue(budget.approval_text) || realValue(approvalTextFromText) || "A proposta poderá ser aprovada por confirmação escrita do cliente."}</p>
            <p><strong className="text-graphite">Garantia:</strong> {realValue(budget.warranty_text) || "Conforme condições do serviço, materiais aplicados e estado da obra."}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-technical p-5">
          <h2 className="text-lg font-black text-graphite">Observações técnicas</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-cement">{technicalNotes || "Os serviços serão executados conforme condições verificadas em obra e orientações técnicas aplicáveis."}</p>
        </div>
      </section>

      <footer className="proposal-section mt-8 rounded-2xl border border-black/10 p-5">
        <p className="text-center text-sm font-bold leading-6 text-cement">{signatureText}</p>
        <div className="mt-10 grid grid-cols-1 gap-10 text-center text-sm text-cement sm:grid-cols-2">
          <div><div className="border-t border-black/40 pt-3">Assinatura do cliente</div></div>
          <div><div className="border-t border-black/40 pt-3">Assinatura do profissional</div></div>
        </div>
        <p className="mt-8 text-center text-xs font-black uppercase tracking-[0.2em] text-wood">{professionalName}</p>
      </footer>

      {showActions ? (
        <section className="mt-5 space-y-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">Imprimir / Salvar em PDF</button>
          <Link href={`/orcamentos/${budget.id}`} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">Voltar aos detalhes</Link>
        </section>
      ) : null}
    </div>
  );
}
