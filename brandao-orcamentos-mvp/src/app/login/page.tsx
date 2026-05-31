"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage("A conexão com o Supabase ainda não está configurada neste ambiente.");
      return;
    }

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local antes de cadastrar.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Erro ao cadastrar usuário:", error);
      setMessage("Não foi possível criar sua conta agora. Confira e-mail, senha e tente novamente.");
    } else {
      setMessage("Cadastro criado. Confira seu e-mail se a confirmação estiver ativa.");
    }

    setIsLoading(false);
  }

  async function signIn() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local antes de entrar.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Erro ao entrar na conta:", error);
      setMessage("Não foi possível entrar. Confira seu e-mail e senha e tente novamente.");
    } else {
      setMessage("Login realizado com sucesso.");
      router.push("/clientes");
    }

    setIsLoading(false);
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local antes de sair.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao sair da conta:", error);
      setMessage("Não foi possível sair da conta agora. Tente novamente.");
    } else {
      setMessage("Logout realizado com sucesso.");
    }
    setIsLoading(false);
  }

  return (
    <AppShell>
      <AppHeader
        title="Acesse sua conta Obra Fechada"
        subtitle="Salve clientes, organize orçamentos e acompanhe seus compromissos em um só lugar."
      />
      <section className="px-5">
        <div className="card p-4">
          <div className="space-y-3">
            <input className="input" placeholder="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input className="input" placeholder="Senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={isLoading} onClick={signIn} className="block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft">
                Entrar
              </button>
              <button type="button" disabled={isLoading} onClick={signUp} className="block rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
                Cadastrar
              </button>
            </div>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
        {user ? (
          <div className="card mt-4 p-4">
            <p className="text-sm font-bold text-cement">Logado como</p>
            <p className="mt-1 font-black text-graphite">{user.email}</p>
            <button type="button" disabled={isLoading} onClick={signOut} className="mt-4 block w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black text-graphite">
              Sair
            </button>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
