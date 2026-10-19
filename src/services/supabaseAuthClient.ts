import {
  createClient,
  Session,
  SupabaseClient,
  User as SupabaseUser,
} from '@supabase/supabase-js';
import { AuraLanguage, AuraMode, AuraTheme, UserProfile } from '../shared/types';

const memoryStorage = new Map<string, string>();

const safeBrowserStorage = {
  getItem(key: string): string | null {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) {
        memoryStorage.set(key, val);
        return val;
      }
    } catch {
      // Cross-origin iframe fallback
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    memoryStorage.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Cross-origin iframe fallback
    }
  },
  removeItem(key: string): void {
    memoryStorage.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Cross-origin iframe fallback
    }
  },
};

let browserSupabaseClient: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

export function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim().replace(/\/+$/, '');
  url = url.replace(/\/(rest(\/v1)?|auth(\/v1)?)$/i, '');
  return url.replace(/\/+$/, '');
}

/**
 * Resolves the Supabase client in the browser using VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * or by querying `/api/supabase/public-config` if the user configured SUPABASE_URL / SUPABASE_ANON_KEY on the server.
 */
export async function getBrowserSupabaseClient(): Promise<SupabaseClient | null> {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envUrl = normalizeSupabaseUrl(rawEnvUrl);
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envAnonKey) {
    browserSupabaseClient = createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeBrowserStorage,
      },
    });
    return browserSupabaseClient;
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const res = await fetch('/api/supabase/public-config');
        if (!res.ok) return null;
        const data = await res.json();
        const cleanUrl = normalizeSupabaseUrl(data?.url || '');
        if (data?.configured && cleanUrl && data.anonKey) {
          browserSupabaseClient = createClient(cleanUrl, data.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: safeBrowserStorage,
            },
          });
          return browserSupabaseClient;
        }
      } catch {
        // Ignore network error during public config discovery
      }
      return null;
    })();
  }

  return initPromise;
}

/**
 * Maps a Supabase Auth User (`@supabase/supabase-js`) and its `user_metadata`
 * to Aura's `UserProfile` structure.
 */
export function mapSupabaseUserToProfile(sbUser: SupabaseUser): UserProfile {
  const meta = sbUser.user_metadata || {};
  const email = sbUser.email || meta.email || '';
  const fallbackName = email ? email.split('@')[0] : 'Membre Aura';
  const name =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    fallbackName;

  const preferences = meta.preferences || {};
  const onboarding = meta.onboarding || undefined;
  const onboardingCompleted =
    typeof meta.onboardingCompleted === 'boolean'
      ? meta.onboardingCompleted
      : Boolean(onboarding?.completed);

  return {
    id: sbUser.id,
    name: String(name),
    email: String(email),
    role: String(meta.role || 'Membre Aura'),
    avatarUrl: meta.avatar_url || meta.avatarUrl || undefined,
    organization: String(meta.organization || ''),
    location: String(meta.location || ''),
    plan: meta.plan === 'pro' ? 'pro' : 'free',
    authProvider:
      (sbUser.app_metadata?.provider as 'email' | 'google' | 'github') ||
      meta.authProvider ||
      'email',
    onboardingCompleted,
    onboarding,
    preferences: {
      language: (preferences.language as AuraLanguage) || 'fr',
      theme: (preferences.theme as AuraTheme) || 'light',
      defaultMode: (preferences.defaultMode as AuraMode) || 'chat',
      defaultProvider: preferences.defaultProvider || 'gemini',
    },
  };
}

export interface SupabaseAuthActionResult {
  ok: boolean;
  user?: UserProfile;
  session?: Session | null;
  accessToken?: string | null;
  requiresEmailConfirmation?: boolean;
  error?: string;
}
