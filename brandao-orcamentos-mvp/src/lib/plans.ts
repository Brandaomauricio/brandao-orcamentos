import { supabase } from "@/lib/supabase/client";

export const FREE_MONTHLY_QUOTES_LIMIT = 5;
export const FREE_CLIENTS_LIMIT = 10;

export type AppPlan = "free" | "pro";

export const FREE_LIMIT_MESSAGE = "Você atingiu o limite do plano gratuito. Para continuar criando orçamentos, será necessário ativar o Plano Pró.";

export function normalizePlan(plan?: string | null): AppPlan {
  return plan === "pro" ? "pro" : "free";
}

export async function getCurrentUserPlan(userId: string): Promise<AppPlan> {
  const { data, error } = await supabase
    .from("profiles")
    .select("current_plan")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Erro ao carregar plano do usuário:", error);
    return "free";
  }

  return normalizePlan(data?.[0]?.current_plan);
}

export async function canCreateQuoteThisMonth(userId: string) {
  const plan = await getCurrentUserPlan(userId);
  if (plan === "pro") return { allowed: true, plan, used: 0, limit: null };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Erro ao verificar limite de orçamentos:", error);
    return { allowed: true, plan, used: 0, limit: FREE_MONTHLY_QUOTES_LIMIT };
  }

  const used = count ?? 0;
  return { allowed: used < FREE_MONTHLY_QUOTES_LIMIT, plan, used, limit: FREE_MONTHLY_QUOTES_LIMIT };
}

export async function canCreateClient(userId: string) {
  const plan = await getCurrentUserPlan(userId);
  if (plan === "pro") return { allowed: true, plan, used: 0, limit: null };

  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao verificar limite de clientes:", error);
    return { allowed: true, plan, used: 0, limit: FREE_CLIENTS_LIMIT };
  }

  const used = count ?? 0;
  return { allowed: used < FREE_CLIENTS_LIMIT, plan, used, limit: FREE_CLIENTS_LIMIT };
}
