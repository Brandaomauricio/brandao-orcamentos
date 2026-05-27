import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";
import { toolCards } from "@/data/mock";

const descriptions: Record<string, string> = {
  "Checklist de visita técnica": "Avalie a obra antes de fechar o orçamento.",
  "Checklist antes da instalação": "Confira se a obra está pronta para execução.",
  "Modelos de mensagens": "Textos prontos para WhatsApp e atendimento.",
  "Serviços periféricos": "Entenda e explique o que é adicional.",
  "Observações técnicas": "Textos prontos para proteger sua proposta.",
  "Condições comerciais": "Modelos para pagamento, validade e garantia.",
};

export default function ToolsPage() {
  return (
    <AppShell>
      <AppHeader title="Ferramentas" subtitle="Recursos práticos para organizar visitas, propostas, instalação e comunicação." />
      <section className="grid grid-cols-1 gap-3 px-5">
        {toolCards.map((title) => (
          <CardLink key={title} href="/ferramentas" title={title} description={descriptions[title]} />
        ))}
      </section>
    </AppShell>
  );
}
