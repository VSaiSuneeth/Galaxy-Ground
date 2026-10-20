import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AUTH_TIMEOUT_MS = 5000;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (event === "SIGNED_OUT") {
        qc.clear();
      }
      if (event !== "TOKEN_REFRESHED") {
        setLoading(false);
      }
    });

    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), AUTH_TIMEOUT_MS)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then((result) => {
        const { data: { session: existing } } = result as Awaited<typeof sessionPromise>;
        setSession(existing);
        setUser(existing?.user ?? null);
      })
      .catch(() => {
        // Slow or failed auth — show app in guest mode
        setSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, [qc]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
