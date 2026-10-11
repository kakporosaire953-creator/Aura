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
  UsageMetrics,
  UserProfile,
} from '../shared/types.ts';

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

interface PersistedDatabase {
  users: Record<string, StoredUserRecord>;
  sessions: Record<string, SessionRecord>;
  conversations: Conversation[];
  projects: AuraProject[];
  missions: AuraMission[];
  library: LibraryItem[];
  usageByUser: Record<string, UsageMetrics>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'aura-store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function createEmptyUsage(): UsageMetrics {
  const dailyLimit = Number(process.env.AURA_DAILY_QUOTA) || 50;
  return {
    date: getTodayDateString(),
    requestsUsed: 0,
    dailyLimit,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    byMode: {
      chat: 0,
      search: 0,
      code: 0,
      create: 0,
    },
    byModel: {},
    recentLogs: [],
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
    usageByUser: {},
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

  constructor() {
    this.db = this.loadFromDisk();
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

        const cleanConversations = Array.isArray(parsed.conversations)
          ? parsed.conversations.filter(
              (c) =>
                c &&
                c.userId &&
                validUserIds.has(c.userId) &&
                !LEGACY_SEED_IDS.has(c.id)
            )
          : [];

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
          usageByUser: cleanUsageByUser,
        };

        this.saveToDisk(sanitized);
        return sanitized;
      }
    } catch (err) {
      console.warn('Initialisation d’un stockage Aura propre:', err);
    }

    const clean = createCleanDatabase();
    this.saveToDisk(clean);
    return clean;
  }

  private saveToDisk(data: PersistedDatabase = this.db): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde locale Aura:', err);
    }
  }

  private createSession(user: UserProfile): string {
    const token = crypto.randomBytes(32).toString('hex');
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
    if (!token) return null;
    const session = this.db.sessions[token];
    if (!session) return null;
    const record = this.db.users[session.email];
    if (!record || record.profile.id !== session.userId) {
      delete this.db.sessions[token];
      this.saveToDisk();
      return null;
    }
    return record.profile;
  }

  revokeSession(token?: string | null): void {
    if (!token) return;
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.saveToDisk();
    }
  }

  registerUser(
    name: string,
    email: string,
    password: string
  ): { user: UserProfile; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (this.db.users[cleanEmail]) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const userId = `user-${Date.now()}-${ crypto.randomBytes(4).toString('hex')}`;

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
    return this.db.conversations
      .filter((c) => c.userId === userId)
      .sort(
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
    this.db.conversations.unshift(conv);
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
    conv.messages.push(...messages);
    if (newTitle && conv.messages.length <= 2) {
      conv.title = newTitle;
    }
    conv.updatedAt = new Date().toISOString();
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

  // --- Usage & Quotas (Scoped per userId) ---
  getUsage(userId?: string): UsageMetrics {
    if (!userId) {
      return createEmptyUsage();
    }
    if (!this.db.usageByUser[userId]) {
      this.db.usageByUser[userId] = createEmptyUsage();
    }
    const usage = this.db.usageByUser[userId];
    const today = getTodayDateString();
    if (usage.date !== today) {
      usage.date = today;
      usage.requestsUsed = 0;
      this.saveToDisk();
    }
    return usage;
  }

  canMakeRequest(userId: string): {
    allowed: boolean;
    remaining: number;
    limit: number;
  } {
    const usage = this.getUsage(userId);
    const remaining = Math.max(0, usage.dailyLimit - usage.requestsUsed);
    return {
      allowed: usage.requestsUsed < usage.dailyLimit,
      remaining,
      limit: usage.dailyLimit,
    };
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
    if (typeof newLimit === 'number' && newLimit >= 1 && newLimit <= 1000) {
      usage.dailyLimit = newLimit;
    }
    this.saveToDisk();
    return usage;
  }
}

export const dataStore = new AuraDataStore();
