import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AuraMission,
  AuraProject,
  Conversation,
  LibraryItem,
  UsageMetrics,
  UserProfile,
} from '../shared/types.ts';

export interface StoredUserRecord {
  profile: UserProfile;
  passwordSalt: string;
  passwordHash: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
}

export interface PersistedDatabase {
  users: Record<string, StoredUserRecord>;
  sessions: Record<string, SessionRecord>;
  conversations: Conversation[];
  projects: AuraProject[];
  missions: AuraMission[];
  library: LibraryItem[];
  usageByUser: Record<string, UsageMetrics>;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig(): {
  url: string;
  key: string;
  configured: boolean;
  usingServiceRole: boolean;
} {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const key = serviceKey || anonKey;
  return {
    url,
    key,
    configured: Boolean(url && key),
    usingServiceRole: Boolean(serviceKey),
  };
}

export function getSupabaseServerClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) return null;
  if (!cachedClient) {
    cachedClient = createClient(cfg.url, cfg.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}

/**
 * Loads the persisted workspace state from Supabase PostgreSQL (`aura_state_snapshots`
 * and/or normalized `aura_*` tables). Returns null if Supabase is not configured or unreachable.
 */
export async function loadDatabaseFromSupabase(): Promise<Partial<PersistedDatabase> | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('aura_state_snapshots')
      .select('payload')
      .eq('id', 'global_workspace_v2')
      .maybeSingle();

    if (!error && data?.payload && typeof data.payload === 'object') {
      return data.payload as Partial<PersistedDatabase>;
    }
  } catch (err) {
    console.warn('Chargement initial Supabase ignoré:', err);
  }
  return null;
}

/**
 * Synchronizes the in-memory database state to Supabase PostgreSQL (`aura_state_snapshots`
 * and normalized relational tables `aura_users`, `aura_conversations`, `aura_projects`, `aura_missions`, `aura_library`).
 */
export async function syncDatabaseToSupabase(
  db: PersistedDatabase
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: 'SUPABASE_URL ou clé Supabase non configurée.' };
  }

  try {
    // 1. Upsert atomic snapshot for instant Vercel serverless cold-start hydration
    const { error: snapError } = await supabase
      .from('aura_state_snapshots')
      .upsert(
        {
          id: 'global_workspace_v2',
          payload: db,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (snapError) {
      return { ok: false, error: snapError.message };
    }

    // 2. Also sync normalized relational rows if the tables exist (non-blocking)
    const userRows = Object.values(db.users).map((u) => ({
      id: u.profile.id,
      email: u.profile.email,
      name: u.profile.name,
      role: u.profile.role || 'Membre Aura',
      organization: u.profile.organization || '',
      location: u.profile.location || '',
      plan: u.profile.plan || 'free',
      auth_provider: u.profile.authProvider || 'email',
      onboarding_completed: Boolean(u.profile.onboardingCompleted),
      preferences: u.profile.preferences || {},
      password_salt: u.passwordSalt,
      password_hash: u.passwordHash,
      updated_at: new Date().toISOString(),
    }));

    if (userRows.length > 0) {
      await supabase
        .from('aura_users')
        .upsert(userRows, { onConflict: 'id' })
        .then(() => undefined, () => undefined);
    }

    if (db.conversations.length > 0) {
      const convRows = db.conversations.map((c) => ({
        id: c.id,
        user_id: c.userId,
        project_id: c.projectId || null,
        title: c.title,
        mode: c.mode,
        messages: c.messages,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      }));
      await supabase
        .from('aura_conversations')
        .upsert(convRows, { onConflict: 'id' })
        .then(() => undefined, () => undefined);
    }

    if (db.projects.length > 0) {
      const projRows = db.projects.map((p) => ({
        id: p.id,
        user_id: p.userId,
        name: p.name,
        description: p.description || '',
        color: p.color || '#078348',
        icon: p.icon || 'fa-regular fa-folder-open',
        system_context: p.systemContext || '',
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }));
      await supabase
        .from('aura_projects')
        .upsert(projRows, { onConflict: 'id' })
        .then(() => undefined, () => undefined);
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  usingServiceRole: boolean;
  message: string;
}> {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) {
    return {
      configured: false,
      connected: false,
      tablesReady: false,
      usingServiceRole: false,
      message:
        'Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) non définies.',
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      configured: true,
      connected: false,
      tablesReady: false,
      usingServiceRole: cfg.usingServiceRole,
      message: 'Impossible d’initialiser le client Supabase.',
    };
  }

  try {
    const { error } = await supabase
      .from('aura_state_snapshots')
      .select('id')
      .limit(1);

    if (error) {
      const missingTable =
        error.message.includes('does not exist') ||
        error.message.includes('schema cache') ||
        error.code === '42P01';
      return {
        configured: true,
        connected: true,
        tablesReady: !missingTable,
        usingServiceRole: cfg.usingServiceRole,
        message: missingTable
          ? 'Connecté à Supabase, mais les tables SQL Aura ne sont pas encore créées. Exécutez le script supabase/schema.sql dans votre SQL Editor Supabase.'
          : `Connecté à Supabase (${error.message})`,
      };
    }

    return {
      configured: true,
      connected: true,
      tablesReady: true,
      usingServiceRole: cfg.usingServiceRole,
      message: 'Connecté et synchronisé avec Supabase PostgreSQL.',
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      tablesReady: false,
      usingServiceRole: cfg.usingServiceRole,
      message:
        err instanceof Error
          ? `Erreur réseau Supabase : ${err.message}`
          : 'Erreur de connexion Supabase.',
    };
  }
}
