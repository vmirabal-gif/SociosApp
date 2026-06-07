"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  mapUsuarioPerfil,
  type UsuarioPerfil,
  type UsuarioPerfilRow,
} from "@/lib/types/auth";
import { AUTH_ENABLED, MVP_ADMIN_PROFILE } from "@/lib/auth/config";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UsuarioPerfil | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UsuarioPerfil | null>(
    AUTH_ENABLED ? null : MVP_ADMIN_PROFILE
  );
  const [loading, setLoading] = useState(AUTH_ENABLED);

  const loadProfile = useCallback(async (userId: string | null) => {
    if (!AUTH_ENABLED) {
      setProfile(MVP_ADMIN_PROFILE);
      return;
    }

    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.error("[AuthProvider] Error al cargar perfil:", error);
      setProfile(null);
      return;
    }

    setProfile(data ? mapUsuarioPerfil(data as UsuarioPerfilRow) : null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!AUTH_ENABLED) {
      setProfile(MVP_ADMIN_PROFILE);
      return;
    }

    await loadProfile(session?.user.id ?? null);
  }, [loadProfile, session?.user.id]);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setSession(null);
      setProfile(MVP_ADMIN_PROFILE);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id ?? null);
      if (mounted) setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!AUTH_ENABLED) {
      setSession(null);
      setProfile(MVP_ADMIN_PROFILE);
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [loading, profile, refreshProfile, session, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return value;
}
