"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { CardLink } from "@/components/CardLink";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["brandaopm14@gmail.com", "naobrapodcast@gmail.com", "brandao14@gmail.com"];

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}

export default function MorePage() {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => {
      setShowAdmin(isAdminEmail(data.user?.email));
    });
  }, []);

  return (
    <AppShell>
      <AppHeader title="Mais" subtitle="Configuracoes, suporte e recursos complementares." />
      <section className="grid grid-cols-1 gap-3 px-5">
        {showAdmin ? <CardLink href="/admin" title="Painel Admin" description="Gerencie planos e vencimentos." /> : null}
        <CardLink href="/minha-conta" title="Minha Conta" description="Dados profissionais e padroes." />
        <CardLink href="/clientes" title="Clientes" description="Contatos e historico de atendimento." />
        <CardLink href="/controle-obras" title="Controle de Obras" description="Obras, entradas, saidas e resultados." />
        <CardLink href="/ferramentas" title="Ferramentas" description="Checklists e modelos." />
        <CardLink href="/calculadora-profissional" title="Calculadora Profissional" description="Calcule preço mínimo, lucro e margem antes de montar a proposta." />
        <CardLink href="/tutorial-e-dicas" title="Tutorial e dicas" description="Aprenda o app." />
        <CardLink href="/fale-conosco" title="Fale conosco" description="Suporte e sugestoes." />
        <CardLink href="/planos" title="Planos" description="Free, Pro e acesso profissional." />
      </section>
    </AppShell>
  );
}
