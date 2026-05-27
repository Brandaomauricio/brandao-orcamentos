import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";

export default function ContactPage() {
  return (
    <AppShell>
      <AppHeader title="Fale conosco" subtitle="Precisa de ajuda? Tire dúvidas, envie sugestões ou fale sobre parcerias." />
      <section className="grid grid-cols-1 gap-3 px-5">
        <CardLink href="/fale-conosco" title="WhatsApp de suporte" description="Fale direto com o atendimento." />
        <CardLink href="/fale-conosco" title="Enviar sugestão" description="Ajude a melhorar o app." />
        <CardLink href="/fale-conosco" title="Relatar problema" description="Avise sobre erro ou dificuldade." />
        <CardLink href="/fale-conosco" title="Parcerias e marcas" description="Contato para marcas parceiras." />
      </section>
    </AppShell>
  );
}
