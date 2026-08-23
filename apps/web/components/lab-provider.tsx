"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { createLabClient } from "@/lib/supabase";

type SignInResult = { error: string | null };

type LabContextValue = {
  client: SupabaseClient;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createLabClient);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [client]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      setSession(data.session);
      return { error: error?.message ?? null };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    await client.auth.signOut({ scope: "local" });
    setSession(null);
  }, [client]);

  return (
    <LabContext.Provider value={{ client, session, signIn, signOut }}>
      {children}
    </LabContext.Provider>
  );
}

export function useLab(): LabContextValue {
  const context = useContext(LabContext);
  if (!context) throw new Error("useLab debe utilizarse dentro de LabProvider");
  return context;
}
