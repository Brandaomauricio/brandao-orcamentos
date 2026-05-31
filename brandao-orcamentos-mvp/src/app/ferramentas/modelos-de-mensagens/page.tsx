import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { TemplateManager } from "@/components/TemplateManager";

export default function MessageTemplatesPage() {
  return (
    <AppShell>
      <AppHeader title="Modelos de mensagens" subtitle="Textos curtos para atendimento e envio de proposta." />
      <TemplateManager
        category="mensagens"
        defaultItems={[
          { title: "Envio de proposta", content: "Olá! Segue a proposta conforme conversamos. Fico à disposição para ajustar qualquer detalhe." },
          { title: "Confirmação de visita", content: "Posso confirmar sua visita técnica para o horário combinado?" },
          { title: "Proposta aprovada", content: "A proposta foi aprovada. Vamos alinhar a data de execução e os próximos passos." },
        ]}
      />
    </AppShell>
  );
}
