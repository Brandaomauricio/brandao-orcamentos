export const PUBLIC_PROPOSAL_BASE_URL = "https://brandao-orcamentos.vercel.app";

type ProposalShareMessageInput = {
  clientName?: string | null;
  quoteCode?: string | null;
  publicUrl: string;
  professionalName?: string | null;
};

function toPlainText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasShareValue(value: unknown) {
  if (value === null || value === undefined) return false;
  const normalized = toPlainText(String(value).trim().toLowerCase());
  return normalized !== "" && normalized !== "nao informado" && normalized !== "-" && normalized !== "--";
}

function cleanValue(value: unknown) {
  return hasShareValue(value) ? toPlainText(String(value).trim()) : "";
}

export function getPublicProposalUrl(token: string) {
  return `${PUBLIC_PROPOSAL_BASE_URL}/proposta/${token}`;
}

export function normalizeBrazilWhatsApp(phone?: string | null) {
  const digits = cleanValue(phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function buildProposalWhatsAppMessage({
  clientName,
  quoteCode,
  publicUrl,
  professionalName,
}: ProposalShareMessageInput) {
  const details = [
    cleanValue(clientName) ? `Cliente: ${cleanValue(clientName)}` : "",
    cleanValue(quoteCode) ? `Codigo: ${cleanValue(quoteCode)}` : "",
  ].filter(Boolean);

  return [
    "Ola, segue sua proposta comercial.",
    "",
    ...details,
    "",
    "Acesse sua proposta pelo link:",
    publicUrl,
    "",
    "Qualquer duvida, fico a disposicao.",
    cleanValue(professionalName) || "Obra Fechada",
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = normalizeBrazilWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
}
