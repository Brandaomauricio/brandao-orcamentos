import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ActionButton";
import { StatusPill } from "@/components/StatusPill";
import { appointments } from "@/data/mock";

export default function AgendaPage() {
  return (
    <AppShell>
      <AppHeader title="Agenda" subtitle="Organize visitas técnicas, medições, instalações e retornos." />
      <section className="px-5">
        <ActionButton>+ Novo compromisso</ActionButton>
        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-black text-cement">
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((day, index) => (
            <div key={day} className={index === 2 ? "rounded-2xl bg-warning p-3 text-graphite" : "rounded-2xl bg-white p-3"}>
              {day}
            </div>
          ))}
        </div>

        <h2 className="mt-6 text-lg font-black text-graphite">Próximos compromissos</h2>
        <div className="mt-3 space-y-3">
          {appointments.map((item) => (
            <div key={item.client} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-graphite">{item.title}</h3>
                  <p className="mt-1 text-sm text-cement">{item.client}</p>
                  <p className="mt-1 text-sm font-bold text-wood">{item.time}</p>
                </div>
                <StatusPill>{item.status}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
