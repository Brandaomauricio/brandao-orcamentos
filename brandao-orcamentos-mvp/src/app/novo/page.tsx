import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";

export default function NewItemPage() {
  return (
    <AppShell>
      <AppHeader title="Novo" subtitle="Escolha o que deseja criar agora." />
      <section className="grid grid-cols-1 gap-3 px-5">
        <CardLink href="/orcamentos/novo" title="Novo Orçamento" description="Monte uma proposta profissional para enviar ao cliente." />
        <CardLink href="/compromissos/novo" title="Novo Compromisso" description="Agende visita, medição, instalação ou retorno." />
      </section>
    </AppShell>
  );
}
