import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { TemplateManager } from "@/components/TemplateManager";

export default function TechnicalNotesPage() {
  return (
    <AppShell>
      <AppHeader title="Observações técnicas" subtitle="Textos para deixar critérios e limitações claros na proposta." />
      <TemplateManager
        category="observacoes_tecnicas"
        applyLabel="Usar no orçamento"
        applyStorageKey="brandao_pending_technical_note"
        defaultItems={[
          { title: "Conferência da base", content: "Serviço sujeito à conferência da base no local antes da execução." },
          { title: "Materiais não inclusos", content: "Materiais não inclusos devem ser informados separadamente na proposta." },
          { title: "Alterações de escopo", content: "Alterações solicitadas após aprovação podem gerar novo orçamento." },
        ]}
      />
    </AppShell>
  );
}
