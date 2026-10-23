import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AuraMission,
  AuraMode,
  AuraProject,
  ChatMessage,
  Conversation,
  LibraryItem,
  OnboardingData,
  StudioGenerationRun,
  StudioProject,
  StudioProjectSummary,
  StudioProjectType,
  StudioProjectVersion,
  UsageMetrics,
  UserProfile,
  VirtualStudioFile,
} from '../shared/types.ts';
import { composePreviewHtml } from '../shared/studio.ts';
import {
  AURA_PLANS,
  CATEGORY_UNIT_COSTS,
  PlanDefinition,
  PlanId,
  UsageCategory,
  UsageLedgerEntry,
  UserSubscriptionState,
} from '../shared/plans.ts';
import {
  checkSupabaseHealth,
  getSupabaseConfig,
  loadDatabaseFromSupabase,
  syncDatabaseToSupabase,
} from './supabaseClient.ts';

interface StoredUserRecord {
  profile: UserProfile;
  passwordSalt: string;
  passwordHash: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
}

export interface ContactMessageRecord {
  id: string;
  kind: 'contact' | 'waitlist';
  name?: string;
  email: string;
  subject?: string;
  message: string;
  planId?: string;
  createdAt: string;
}

interface PersistedDatabase {
  users: Record<string, StoredUserRecord>;
  sessions: Record<string, SessionRecord>;
  conversations: Conversation[];
  projects: AuraProject[];
  missions: AuraMission[];
  library: LibraryItem[];
  studioProjects: StudioProject[];
  contactMessages: ContactMessageRecord[];
  usageByUser: Record<string, UsageMetrics>;
  subscriptions: Record<string, UserSubscriptionState>;
  usageLedger: UsageLedgerEntry[];
}

function resolveWritableDataDir(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
  );
  if (isServerless) {
    return path.join('/tmp', 'aura-data');
  }
  const localDir = path.resolve(process.cwd(), '.data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    return path.join('/tmp', 'aura-data');
  }
}

const DATA_DIR = resolveWritableDataDir();
const DATA_FILE = path.join(DATA_DIR, 'aura-store.json');

const SESSION_SECRET =
  process.env.AURA_SESSION_SECRET ||
  'aura-signature-serverless-hmac-key-2026';

function signUserProfileToken(user: UserProfile): string {
  const payload = Buffer.from(JSON.stringify(user), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `aura1.${payload}.${sig}`;
}

function verifyUserProfileToken(token: string): UserProfile | null {
  if (!token.startsWith('aura1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    ) as UserProfile;
    if (!decoded || !decoded.id || !decoded.email) return null;
    return decoded;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getRenewalDateString(): string {
  const d = new Date();
  const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0));
  return nextMonth.toISOString();
}

function createEmptyUsage(planId: PlanId = 'free', activeProjectsCount = 0): UsageMetrics {
  const plan = AURA_PLANS[planId] || AURA_PLANS.free;
  return {
    date: getTodayDateString(),
    requestsUsed: 0,
    dailyLimit: 50,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    byMode: {
      chat: 0,
      search: 0,
      code: 0,
      create: 0,
      image: 0,
      video: 0,
      slides: 0,
    },
    byModel: {},
    recentLogs: [],
    planId,
    monthlyUnitsUsed: 0,
    monthlyUnitsLimit: plan.limits.monthlyAIUnits,
    webSearchesUsed: 0,
    webSearchesLimit: plan.limits.monthlyWebSearches,
    siteCreationsUsed: 0,
    siteCreationsLimit: plan.limits.monthlySiteCreations,
    siteModificationsUsed: 0,
    siteModificationsLimit: plan.limits.monthlySiteModifications,
    activeProjectsCount,
    maxProjectsLimit: plan.limits.maxProjects,
    periodRenewalDate: getRenewalDateString(),
    byCategory: {
      chat: 0,
      search: 0,
      studio_creation: 0,
      studio_modification: 0,
      slides: 0,
      media: 0,
    },
    recentLedger: [],
  };
}

function createCleanDatabase(): PersistedDatabase {
  return {
    users: {},
    sessions: {},
    conversations: [],
    projects: [],
    missions: [],
    library: [],
    studioProjects: [],
    contactMessages: [],
    usageByUser: {},
    subscriptions: {},
    usageLedger: [],
  };
}

const LEGACY_DEMO_EMAILS = new Set([
  'rosaire@email.com',
]);

const LEGACY_SEED_IDS = new Set([
  'user-rosaire',
  'conv-welcome-react-nextjs',
  'conv-1791682828353-xj79',
  'conv-1791677781480-smdx',
  'lib-seed-1',
  'proj-ecommerce',
  'proj-studies',
  'proj-content',
]);

class AuraDataStore {
  private db: PersistedDatabase;
  private revokedTokens = new Set<string>();
  private hydratedFromSupabase = false;
  private hydrationPromise: Promise<void> | null = null;
  private activeUserGenerations = new Set<string>();
  private activeReservations = new Map<
    string,
    {
      userId: string;
      operationId: string;
      category: UsageCategory;
      units: number;
      modelId: string;
      providerId: string;
      createdAt: number;
    }
  >();

  constructor() {
    this.db = this.loadFromDisk();
    if (getSupabaseConfig().configured) {
      void this.ensureHydrated();
    }
  }

  async ensureHydrated(): Promise<void> {
    if (this.hydratedFromSupabase || !getSupabaseConfig().configured) {
      return;
    }
    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }
    this.hydrationPromise = (async () => {
      try {
        const remote = await loadDatabaseFromSupabase();
        if (remote) {
          this.mergeRemoteState(remote);
        }
        this.hydratedFromSupabase = true;
      } catch (err) {
        console.warn('Hydratation Supabase non disponible:', err);
      } finally {
        this.hydrationPromise = null;
      }
    })();
    return this.hydrationPromise;
  }

  private mergeRemoteState(remote: Partial<PersistedDatabase>): void {
    if (remote.users && typeof remote.users === 'object') {
      for (const [email, rec] of Object.entries(remote.users)) {
        const cleanEmail = email.trim().toLowerCase();
        if (rec && rec.profile && !LEGACY_DEMO_EMAILS.has(cleanEmail)) {
          this.db.users[cleanEmail] = rec;
        }
      }
    }
    if (remote.sessions && typeof remote.sessions === 'object') {
      this.db.sessions = { ...remote.sessions, ...this.db.sessions };
    }
    if (Array.isArray(remote.conversations)) {
      const merged = new Map<string, Conversation>();
      for (const c of [...remote.conversations, ...this.db.conversations]) {
        if (!c || !c.id || LEGACY_SEED_IDS.has(c.id)) continue;
        const prev = merged.get(c.id);
        if (
          !prev ||
          (c.messages?.length || 0) >= (prev.messages?.length || 0)
        ) {
          merged.set(c.id, c);
        }
      }
      this.db.conversations = Array.from(merged.values());
    }
    if (Array.isArray(remote.projects)) {
      const merged = new Map<string, AuraProject>();
      for (const p of [...remote.projects, ...this.db.projects]) {
        if (p && p.id && !LEGACY_SEED_IDS.has(p.id)) {
          merged.set(p.id, p);
        }
      }
      this.db.projects = Array.from(merged.values());
    }
    if (Array.isArray(remote.missions)) {
      const merged = new Map<string, AuraMission>();
      for (const m of [...remote.missions, ...this.db.missions]) {
        if (m && m.id) {
          merged.set(m.id, m);
        }
      }
      this.db.missions = Array.from(merged.values());
    }
    if (Array.isArray(remote.library)) {
      const merged = new Map<string, LibraryItem>();
      for (const l of [...remote.library, ...this.db.library]) {
        if (l && l.id && !LEGACY_SEED_IDS.has(l.id)) {
          merged.set(l.id, l);
        }
      }
      this.db.library = Array.from(merged.values());
    }
    if (Array.isArray(remote.studioProjects)) {
      const merged = new Map<string, StudioProject>();
      for (const sp of [...remote.studioProjects, ...this.db.studioProjects]) {
        if (sp && sp.id && sp.userId && !LEGACY_SEED_IDS.has(sp.id)) {
          const prev = merged.get(sp.id);
          if (!prev || (sp.updatedAt || '') >= (prev.updatedAt || '')) {
            merged.set(sp.id, sp);
          }
        }
      }
      this.db.studioProjects = Array.from(merged.values());
    }
    if (remote.usageByUser && typeof remote.usageByUser === 'object') {
      this.db.usageByUser = {
        ...remote.usageByUser,
        ...this.db.usageByUser,
      };
    }
    this.saveToDisk(this.db, false);
  }

  async forceSyncToSupabase(): Promise<{ ok: boolean; error?: string }> {
    await this.ensureHydrated();
    return syncDatabaseToSupabase(this.db);
  }

  async getSupabaseDiagnostics() {
    return checkSupabaseHealth();
  }

  private loadFromDisk(): PersistedDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;

        const cleanUsers: Record<string, StoredUserRecord> = {};
        if (parsed.users && typeof parsed.users === 'object') {
          for (const [emailKey, rec] of Object.entries(parsed.users)) {
            const lowerEmail = emailKey.trim().toLowerCase();
            if (
              rec &&
              rec.profile &&
              !LEGACY_DEMO_EMAILS.has(lowerEmail) &&
              !LEGACY_SEED_IDS.has(rec.profile.id)
            ) {
              cleanUsers[lowerEmail] = {
                ...rec,
                profile: {
                  ...rec.profile,
                  onboardingCompleted: Boolean(rec.profile.onboardingCompleted),
                },
              };
            }
          }
        }

        const validUserIds = new Set(
          Object.values(cleanUsers).map((u) => u.profile.id)
        );

        const cleanSessions: Record<string, SessionRecord> = {};
        if (parsed.sessions && typeof parsed.sessions === 'object') {
          for (const [tok, sess] of Object.entries(parsed.sessions)) {
            if (sess && validUserIds.has(sess.userId)) {
              cleanSessions[tok] = sess;
            }
          }
        }

        const rawConversations = Array.isArray(parsed.conversations)
          ? parsed.conversations.filter(
              (c) =>
                c &&
                c.userId &&
                validUserIds.has(c.userId) &&
                !LEGACY_SEED_IDS.has(c.id)
            )
          : [];

        const convMap = new Map<string, Conversation>();
        for (const c of rawConversations) {
          const existing = convMap.get(c.id);
          if (
            !existing ||
            (c.messages?.length || 0) > (existing.messages?.length || 0)
          ) {
            convMap.set(c.id, c);
          }
        }
        const cleanConversations = Array.from(convMap.values());

        const cleanProjects = Array.isArray(parsed.projects)
          ? parsed.projects.filter(
              (p) =>
                p &&
                p.userId &&
                validUserIds.has(p.userId) &&
                !LEGACY_SEED_IDS.has(p.id)
            )
          : [];

        const cleanMissions = Array.isArray(parsed.missions)
          ? parsed.missions.filter(
              (m) => m && m.userId && validUserIds.has(m.userId)
            )
          : [];

        const cleanLibrary = Array.isArray(parsed.library)
          ? parsed.library.filter(
              (l) =>
                l &&
                l.userId &&
                validUserIds.has(l.userId) &&
                !LEGACY_SEED_IDS.has(l.id)
            )
          : [];

        const cleanStudioProjects = Array.isArray(parsed.studioProjects)
          ? parsed.studioProjects.filter(
              (sp) =>
                sp &&
                sp.id &&
                sp.userId &&
                validUserIds.has(sp.userId) &&
                !LEGACY_SEED_IDS.has(sp.id)
            )
          : [];

        const cleanUsageByUser: Record<string, UsageMetrics> = {};
        if (parsed.usageByUser && typeof parsed.usageByUser === 'object') {
          for (const [uid, uMetrics] of Object.entries(parsed.usageByUser)) {
            if (validUserIds.has(uid) && uMetrics) {
              cleanUsageByUser[uid] = uMetrics;
            }
          }
        }

        const sanitized: PersistedDatabase = {
          users: cleanUsers,
          sessions: cleanSessions,
          conversations: cleanConversations,
          projects: cleanProjects,
          missions: cleanMissions,
          library: cleanLibrary,
          studioProjects: cleanStudioProjects,
          contactMessages: Array.isArray(parsed.contactMessages)
            ? parsed.contactMessages.filter((c) => c && c.id && c.email)
            : [],
          usageByUser: cleanUsageByUser,
          subscriptions:
            parsed.subscriptions && typeof parsed.subscriptions === 'object'
              ? parsed.subscriptions
              : {},
          usageLedger: Array.isArray(parsed.usageLedger)
            ? parsed.usageLedger
            : [],
        };

        this.saveToDisk(sanitized, false);
        return sanitized;
      }
    } catch (err) {
      console.warn('Initialisation d’un stockage Aura propre:', err);
    }

    const clean = createCleanDatabase();
    this.saveToDisk(clean, false);
    return clean;
  }

  private saveToDisk(
    data: PersistedDatabase = this.db,
    syncRemote = true
  ): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde locale Aura:', err);
    }

    if (syncRemote && getSupabaseConfig().configured) {
      void syncDatabaseToSupabase(data);
    }
  }

  createSession(user: UserProfile): string {
    const token = signUserProfileToken(user);
    this.db.sessions[token] = {
      token,
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
    };
    this.saveToDisk();
    return token;
  }

  // --- Authentication & Sessions ---
  getUserByToken(token?: string | null): UserProfile | null {
    if (!token || this.revokedTokens.has(token)) return null;

    const session = this.db.sessions[token];
    if (session) {
      const record = this.db.users[session.email];
      if (record && record.profile.id === session.userId) {
        return record.profile;
      }
    }

    // Serverless fallback: verify stateless HMAC-signed session token on cold start
    const verifiedProfile = verifyUserProfileToken(token);
    if (verifiedProfile) {
      const emailKey = verifiedProfile.email.trim().toLowerCase();
      if (!this.db.users[emailKey]) {
        const salt = crypto.randomBytes(16).toString('hex');
        this.db.users[emailKey] = {
          profile: verifiedProfile,
          passwordSalt: salt,
          passwordHash: hashPassword(crypto.randomBytes(24).toString('hex'), salt),
        };
      }
      if (!this.db.usageByUser[verifiedProfile.id]) {
        this.db.usageByUser[verifiedProfile.id] = createEmptyUsage();
      }
      this.db.sessions[token] = {
        token,
        userId: verifiedProfile.id,
        email: emailKey,
        createdAt: new Date().toISOString(),
      };
      return this.db.users[emailKey].profile;
    }

    return null;
  }

  revokeSession(token?: string | null): void {
    if (!token) return;
    this.revokedTokens.add(token);
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.saveToDisk();
    }
  }

  upsertSupabaseAuthUser(
    sbProfile: UserProfile,
    accessToken?: string | null,
    rawPassword?: string | null
  ): { user: UserProfile; token: string } {
    const cleanEmail = sbProfile.email.trim().toLowerCase();
    const existing = this.db.users[cleanEmail];
    const salt = existing?.passwordSalt || crypto.randomBytes(16).toString('hex');
    const hash = rawPassword
      ? hashPassword(rawPassword, salt)
      : (existing?.passwordHash || hashPassword(crypto.randomBytes(24).toString('hex'), salt));

    const mergedProfile: UserProfile = existing
      ? {
          ...existing.profile,
          id: sbProfile.id || existing.profile.id,
          email: cleanEmail,
          name: sbProfile.name || existing.profile.name,
          role: sbProfile.role || existing.profile.role || 'Membre Aura',
          organization:
            sbProfile.organization || existing.profile.organization || '',
          location: sbProfile.location || existing.profile.location || '',
          avatarUrl: sbProfile.avatarUrl || existing.profile.avatarUrl,
          onboardingCompleted:
            Boolean(sbProfile.onboardingCompleted) ||
            Boolean(existing.profile.onboardingCompleted),
          onboarding: sbProfile.onboarding || existing.profile.onboarding,
          preferences: {
            ...existing.profile.preferences,
            ...sbProfile.preferences,
          },
        }
      : {
          ...sbProfile,
          email: cleanEmail,
        };

    this.db.users[cleanEmail] = {
      profile: mergedProfile,
      passwordSalt: salt,
      passwordHash: hash,
    };

    if (!this.db.usageByUser[mergedProfile.id]) {
      this.db.usageByUser[mergedProfile.id] = createEmptyUsage();
    }

    const signedToken = this.createSession(mergedProfile);
    if (accessToken) {
      this.revokedTokens.delete(accessToken);
      this.db.sessions[accessToken] = {
        token: accessToken,
        userId: mergedProfile.id,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };
    }

    this.saveToDisk();
    return {
      user: mergedProfile,
      token: accessToken || signedToken,
    };
  }

  registerUser(
    name: string,
    email: string,
    password: string,
    consents?: {
      termsVersion: string;
      privacyVersion: string;
      consentedAt: string;
      marketingConsent?: boolean;
    }
  ): { user: UserProfile; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (this.db.users[cleanEmail]) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const profile: UserProfile = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: 'Membre Aura',
      organization: '',
      location: '',
      plan: 'free',
      authProvider: 'email',
      onboardingCompleted: false,
      createdAt: nowIso,
      consents: consents || {
        termsVersion: '2026-v1.0',
        privacyVersion: '2026-v1.0',
        consentedAt: nowIso,
        marketingConsent: false,
      },
      preferences: {
        language: 'fr',
        theme: 'light',
        defaultMode: 'chat',
        defaultProvider: 'gemini',
        reducedMotion: false,
        notifications: {
          securityAlerts: true,
          productUpdates: true,
          weeklyDigest: false,
        },
      },
    };

    this.db.users[cleanEmail] = {
      profile,
      passwordSalt: salt,
      passwordHash: hash,
    };
    this.db.usageByUser[userId] = createEmptyUsage();

    const token = this.createSession(profile);
    this.saveToDisk();
    return { user: profile, token };
  }

  authenticateUser(
    email: string,
    password: string
  ): { user: UserProfile; token: string } | null {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.db.users[cleanEmail];
    if (!record) {
      return null;
    }
    const candidateHash = hashPassword(password, record.passwordSalt);
    if (candidateHash !== record.passwordHash) {
      return null;
    }
    const token = this.createSession(record.profile);
    return { user: record.profile, token };
  }

  authenticateOAuthUser(params: {
    provider: 'google' | 'github';
    email: string;
    name: string;
  }): { user: UserProfile; token: string; isNewUser: boolean } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.db.users[cleanEmail];

    if (existing) {
      const token = this.createSession(existing.profile);
      return {
        user: existing.profile,
        token,
        isNewUser: !existing.profile.onboardingCompleted,
      };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const randomPass = crypto.randomBytes(24).toString('hex');
    const hash = hashPassword(randomPass, salt);
    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const profile: UserProfile = {
      id: userId,
      name: params.name.trim(),
      email: cleanEmail,
      role: 'Membre Aura',
      organization: '',
      location: '',
      plan: 'free',
      authProvider: params.provider,
      onboardingCompleted: false,
      preferences: {
        language: 'fr',
        theme: 'light',
        defaultMode: 'chat',
        defaultProvider: 'gemini',
      },
    };

    this.db.users[cleanEmail] = {
      profile,
      passwordSalt: salt,
      passwordHash: hash,
    };
    this.db.usageByUser[userId] = createEmptyUsage();

    const token = this.createSession(profile);
    this.saveToDisk();
    return { user: profile, token, isNewUser: true };
  }

  completeOnboarding(
    userId: string,
    onboardingData: OnboardingData
  ): UserProfile | null {
    const entry = Object.entries(this.db.users).find(
      ([, rec]) => rec.profile.id === userId
    );
    if (!entry) return null;

    const [emailKey, record] = entry;
    const goals = onboardingData.goals || [];
    let defaultMode: AuraMode = 'chat';
    if (goals.includes('developpement')) defaultMode = 'code';
    else if (goals.includes('recherche')) defaultMode = 'search';
    else if (goals.includes('creation')) defaultMode = 'create';

    const roleMap: Record<string, string> = {
      debutant: 'Explorateur Aura',
      autonome: 'Créateur Autonome',
      avance: 'Expert & Bâtisseur',
    };

    const updated: UserProfile = {
      ...record.profile,
      role: roleMap[onboardingData.experienceLevel] || record.profile.role || 'Membre Aura',
      location: onboardingData.country || record.profile.location || '',
      onboardingCompleted: true,
      onboarding: {
        ...onboardingData,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      preferences: {
        ...record.profile.preferences,
        language: onboardingData.language === 'English' ? 'en' : 'fr',
        defaultMode,
      },
    };

    this.db.users[emailKey] = {
      ...record,
      profile: updated,
    };
    this.saveToDisk();
    return updated;
  }

  updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): UserProfile | null {
    const entry = Object.entries(this.db.users).find(
      ([, rec]) => rec.profile.id === userId
    );
    if (!entry) return null;

    const [oldEmail, record] = entry;
    const current = record.profile;
    const newEmail = updates.email
      ? updates.email.trim().toLowerCase()
      : current.email;

    const updated: UserProfile = {
      ...current,
      ...updates,
      id: current.id,
      email: newEmail,
      preferences: {
        ...current.preferences,
        ...(updates.preferences || {}),
      },
    };

    if (newEmail !== oldEmail) {
      delete this.db.users[oldEmail];
      Object.values(this.db.sessions).forEach((s) => {
        if (s.userId === userId) s.email = newEmail;
      });
    }

    this.db.users[newEmail] = {
      ...record,
      profile: updated,
    };
    this.saveToDisk();
    return updated;
  }

  // --- Conversations (Scoped per userId) ---
  getConversations(userId: string): Conversation[] {
    const map = new Map<string, Conversation>();
    for (const c of this.db.conversations) {
      if (c.userId !== userId) continue;
      const existing = map.get(c.id);
      if (
        !existing ||
        (c.messages?.length || 0) > (existing.messages?.length || 0) ||
        new Date(c.updatedAt).getTime() > new Date(existing.updatedAt).getTime()
      ) {
        map.set(c.id, c);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getConversationById(userId: string, id: string): Conversation | undefined {
    return this.db.conversations.find((c) => c.id === id && c.userId === userId);
  }

  createConversation(
    userId: string,
    params: {
      id?: string;
      title: string;
      mode: AuraMode;
      projectId?: string;
    }
  ): Conversation {
    if (params.id) {
      const existing = this.getConversationById(userId, params.id);
      if (existing) {
        return existing;
      }
    }
    const now = new Date().toISOString();
    const conv: Conversation = {
      id:
        params.id ||
        `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      title: params.title,
      mode: params.mode,
      projectId: params.projectId,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.db.conversations = [
      conv,
      ...this.db.conversations.filter((c) => c.id !== conv.id),
    ];
    this.saveToDisk();
    return conv;
  }

  appendMessages(
    userId: string,
    conversationId: string,
    messages: ChatMessage[],
    newTitle?: string
  ): Conversation {
    let conv = this.getConversationById(userId, conversationId);
    if (!conv) {
      conv = this.createConversation(userId, {
        id: conversationId,
        title: newTitle || 'Nouvelle conversation',
        mode: messages[0]?.mode || 'chat',
      });
    }
    const existingMsgIds = new Set(conv.messages.map((m) => m.id));
    for (const msg of messages) {
      if (!existingMsgIds.has(msg.id)) {
        conv.messages.push(msg);
        existingMsgIds.add(msg.id);
      }
    }
    if (newTitle && conv.messages.length <= 2) {
      conv.title = newTitle;
    }
    conv.updatedAt = new Date().toISOString();
    this.db.conversations = [
      conv,
      ...this.db.conversations.filter((c) => c.id !== conv!.id),
    ];
    this.saveToDisk();
    return conv;
  }

  updateConversation(
    userId: string,
    id: string,
    updates: {
      title?: string;
      projectId?: string | null;
      messageId?: string;
      updatedCode?: string;
      updatedContent?: string;
    }
  ): Conversation | null {
    const conv = this.getConversationById(userId, id);
    if (!conv) return null;

    if (typeof updates.title === 'string' && updates.title.trim()) {
      conv.title = updates.title.trim();
    }
    if (updates.projectId !== undefined) {
      conv.projectId = updates.projectId || undefined;
    }

    if (updates.messageId) {
      const msg = conv.messages.find((m) => m.id === updates.messageId);
      if (msg) {
        if (typeof updates.updatedContent === 'string') {
          msg.content = updates.updatedContent;
        }
        if (typeof updates.updatedCode === 'string') {
          const isHtml =
            updates.updatedCode.includes('<!DOCTYPE html>') ||
            updates.updatedCode.includes('<html') ||
            updates.updatedCode.includes('<style') ||
            updates.updatedCode.includes('<div');
          msg.codeArtifact = {
            language: msg.codeArtifact?.language || (isHtml ? 'html' : 'typescript'),
            filename: msg.codeArtifact?.filename || (isHtml ? 'index.html' : 'snippet.ts'),
            code: updates.updatedCode,
            previewableHtml: isHtml ? updates.updatedCode : msg.codeArtifact?.previewableHtml,
            files: msg.codeArtifact?.files?.map((f, idx) =>
              idx === 0 ? { ...f, content: updates.updatedCode! } : f
            ) || [
              {
                path: msg.codeArtifact?.filename || 'index.html',
                language: msg.codeArtifact?.language || 'html',
                content: updates.updatedCode,
              },
            ],
          };
        }
      }
    }

    conv.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return conv;
  }

  deleteConversation(userId: string, id: string): boolean {
    const before = this.db.conversations.length;
    this.db.conversations = this.db.conversations.filter(
      (c) => !(c.id === id && c.userId === userId)
    );
    this.db.library = this.db.library.filter(
      (item) => !(item.conversationId === id && item.userId === userId)
    );
    this.saveToDisk();
    return this.db.conversations.length < before;
  }

  // --- Library (Scoped per userId) ---
  getLibrary(userId: string): LibraryItem[] {
    return this.db.library
      .filter((i) => i.userId === userId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  addLibraryItem(
    userId: string,
    item: Omit<LibraryItem, 'id' | 'userId' | 'createdAt'>
  ): LibraryItem {
    const created: LibraryItem = {
      ...item,
      id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.db.library.unshift(created);
    if (item.conversationId && item.messageId) {
      const conv = this.getConversationById(userId, item.conversationId);
      const msg = conv?.messages.find((m) => m.id === item.messageId);
      if (msg) msg.savedToLibrary = true;
    }
    this.saveToDisk();
    return created;
  }

  deleteLibraryItem(userId: string, id: string): boolean {
    const before = this.db.library.length;
    this.db.library = this.db.library.filter(
      (i) => !(i.id === id && i.userId === userId)
    );
    this.saveToDisk();
    return this.db.library.length < before;
  }

  // --- Projects (Scoped per userId) ---
  getProjects(userId: string): AuraProject[] {
    return this.db.projects
      .filter((p) => p.userId === userId)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  createProject(
    userId: string,
    project: Omit<AuraProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): AuraProject {
    const existing = this.getProjects(userId);
    const plan = this.getUserPlan(userId);
    if (existing.length >= plan.limits.maxProjects) {
      throw new Error(
        `Limite de projets atteinte (${plan.limits.maxProjects} max sur l’offre ${plan.name}). Archivez ou supprimez un projet pour en créer un nouveau.`
      );
    }

    const now = new Date().toISOString();
    const created: AuraProject = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.db.projects.unshift(created);
    this.saveToDisk();
    return created;
  }

  deleteProject(userId: string, id: string): boolean {
    const before = this.db.projects.length;
    this.db.projects = this.db.projects.filter(
      (p) => !(p.id === id && p.userId === userId)
    );
    this.db.conversations.forEach((c) => {
      if (c.userId === userId && c.projectId === id) c.projectId = undefined;
    });
    this.saveToDisk();
    return this.db.projects.length < before;
  }

  // --- Missions (Scoped per userId) ---
  getMissions(userId: string): AuraMission[] {
    return this.db.missions
      .filter((m) => m.userId === userId)
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  createMission(
    userId: string,
    mission: Omit<AuraMission, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): AuraMission {
    const now = new Date().toISOString();
    const created: AuraMission = {
      ...mission,
      id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.db.missions.unshift(created);
    this.saveToDisk();
    return created;
  }

  deleteMission(userId: string, id: string): boolean {
    const before = this.db.missions.length;
    this.db.missions = this.db.missions.filter(
      (m) => !(m.id === id && m.userId === userId)
    );
    this.saveToDisk();
    return this.db.missions.length < before;
  }

  // --- Aura Studio : projets de création persistés (Strictement per user) ---
  private normalizeStudioFiles(files: VirtualStudioFile[]): VirtualStudioFile[] {
    const seen = new Set<string>();
    const out: VirtualStudioFile[] = [];
    for (const f of files) {
      if (!f || typeof f.path !== 'string' || typeof f.content !== 'string') {
        continue;
      }
      const cleanPath = f.path.trim().replace(/^\/+/, '');
      if (
        !cleanPath ||
        cleanPath.includes('..') ||
        cleanPath.length > 180 ||
        f.content.length > 400_000
      ) {
        continue;
      }
      const key = cleanPath.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        path: cleanPath,
        language:
          (f.language || '').trim() ||
          cleanPath.split('.').pop()?.toLowerCase() ||
          'text',
        content: f.content,
      });
    }
    return out;
  }

  private summarizeStudioProject(sp: StudioProject): StudioProjectSummary {
    const hasIndexHtml = sp.files.some((f) => f.path.toLowerCase() === 'index.html');
    return {
      id: sp.id,
      name: sp.name,
      description: sp.description,
      type: sp.type,
      status: sp.status,
      fileCount: sp.files.length,
      hasIndexHtml,
      versionCount: sp.versions.length,
      lastBuildStatus: sp.lastBuildStatus,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      previewHtml:
        hasIndexHtml && sp.status === 'ready'
          ? composePreviewHtml(sp.files)
          : undefined,
    };
  }

  getStudioProjectSummaries(userId: string): StudioProjectSummary[] {
    return this.db.studioProjects
      .filter((sp) => sp.userId === userId)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .map((sp) => this.summarizeStudioProject(sp));
  }

  getStudioProjects(userId: string): StudioProject[] {
    return this.db.studioProjects
      .filter((sp) => sp.userId === userId)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  getStudioProject(userId: string, id: string): StudioProject | undefined {
    return this.db.studioProjects.find(
      (sp) => sp.id === id && sp.userId === userId
    );
  }

  countStudioProjects(userId: string): number {
    return this.db.studioProjects.filter((sp) => sp.userId === userId).length;
  }

  createStudioProject(
    userId: string,
    params: {
      id?: string;
      name: string;
      description: string;
      type: StudioProjectType;
      files?: VirtualStudioFile[];
      status?: StudioProject['status'];
    }
  ): StudioProject {
    const now = new Date().toISOString();
    const created: StudioProject = {
      id:
        params.id ||
        `studio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: params.name,
      description: params.description,
      type: params.type,
      status: params.status || 'draft',
      files: this.normalizeStudioFiles(params.files || []),
      lastBuildStatus: 'unknown',
      versions: [],
      generationRuns: [],
      createdAt: now,
      updatedAt: now,
    };
    this.db.studioProjects.unshift(created);
    this.saveToDisk();
    return created;
  }

  updateStudioProject(
    userId: string,
    id: string,
    updates: {
      name?: string;
      description?: string;
      type?: StudioProjectType;
      status?: StudioProject['status'];
      lastBuildStatus?: StudioProject['lastBuildStatus'];
      lastBuildError?: string;
    }
  ): StudioProject | undefined {
    const sp = this.getStudioProject(userId, id);
    if (!sp) return undefined;
    if (typeof updates.name === 'string' && updates.name.trim()) {
      sp.name = updates.name.trim().slice(0, 80);
    }
    if (typeof updates.description === 'string') {
      sp.description = updates.description.slice(0, 2000);
    }
    if (updates.type) sp.type = updates.type;
    if (updates.status) sp.status = updates.status;
    if (updates.lastBuildStatus) sp.lastBuildStatus = updates.lastBuildStatus;
    if (typeof updates.lastBuildError === 'string') {
      sp.lastBuildError = updates.lastBuildError.slice(0, 2000);
    } else if (updates.lastBuildStatus === 'ok') {
      sp.lastBuildError = undefined;
    }
    sp.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return sp;
  }

  /** Enregistre une nouvelle version réelle du projet (fichiers complets). */
  saveStudioProjectFiles(
    userId: string,
    id: string,
    files: VirtualStudioFile[],
    opts: {
      label?: string;
      origin: StudioProjectVersion['origin'];
      generationRunId?: string;
      status?: StudioProject['status'];
      lastBuildStatus?: StudioProject['lastBuildStatus'];
      lastBuildError?: string;
    }
  ): { project: StudioProject; version: StudioProjectVersion } | undefined {
    const sp = this.getStudioProject(userId, id);
    if (!sp) return undefined;
    const normalized = this.normalizeStudioFiles(files);
    if (normalized.length === 0) return undefined;

    const now = new Date().toISOString();
    const version: StudioProjectVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label:
        (opts.label || '').trim().slice(0, 140) ||
        (opts.origin === 'manual'
          ? 'Sauvegarde manuelle'
          : opts.origin === 'iteration'
            ? 'Modification IA'
            : opts.origin === 'restore'
              ? 'Restauration de version'
              : 'Génération initiale'),
      createdAt: now,
      origin: opts.origin,
      generationRunId: opts.generationRunId,
      fileCount: normalized.length,
      files: normalized,
    };

    sp.files = normalized;
    sp.versions.unshift(version);
    // Keep a bounded, real version history (30 revisions max)
    if (sp.versions.length > 30) sp.versions = sp.versions.slice(0, 30);
    if (opts.status) sp.status = opts.status;
    if (opts.lastBuildStatus) sp.lastBuildStatus = opts.lastBuildStatus;
    if (typeof opts.lastBuildError === 'string') {
      sp.lastBuildError = opts.lastBuildError.slice(0, 2000);
    } else if (opts.lastBuildStatus === 'ok') {
      sp.lastBuildError = undefined;
    }
    sp.updatedAt = now;
    this.saveToDisk();
    return { project: sp, version };
  }

  restoreStudioProjectVersion(
    userId: string,
    id: string,
    versionId: string
  ): { project: StudioProject; version: StudioProjectVersion } | undefined {
    const sp = this.getStudioProject(userId, id);
    if (!sp) return undefined;
    const target = sp.versions.find((v) => v.id === versionId);
    if (!target) return undefined;
    return this.saveStudioProjectFiles(userId, id, target.files, {
      label: `Restauration : ${target.label}`,
      origin: 'restore',
      generationRunId: target.generationRunId,
      status: 'ready',
      lastBuildStatus: 'unknown',
    });
  }

  duplicateStudioProject(userId: string, id: string): StudioProject | undefined {
    const sp = this.getStudioProject(userId, id);
    if (!sp) return undefined;
    const now = new Date().toISOString();
    const copy: StudioProject = {
      id: `studio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: `${sp.name} (copie)`.slice(0, 80),
      description: sp.description,
      type: sp.type,
      status: sp.files.length > 0 ? 'ready' : 'draft',
      files: this.normalizeStudioFiles(sp.files),
      lastBuildStatus: sp.lastBuildStatus,
      versions: [],
      generationRuns: [],
      createdAt: now,
      updatedAt: now,
    };
    if (copy.files.length > 0) {
      copy.versions = [
        {
          id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: `Dupliqué depuis « ${sp.name} »`,
          createdAt: now,
          origin: 'manual',
          fileCount: copy.files.length,
          files: this.normalizeStudioFiles(sp.files),
        },
      ];
    }
    this.db.studioProjects.unshift(copy);
    this.saveToDisk();
    return copy;
  }

  deleteStudioProject(userId: string, id: string): boolean {
    const before = this.db.studioProjects.length;
    this.db.studioProjects = this.db.studioProjects.filter(
      (sp) => !(sp.id === id && sp.userId === userId)
    );
    this.saveToDisk();
    return this.db.studioProjects.length < before;
  }

  startStudioGenerationRun(
    userId: string,
    projectId: string,
    params: {
      runId?: string;
      kind: StudioGenerationRun['kind'];
      prompt: string;
      modelId?: string;
      providerId?: string;
    }
  ): StudioGenerationRun | undefined {
    const sp = this.getStudioProject(userId, projectId);
    if (!sp) return undefined;
    const run: StudioGenerationRun = {
      id:
        params.runId ||
        `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: params.kind,
      prompt: params.prompt.slice(0, 8000),
      status: 'running',
      modelId: params.modelId,
      providerId: params.providerId,
      createdAt: new Date().toISOString(),
    };
    sp.generationRuns.unshift(run);
    if (sp.generationRuns.length > 50) sp.generationRuns = sp.generationRuns.slice(0, 50);
    sp.status = 'generating';
    sp.updatedAt = run.createdAt;
    this.saveToDisk();
    return run;
  }

  finishStudioGenerationRun(
    userId: string,
    projectId: string,
    runId: string,
    params: {
      status: 'succeeded' | 'failed';
      error?: string;
      versionId?: string;
      modelId?: string;
      providerId?: string;
    }
  ): StudioGenerationRun | undefined {
    const sp = this.getStudioProject(userId, projectId);
    if (!sp) return undefined;
    const run = sp.generationRuns.find((r) => r.id === runId);
    if (!run) return undefined;
    run.status = params.status;
    run.error = params.error?.slice(0, 1000);
    run.versionId = params.versionId;
    if (params.modelId) run.modelId = params.modelId;
    if (params.providerId) run.providerId = params.providerId;
    run.completedAt = new Date().toISOString();
    sp.updatedAt = run.completedAt;
    this.saveToDisk();
    return run;
  }

  addContactMessage(params: {
    kind: 'contact' | 'waitlist';
    name?: string;
    email: string;
    subject?: string;
    message: string;
    planId?: string;
  }): ContactMessageRecord {
    const record: ContactMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: params.kind,
      name: params.name?.slice(0, 120),
      email: params.email.trim().toLowerCase().slice(0, 200),
      subject: params.subject?.slice(0, 200),
      message: params.message.slice(0, 4000),
      planId: params.planId,
      createdAt: new Date().toISOString(),
    };
    if (!this.db.contactMessages) this.db.contactMessages = [];
    this.db.contactMessages.unshift(record);
    if (this.db.contactMessages.length > 500) {
      this.db.contactMessages = this.db.contactMessages.slice(0, 500);
    }
    this.saveToDisk();
    return record;
  }

  listContactMessages(): ContactMessageRecord[] {
    return this.db.contactMessages || [];
  }

  // --- Subscriptions & Plans (Per user) ---
  getUserSubscription(userId: string): UserSubscriptionState {
    if (!this.db.subscriptions) {
      this.db.subscriptions = {};
    }
    if (!this.db.subscriptions[userId]) {
      const existingUser = Object.values(this.db.users).find(
        (u) => u.profile.id === userId
      );
      const planId: PlanId =
        existingUser?.profile.plan === 'plus'
          ? 'plus'
          : existingUser?.profile.plan === 'pro'
          ? 'pro'
          : 'free';

      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const periodEnd = getRenewalDateString();

      this.db.subscriptions[userId] = {
        userId,
        planId,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        paymentProvider: 'none',
        updatedAt: now.toISOString(),
      };
      this.saveToDisk();
    }
    return this.db.subscriptions[userId];
  }

  getUserPlan(userId: string): PlanDefinition {
    const sub = this.getUserSubscription(userId);
    return AURA_PLANS[sub.planId] || AURA_PLANS.free;
  }

  updateUserSubscription(
    userId: string,
    updates: Partial<UserSubscriptionState>
  ): UserSubscriptionState {
    const sub = this.getUserSubscription(userId);
    const updated: UserSubscriptionState = {
      ...sub,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.db.subscriptions[userId] = updated;

    // Keep user profile plan in sync
    const userRecord = Object.values(this.db.users).find(
      (u) => u.profile.id === userId
    );
    if (userRecord && updates.planId) {
      userRecord.profile.plan = updates.planId;
    }

    // Refresh usage metrics limits for the new plan
    const usage = this.db.usageByUser[userId];
    if (usage && updates.planId) {
      const plan = AURA_PLANS[updates.planId];
      if (plan) {
        usage.planId = plan.id;
        usage.monthlyUnitsLimit = plan.limits.monthlyAIUnits;
        usage.webSearchesLimit = plan.limits.monthlyWebSearches;
        usage.siteCreationsLimit = plan.limits.monthlySiteCreations;
        usage.siteModificationsLimit = plan.limits.monthlySiteModifications;
        usage.maxProjectsLimit = plan.limits.maxProjects;
      }
    }

    this.saveToDisk();
    return updated;
  }

  // --- Usage, Monthly Quotas & Audit Ledger (Scoped per userId) ---
  getUsage(userId?: string): UsageMetrics {
    if (!userId) {
      return createEmptyUsage();
    }
    const sub = this.getUserSubscription(userId);
    const plan = AURA_PLANS[sub.planId] || AURA_PLANS.free;
    const activeProjectsCount = this.getProjects(userId).length;

    if (!this.db.usageByUser[userId]) {
      this.db.usageByUser[userId] = createEmptyUsage(plan.id, activeProjectsCount);
    }
    const usage = this.db.usageByUser[userId];

    // Ensure all new schema fields exist on older records
    usage.planId = plan.id;
    usage.monthlyUnitsLimit = plan.limits.monthlyAIUnits;
    usage.webSearchesLimit = plan.limits.monthlyWebSearches;
    usage.siteCreationsLimit = plan.limits.monthlySiteCreations;
    usage.siteModificationsLimit = plan.limits.monthlySiteModifications;
    usage.maxProjectsLimit = plan.limits.maxProjects;
    usage.activeProjectsCount = activeProjectsCount;
    if (!usage.periodRenewalDate) {
      usage.periodRenewalDate = getRenewalDateString();
    }
    if (!usage.byCategory) {
      usage.byCategory = {
        chat: 0,
        search: 0,
        studio_creation: 0,
        studio_modification: 0,
        slides: 0,
        media: 0,
      };
    }
    if (!Array.isArray(usage.recentLedger)) {
      usage.recentLedger = [];
    }

    // Monthly Period Rollover Check
    const now = new Date();
    const renewalTime = new Date(usage.periodRenewalDate).getTime();
    if (now.getTime() >= renewalTime) {
      // New billing period starts: reset monthly consumption
      usage.monthlyUnitsUsed = 0;
      usage.webSearchesUsed = 0;
      usage.siteCreationsUsed = 0;
      usage.siteModificationsUsed = 0;
      usage.requestsUsed = 0;
      usage.periodRenewalDate = getRenewalDateString();
      usage.byCategory = {
        chat: 0,
        search: 0,
        studio_creation: 0,
        studio_modification: 0,
        slides: 0,
        media: 0,
      };
      this.saveToDisk();
    }

    const today = getTodayDateString();
    if (usage.date !== today) {
      usage.date = today;
      usage.requestsUsed = 0;
      this.saveToDisk();
    }

    return usage;
  }

  canMakeRequest(
    userId: string,
    category: UsageCategory = 'chat'
  ): {
    allowed: boolean;
    reason?: string;
    code?:
      | 'CONCURRENT_REQUEST_LIMIT'
      | 'MONTHLY_UNITS_EXCEEDED'
      | 'WEB_SEARCH_LIMIT_EXCEEDED'
      | 'SITE_CREATIONS_LIMIT_EXCEEDED'
      | 'SITE_MODIFICATIONS_LIMIT_EXCEEDED'
      | 'PROJECT_LIMIT_EXCEEDED';
    cost: number;
    remainingUnits: number;
    monthlyLimit: number;
    renewalDate: string;
  } {
    const usage = this.getUsage(userId);
    const plan = this.getUserPlan(userId);
    const cost = CATEGORY_UNIT_COSTS[category] || 1;
    const remainingUnits = Math.max(0, usage.monthlyUnitsLimit - usage.monthlyUnitsUsed);

    // 1. Concurrency Protection
    if (this.activeUserGenerations.has(userId)) {
      return {
        allowed: false,
        reason:
          'Une génération IA est déjà en cours d’exécution sur votre compte. Veuillez patienter jusqu’à la réception de la réponse.',
        code: 'CONCURRENT_REQUEST_LIMIT',
        cost,
        remainingUnits,
        monthlyLimit: usage.monthlyUnitsLimit,
        renewalDate: usage.periodRenewalDate,
      };
    }

    // 2. Monthly AI Units Quota
    if (usage.monthlyUnitsUsed + cost > usage.monthlyUnitsLimit) {
      return {
        allowed: false,
        reason: `Quota mensuel d’unités IA atteint (${usage.monthlyUnitsUsed}/${usage.monthlyUnitsLimit} unités sur l’offre ${plan.name}). Vos quotas seront renouvelés le ${new Date(
          usage.periodRenewalDate
        ).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}.`,
        code: 'MONTHLY_UNITS_EXCEEDED',
        cost,
        remainingUnits,
        monthlyLimit: usage.monthlyUnitsLimit,
        renewalDate: usage.periodRenewalDate,
      };
    }

    // 3. Category-specific sub-quotas
    if (category === 'search' && usage.webSearchesUsed >= usage.webSearchesLimit) {
      return {
        allowed: false,
        reason: `Quota mensuel de recherches web atteint (${usage.webSearchesUsed}/${usage.webSearchesLimit} sur l’offre ${plan.name}). Vous pouvez continuer avec le chat classique sans recherche web.`,
        code: 'WEB_SEARCH_LIMIT_EXCEEDED',
        cost,
        remainingUnits,
        monthlyLimit: usage.monthlyUnitsLimit,
        renewalDate: usage.periodRenewalDate,
      };
    }

    if (
      category === 'studio_creation' &&
      usage.siteCreationsUsed >= usage.siteCreationsLimit
    ) {
      return {
        allowed: false,
        reason: `Quota mensuel de créations de sites web atteint (${usage.siteCreationsUsed}/${usage.siteCreationsLimit} sur l’offre ${plan.name}). Vous pouvez continuer à modifier et itérer sur vos projets déjà créés.`,
        code: 'SITE_CREATIONS_LIMIT_EXCEEDED',
        cost,
        remainingUnits,
        monthlyLimit: usage.monthlyUnitsLimit,
        renewalDate: usage.periodRenewalDate,
      };
    }

    if (
      category === 'studio_modification' &&
      usage.siteModificationsUsed >= usage.siteModificationsLimit
    ) {
      return {
        allowed: false,
        reason: `Quota mensuel de modifications de sites web atteint (${usage.siteModificationsUsed}/${usage.siteModificationsLimit} sur l’offre ${plan.name}).`,
        code: 'SITE_MODIFICATIONS_LIMIT_EXCEEDED',
        cost,
        remainingUnits,
        monthlyLimit: usage.monthlyUnitsLimit,
        renewalDate: usage.periodRenewalDate,
      };
    }

    return {
      allowed: true,
      cost,
      remainingUnits,
      monthlyLimit: usage.monthlyUnitsLimit,
      renewalDate: usage.periodRenewalDate,
    };
  }

  reserveUsage(
    userId: string,
    params: {
      operationId: string;
      category: UsageCategory;
      modelId: string;
      providerId: string;
    }
  ): {
    allowed: boolean;
    reservationId?: string;
    cost: number;
    reason?: string;
    code?: string;
    renewalDate?: string;
    isIdempotent?: boolean;
  } {
    // Idempotency check: if this operationId was already committed, do not double-debit
    const existing = this.db.usageLedger?.find(
      (l) => l.operationId === params.operationId && l.userId === userId
    );
    if (existing && existing.status === 'committed') {
      return {
        allowed: true,
        cost: 0,
        isIdempotent: true,
      };
    }

    const check = this.canMakeRequest(userId, params.category);
    if (!check.allowed) {
      // Record rejected attempt in audit logs
      const usage = this.getUsage(userId);
      usage.recentLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode: params.category === 'search' ? 'search' : 'chat',
        modelId: params.modelId,
        providerId: params.providerId,
        tokens: 0,
        status: 'quota_exceeded',
      });
      usage.recentLogs = usage.recentLogs.slice(0, 30);
      this.saveToDisk();

      return {
        allowed: false,
        reason: check.reason,
        code: check.code,
        cost: check.cost,
        renewalDate: check.renewalDate,
      };
    }

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.activeReservations.set(reservationId, {
      userId,
      operationId: params.operationId,
      category: params.category,
      units: check.cost,
      modelId: params.modelId,
      providerId: params.providerId,
      createdAt: Date.now(),
    });

    // Lock user concurrency
    this.activeUserGenerations.add(userId);

    return {
      allowed: true,
      reservationId,
      cost: check.cost,
    };
  }

  commitUsage(
    reservationId: string,
    params: {
      inputTokens: number;
      outputTokens: number;
      mode: AuraMode;
    }
  ): UsageMetrics {
    const reservation = this.activeReservations.get(reservationId);
    if (!reservation) {
      // If no reservation found, return existing usage without breaking
      return this.getUsage();
    }

    const { userId, category, units, modelId, providerId, operationId } = reservation;
    this.activeReservations.delete(reservationId);
    this.activeUserGenerations.delete(userId);

    const usage = this.getUsage(userId);
    usage.monthlyUnitsUsed = Math.min(
      usage.monthlyUnitsLimit,
      usage.monthlyUnitsUsed + units
    );
    usage.requestsUsed += 1;
    usage.estimatedInputTokens += params.inputTokens;
    usage.estimatedOutputTokens += params.outputTokens;
    usage.byMode[params.mode] = (usage.byMode[params.mode] || 0) + 1;
    usage.byModel[modelId] = (usage.byModel[modelId] || 0) + 1;
    usage.byCategory[category] = (usage.byCategory[category] || 0) + 1;

    // Sub-quotas counters
    if (category === 'search') {
      usage.webSearchesUsed += 1;
    } else if (category === 'studio_creation') {
      usage.siteCreationsUsed += 1;
    } else if (category === 'studio_modification') {
      usage.siteModificationsUsed += 1;
    }

    const ledgerEntry: UsageLedgerEntry = {
      id: `ledg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      operationId,
      category,
      unitsDeducted: units,
      modelId,
      providerId,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      timestamp: new Date().toISOString(),
      status: 'committed',
    };

    if (!Array.isArray(this.db.usageLedger)) {
      this.db.usageLedger = [];
    }
    this.db.usageLedger.unshift(ledgerEntry);
    this.db.usageLedger = this.db.usageLedger.slice(0, 150);

    usage.recentLedger.unshift(ledgerEntry);
    usage.recentLedger = usage.recentLedger.slice(0, 30);

    usage.recentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: params.mode,
      modelId,
      providerId,
      tokens: params.inputTokens + params.outputTokens,
      status: 'success',
    });
    usage.recentLogs = usage.recentLogs.slice(0, 30);

    this.saveToDisk();
    return usage;
  }

  releaseUsage(reservationId: string, reason?: string): UsageMetrics {
    const reservation = this.activeReservations.get(reservationId);
    if (!reservation) {
      return this.getUsage();
    }

    const { userId, category, modelId, providerId, operationId } = reservation;
    this.activeReservations.delete(reservationId);
    this.activeUserGenerations.delete(userId);

    const usage = this.getUsage(userId);

    // Audit the released units so user is never charged on failure
    const ledgerEntry: UsageLedgerEntry = {
      id: `ledg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      operationId,
      category,
      unitsDeducted: 0,
      modelId,
      providerId,
      inputTokens: 0,
      outputTokens: 0,
      timestamp: new Date().toISOString(),
      status: 'released',
      note: reason || 'Génération échouée ou annulée (aucun débit).',
    };

    if (!Array.isArray(this.db.usageLedger)) {
      this.db.usageLedger = [];
    }
    this.db.usageLedger.unshift(ledgerEntry);
    this.db.usageLedger = this.db.usageLedger.slice(0, 150);

    usage.recentLedger.unshift(ledgerEntry);
    usage.recentLedger = usage.recentLedger.slice(0, 30);

    usage.recentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: category === 'search' ? 'search' : 'chat',
      modelId,
      providerId,
      tokens: 0,
      status: 'error',
    });
    usage.recentLogs = usage.recentLogs.slice(0, 30);

    this.saveToDisk();
    return usage;
  }

  recordUsage(
    userId: string,
    params: {
      mode: AuraMode;
      modelId: string;
      providerId: string;
      inputTokens: number;
      outputTokens: number;
      status: 'success' | 'error' | 'quota_exceeded';
    }
  ): UsageMetrics {
    const usage = this.getUsage(userId);
    if (params.status === 'success') {
      usage.requestsUsed += 1;
      usage.monthlyUnitsUsed = Math.min(
        usage.monthlyUnitsLimit,
        usage.monthlyUnitsUsed + 1
      );
      usage.estimatedInputTokens += params.inputTokens;
      usage.estimatedOutputTokens += params.outputTokens;
      usage.byMode[params.mode] = (usage.byMode[params.mode] || 0) + 1;
      usage.byModel[params.modelId] = (usage.byModel[params.modelId] || 0) + 1;
    }

    usage.recentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: params.mode,
      modelId: params.modelId,
      providerId: params.providerId,
      tokens: params.inputTokens + params.outputTokens,
      status: params.status,
    });
    usage.recentLogs = usage.recentLogs.slice(0, 30);

    this.saveToDisk();
    return usage;
  }

  resetDailyQuota(userId: string, newLimit?: number): UsageMetrics {
    const usage = this.getUsage(userId);
    usage.requestsUsed = 0;
    usage.monthlyUnitsUsed = 0;
    usage.webSearchesUsed = 0;
    usage.siteCreationsUsed = 0;
    usage.siteModificationsUsed = 0;
    if (typeof newLimit === 'number' && newLimit >= 1 && newLimit <= 1000) {
      usage.monthlyUnitsLimit = newLimit;
    }
    this.saveToDisk();
    return usage;
  }

  exportUserData(userId: string) {
    const userEntry = Object.values(this.db.users).find((u) => u.profile.id === userId);
    if (!userEntry) return null;

    const conversations = this.getConversations(userId);
    const projects = this.getProjects(userId);
    const missions = this.getMissions(userId);
    const library = this.getLibrary(userId);
    const studioProjects = this.getStudioProjects(userId);
    const usage = this.getUsage(userId);
    const subscription = this.getUserSubscription(userId);

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: 'aura-export-v1',
        platform: 'Aura Platform',
        legalNotice: 'Données exportées conformément au droit d’accès et à la portabilité.',
      },
      profile: {
        id: userEntry.profile.id,
        name: userEntry.profile.name,
        email: userEntry.profile.email,
        role: userEntry.profile.role,
        organization: userEntry.profile.organization,
        location: userEntry.profile.location,
        plan: userEntry.profile.plan,
        authProvider: userEntry.profile.authProvider,
        createdAt: userEntry.profile.createdAt,
        consents: userEntry.profile.consents,
        preferences: userEntry.profile.preferences,
      },
      subscription,
      usageSummary: {
        monthlyUnitsUsed: usage.monthlyUnitsUsed,
        monthlyUnitsLimit: usage.monthlyUnitsLimit,
        webSearchesUsed: usage.webSearchesUsed,
        siteCreationsUsed: usage.siteCreationsUsed,
        siteModificationsUsed: usage.siteModificationsUsed,
        estimatedTokens:
          (usage.estimatedInputTokens || 0) + (usage.estimatedOutputTokens || 0),
      },
      conversations,
      projects,
      missions,
      library,
      studioProjects,
    };
  }

  clearUserHistory(userId: string): { clearedCount: number } {
    const before = this.db.conversations.filter((c) => c.userId === userId).length;
    this.db.conversations = this.db.conversations.filter((c) => c.userId !== userId);
    this.db.library = this.db.library.filter(
      (item) => !(item.userId === userId && item.type === 'conversation')
    );
    this.saveToDisk();
    return { clearedCount: before };
  }

  deleteUserAccount(userId: string): boolean {
    const userEntry = Object.entries(this.db.users).find(
      ([, rec]) => rec.profile.id === userId
    );
    if (!userEntry) return false;

    const [emailKey] = userEntry;

    // 1. Revoke and delete sessions
    for (const [token, sess] of Object.entries(this.db.sessions)) {
      if (sess.userId === userId) {
        this.revokedTokens.add(token);
        delete this.db.sessions[token];
      }
    }

    // 2. Remove all user conversations, projects, missions, library, usage, subscriptions
    this.db.conversations = this.db.conversations.filter((c) => c.userId !== userId);
    this.db.projects = this.db.projects.filter((p) => p.userId !== userId);
    this.db.missions = this.db.missions.filter((m) => m.userId !== userId);
    this.db.library = this.db.library.filter((l) => l.userId !== userId);
    this.db.studioProjects = this.db.studioProjects.filter(
      (sp) => sp.userId !== userId
    );
    delete this.db.usageByUser[userId];
    delete this.db.subscriptions[userId];
    this.db.usageLedger = this.db.usageLedger.filter((entry) => entry.userId !== userId);

    // 3. Remove user profile
    delete this.db.users[emailKey];

    this.saveToDisk();
    return true;
  }
}

export const dataStore = new AuraDataStore();
