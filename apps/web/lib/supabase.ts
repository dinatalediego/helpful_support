import { createClient } from "@supabase/supabase-js";

import { PROJECT_CONFIG } from "@/lib/project-config";

export function createLabClient() {
  return createClient(
    PROJECT_CONFIG.supabaseUrl,
    PROJECT_CONFIG.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  );
}
