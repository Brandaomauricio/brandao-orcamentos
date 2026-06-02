import { supabase } from "@/lib/supabase/client";

export const FREE_MONTHLY_QUOTES_LIMIT = 5;
export const FREE_CLIENTS_LIMIT = 10;

export type AppPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "blocked";
export type UserPlanAccess = {
  currentPlan: AppPlan;
  effectivePlan: AppPlan;
  subscriptionStatus: SubscriptionStatus;
  paidUntil: string | null;
  isPastDue: boolean;
  message: string;
};

export const FREE_LIMIT_MESSAGE = "Voce atingiu o limite do plano gratuito. Para continuar criando orcamentos, sera necessario ativar o Plano Pro.";
export const PAST_DUE_MESSAGE = "Seu Plano Pro esta vencido. Para continuar usando os recursos profissionais, regularize sua assinatura.";

export function normalizePlan(plan?: string | null): AppPlan {
  return plan === "pro" ? "pro" : "free";
}

export function normalizeSubscriptionStatus(status?: string | null): SubscriptionStatus {
  return status === "active" || status === "past_due" || status === "canceled" || status === "blocked" ? status : "active";
}

function isPaidUntilValid(paidUntil?: string | null) {
  if (!paidUntil) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paidUntilDate = new Date(paidUntil);
  paidUntilDate.setHours(0, 0, 0, 0);
  return paidUntilDate >= today;
}

export async function getUserPlanAccess(userId: string): Promise<UserPlanAccess> {
  const { data, error } = await supabase
    .from("profiles")
    .select("current_plan,subscription_status,paid_until")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Erro ao carregar plano do usuario:", error);
    return {
      currentPlan: "free" as AppPlan,
      effectivePlan: "free" as AppPlan,
      subscriptionStatus: "active" as SubscriptionStatus,
      paidUntil: null as string | null,
      isPastDue: false,
      message: "",
    };
  }

  const profile = data?.[0];
  const currentPlan = normalizePlan(profile?.current_plan);
  const rawStatus = normalizeSubscriptionStatus(profile?.subscription_status);
  const paidUntil = profile?.paid_until ?? null;
  const hasActivePayment = rawStatus === "active" && isPaidUntilValid(paidUntil);
  const isPastDue = currentPlan === "pro" && !hasActivePayment;
  const effectivePlan: AppPlan = currentPlan === "pro" && hasActivePayment ? "pro" : "free";
  const subscriptionStatus: SubscriptionStatus = isPastDue && rawStatus === "active" ? "past_due" : rawStatus;

  return {
    currentPlan,
    effectivePlan,
    subscriptionStatus,
    paidUntil,
    isPastDue,
    message: isPastDue ? PAST_DUE_MESSAGE : "",
  };
}

export async function getCurrentUserPlan(userId: string): Promise<AppPlan> {
  const access = await getUserPlanAccess(userId);
  return access.effectivePlan;
}

export async function canCreateQuoteThisMonth(userId: string) {
  const access = await getUserPlanAccess(userId);
  const plan = access.effectivePlan;
  if (plan === "pro") return { allowed: true, plan, used: 0, limit: null, message: "" };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Erro ao verificar limite de orcamentos:", error);
    return { allowed: true, plan, used: 0, limit: FREE_MONTHLY_QUOTES_LIMIT, message: access.message };
  }

  const used = count ?? 0;
  return { allowed: used < FREE_MONTHLY_QUOTES_LIMIT, plan, used, limit: FREE_MONTHLY_QUOTES_LIMIT, message: access.message || FREE_LIMIT_MESSAGE };
}

export async function canCreateClient(userId: string) {
  const access = await getUserPlanAccess(userId);
  const plan = access.effectivePlan;
  if (plan === "pro") return { allowed: true, plan, used: 0, limit: null, message: "" };

  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao verificar limite de clientes:", error);
    return { allowed: true, plan, used: 0, limit: FREE_CLIENTS_LIMIT, message: access.message };
  }

  const used = count ?? 0;
  return { allowed: used < FREE_CLIENTS_LIMIT, plan, used, limit: FREE_CLIENTS_LIMIT, message: access.message || FREE_LIMIT_MESSAGE };
}
