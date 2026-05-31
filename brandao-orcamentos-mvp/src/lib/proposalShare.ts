import { currencyBRL } from "@/lib/format";

type ProposalShareMessageInput = {
  clientName?: string | null;
  quoteCode?: string | null;
  totalValue?: number | null;
  validUntil?: string | null;
  publicUrl: string;
  professionalName?: string | null;
};

function hasShareValue(value: unknown) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== "" && normalized !== "não informado" && normalized !== "nao informado" && normalized !== "-" && normalized !== "--";
}

function cleanValue(value: unknown) {
  return hasShareValue(value) ? String(value).trim() : "";
}

export function normalizeBrazilWhatsApp(phone?: string | null) {
  const digits = cleanValue(phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function formatProposalValidity(validUntil?: string | null) {
  if (!hasShareValue(validUntil)) return "";
  return new Date(String(validUntil)).toLocaleDateString("pt-BR");
}

export function buildProposalWhatsAppMessage({
  clientName,
  quoteCode,
  totalValue,
  validUntil,
  publicUrl,
  professionalName,
}: ProposalShareMessageInput) {
  const details = [
    cleanValue(clientName) ? `Cliente: ${cleanValue(clientName)}` : "",
    cleanValue(quoteCode) ? `Código: ${cleanValue(quoteCode)}` : "",
    totalValue !== null && totalValue !== undefined ? `Valor total: ${currencyBRL(Number(totalValue))}` : "",
    formatProposalValidity(validUntil) ? `Validade: ${formatProposalValidity(validUntil)}` : "",
  ].filter(Boolean);

  return [
    "Olá, segue sua proposta comercial.",
    "",
    ...details,
    "",
    "Acesse sua proposta pelo link:",
    publicUrl,
    "",
    "Qualquer dúvida, fico à disposição.",
    cleanValue(professionalName) || "Obra Fechada",
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = normalizeBrazilWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
}
