import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";

export default function LoginPage() {
  return (
    <AppShell>
      <AppHeader title="Entrar" subtitle="Acesse sua conta para criar e acompanhar seus orçamentos." />
      <section className="px-5">
        <div className="card p-4">
          <div className="space-y-3">
            <input className="input" placeholder="E-mail" />
            <input className="input" placeholder="Senha" type="password" />
            <ActionButton>Entrar</ActionButton>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
