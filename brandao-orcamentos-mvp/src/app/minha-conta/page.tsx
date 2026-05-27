import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";

const sections = [
  "Perfil profissional",
  "Identidade do orçamento",
  "Dados comerciais padrão",
  "Meus serviços",
  "Modelos de texto",
  "Preferências do app",
  "Plano atual",
];

export default function AccountPage() {
  return (
    <AppShell>
      <AppHeader title="Minha Conta" subtitle="Configure seus dados profissionais, modelos e preferências." />
      <section className="px-5">
        <div className="card p-4">
          <h2 className="text-lg font-black text-graphite">Brandão Pisos Vinílicos</h2>
          <p className="mt-1 text-sm text-cement">WhatsApp: (67) 99999-9999</p>
          <p className="mt-1 text-sm text-cement">Plano atual: Pró — Método Obra Fechada</p>
        </div>

        <div className="mt-4 space-y-3">
          {sections.map((section) => (
            <div key={section} className="card flex items-center justify-between p-4">
              <div>
                <h3 className="font-black text-graphite">{section}</h3>
                <p className="text-sm text-cement">Editar configurações</p>
              </div>
              <span className="text-xl font-black text-wood">›</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
