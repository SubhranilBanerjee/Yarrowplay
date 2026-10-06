'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const profileFetchingRef = React.useRef<string | null>(null);

  const fetchProfile = async (userId: string, force = false) => {
    if (!force && profileFetchingRef.current === userId) return;
    profileFetchingRef.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: authUserData } = await supabase.auth.getUser();
      const currentUser = authUserData?.user;
      const meta = currentUser?.user_metadata || {};
      const resolvedName =
        meta.full_name ||
        meta.name ||
        (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : null) ||
        meta.display_name ||
        currentUser?.email?.split('@')[0] ||
        'User';
      const avatarUrl = meta.avatar_url || meta.picture || null;

      if (!error && data) {
        // If profile exists but name is email or blank, update with Google name
        if ((!data.display_name || data.display_name === data.email || data.display_name === 'User') && resolvedName && resolvedName !== data.email) {
          data.display_name = resolvedName;
          if (!data.avatar_url && avatarUrl) data.avatar_url = avatarUrl;
          // Asynchronously sync to DB
          fetch('/api/auth/sync-profile', { method: 'POST' }).catch(() => {});
        }
        setProfile(data as Profile);
      } else {
        // Profile row doesn't exist yet, call sync-profile endpoint to bypass RLS and create row
        try {
          const res = await fetch('/api/auth/sync-profile', { method: 'POST' });
          if (res.ok) {
            const json = await res.json();
            if (json.profile) {
              setProfile(json.profile as Profile);
              return;
            }
          }
        } catch {
          // ignore
        }

        // In-memory fallback profile so UI immediately renders the real user name instead of email
        if (currentUser) {
          const role = (meta.role as any) || 'viewer';
          const username = resolvedName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) + '_' + currentUser.id.slice(0, 5);

          setProfile({
            id: currentUser.id,
            email: currentUser.email || null,
            username,
            display_name: resolvedName,
            role,
            sub_role: null,
            company_name: meta.company_name || null,
            avatar_url: avatarUrl,
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile);
        }
      }
    } catch {
      // ignore
    } finally {
      profileFetchingRef.current = null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        if (event !== 'INITIAL_SESSION') {
          await fetchProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
