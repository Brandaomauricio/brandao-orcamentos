import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { TemplateManager } from "@/components/TemplateManager";

export default function CommercialTermsPage() {
  return (
    <AppShell>
      <AppHeader title="Condições comerciais" subtitle="Modelos para pagamento, validade, garantia e aprovação." />
      <TemplateManager
        category="condicoes_comerciais"
        applyLabel="Usar no orçamento"
        applyStorageKey="brandao_pending_commercial_terms"
        defaultItems={[
          { title: "Validade", content: "Validade da proposta: 7 dias." },
          { title: "Pagamento", content: "Pagamento conforme combinado na aprovação da proposta." },
          { title: "Garantia", content: "Garantia aplicada ao serviço executado, conforme condições da obra." },
        ]}
      />
    </AppShell>
  );
}
