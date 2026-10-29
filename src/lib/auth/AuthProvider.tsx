"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";

const GUEST_FLAG_KEY = "alore_guest_mode";

interface AuthResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(GUEST_FLAG_KEY) === "1"
    ) {
      setIsGuest(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setIsGuest(false);
          localStorage.removeItem(GUEST_FLAG_KEY);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      return { error: null, needsEmailConfirmation: !data.session };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem(GUEST_FLAG_KEY);
  }, []);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_FLAG_KEY, "1");
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    localStorage.removeItem(GUEST_FLAG_KEY);
    setIsGuest(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isGuest,
      loading,
      signUp,
      signIn,
      signOut,
      enterGuestMode,
      exitGuestMode,
    }),
    [
      session,
      isGuest,
      loading,
      signUp,
      signIn,
      signOut,
      enterGuestMode,
      exitGuestMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
