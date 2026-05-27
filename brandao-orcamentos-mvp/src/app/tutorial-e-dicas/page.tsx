import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";

const tutorials = [
  ["Como criar um orçamento", "Monte sua proposta passo a passo."],
  ["Como gerar PDF e link", "Compartilhe sua proposta com o cliente."],
  ["Como usar a agenda", "Organize visitas, medições e instalações."],
  ["Cadastrar serviços e preços", "Salve seus serviços para usar depois."],
  ["Serviços periféricos", "Explique o que é adicional."],
  ["Dicas de apresentação", "Valorize sua proposta profissional."],
];

export default function TutorialPage() {
  return (
    <AppShell>
      <AppHeader title="Tutorial e dicas" subtitle="Aprenda a usar o app e melhore a apresentação dos seus orçamentos." />
      <section className="grid grid-cols-1 gap-3 px-5">
        {tutorials.map(([title, description]) => (
          <CardLink key={title} href="/tutorial-e-dicas" title={title} description={description} />
        ))}
      </section>
    </AppShell>
  );
}
