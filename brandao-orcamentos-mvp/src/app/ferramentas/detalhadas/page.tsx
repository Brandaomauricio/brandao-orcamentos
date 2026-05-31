import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";
import { toolCards } from "@/data/mock";

export default function DetailedToolsPage() {
  return (
    <AppShell>
      <AppHeader title="Ferramentas detalhadas" subtitle="Acesse os recursos que ajudam antes, durante e depois da proposta." />
      <section className="grid grid-cols-1 gap-3 px-5">
        {toolCards.map((tool) => (
          <CardLink key={tool.title} href={tool.href} title={tool.title} description="Abrir conteúdo e modelos prontos." />
        ))}
      </section>
    </AppShell>
  );
}
