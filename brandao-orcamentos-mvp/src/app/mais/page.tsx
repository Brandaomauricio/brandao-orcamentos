import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";

export default function MorePage() {
  return (
    <AppShell>
      <AppHeader title="Mais" subtitle="Configurações, suporte e recursos complementares." />
      <section className="grid grid-cols-1 gap-3 px-5">
        <CardLink href="/minha-conta" title="Minha Conta" description="Dados profissionais e padrões." />
        <CardLink href="/clientes" title="Clientes" description="Contatos e histórico de atendimento." />
        <CardLink href="/ferramentas" title="Ferramentas" description="Checklists e modelos." />
        <CardLink href="/tutorial-e-dicas" title="Tutorial e dicas" description="Aprenda o app." />
        <CardLink href="/fale-conosco" title="Fale conosco" description="Suporte e sugestões." />
        <CardLink href="/planos" title="Planos" description="Grátis, Pró e acesso aluno." />
      </section>
    </AppShell>
  );
}
