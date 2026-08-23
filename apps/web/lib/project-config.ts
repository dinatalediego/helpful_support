export const PROJECT_CONFIG = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://tlyczyfsboqrtrdpwizp.supabase.co",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_gMTGwNPjdwgNuzzRPpUPyA_ezrPfCrT",
} as const;

export function redactToken(token: string | undefined): string {
  if (!token) return "No enviado";
  return `Bearer ${token.slice(0, 12)}…[JWT oculto]`;
}

export function redactKey(key: string): string {
  return `${key.slice(0, 18)}…[publishable]`;
}
