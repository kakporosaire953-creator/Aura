import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AttachmentItem,
  AuraLanguage,
  AuraMission,
  AuraMode,
  AuraProject,
  AuraTheme,
  Conversation,
  LibraryItem,
  OnboardingData,
  ProviderStatus,
  UsageMetrics,
  UserProfile,
} from '../shared/types';

interface PersistenceInfo {
  engine: string;
  supabaseConfigured: boolean;
  description: string;
}

interface AuraContextValue {
  user: UserProfile;
  authenticatedUser: UserProfile | null;
  isAuthenticated: boolean;
  theme: AuraTheme;
  language: AuraLanguage;
  activeMode: AuraMode;
  activeProjectId?: string;
  conversations: Conversation[];
  projects: AuraProject[];
  missions: AuraMission[];
  libraryItems: LibraryItem[];
  providers: ProviderStatus[];
  persistenceInfo: PersistenceInfo;
  usage: UsageMetrics | null;
  isLoadingInitial: boolean;
  isSending: boolean;
  errorBanner: string | null;
  clearError: () => void;
  setTheme: (theme: AuraTheme) => void;
  toggleTheme: () => void;
  setLanguage: (lang: AuraLanguage) => void;
  setActiveMode: (mode: AuraMode) => void;
  setActiveProjectId: (projectId?: string) => void;
  sendMessage: (params: {
    conversationId?: string;
    message: string;
    mode?: AuraMode;
    projectId?: string;
    providerId?: string;
    modelId?: string;
    attachments?: AttachmentItem[];
    activeArtifactContext?: {
      title?: string;
      mode?: AuraMode;
      filename?: string;
      code?: string;
      content?: string;
    };
    onConversationReady?: (conversationId: string) => void;
  }) => Promise<Conversation | null>;
  updateConversationArtifact: (params: {
    conversationId: string;
    title?: string;
    projectId?: string | null;
    messageId?: string;
    updatedCode?: string;
    updatedContent?: string;
  }) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  saveMessageToLibrary: (params: {
    title: string;
    excerpt: string;
    mode: AuraMode;
    conversationId?: string;
    messageId?: string;
    tags?: string[];
  }) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;
  createProject: (params: {
    name: string;
    description: string;
    category: AuraProject['category'];
    color: string;
    icon: string;
    systemContext?: string;
  }) => Promise<AuraProject | null>;
  deleteProject: (id: string) => Promise<void>;
  createMission: (params: {
    title: string;
    category?: string;
    description: string;
    mode?: AuraMode;
    steps?: { label: string; done: boolean }[];
    prompt?: string;
  }) => Promise<AuraMission | null>;
  deleteMission: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Omit<OnboardingData, 'completed'>) => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ ok: boolean; user?: UserProfile }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; user?: UserProfile }>;
  loginWithOAuth: (params: {
    provider: 'google' | 'github';
    email: string;
    name: string;
  }) => Promise<{ ok: boolean; user?: UserProfile; isNewUser?: boolean }>;
  logout: () => Promise<void>;
  resetQuota: (newLimit?: number) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const SESSION_TOKEN_KEY = 'aura_session_token';

// Safe storage with in-memory fallback for cross-origin preview iframes
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryStore.set(key, val);
      return val;
    }
  } catch {
    // localStorage restricted in cross-origin iframe
  }
  return memoryStore.get(key) ?? null;
}

function safeSetItem(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage restriction
  }
}

function safeRemoveItem(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage restriction
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
}

const emptyGuestPlaceholder: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: '',
  organization: '',
  location: '',
  plan: 'free',
  onboardingCompleted: false,
  preferences: {
    language: 'fr',
    theme: 'light',
    defaultMode: 'chat',
    defaultProvider: 'gemini',
  },
};

function getStoredToken(): string | null {
  return safeGetItem(SESSION_TOKEN_KEY);
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const AuraContext = createContext<AuraContextValue | undefined>(undefined);

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);
  const [theme, setThemeState] = useState<AuraTheme>(() => {
    const saved = safeGetItem('aura_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [language, setLanguageState] = useState<AuraLanguage>(() => {
    const saved = safeGetItem('aura_lang');
    return saved === 'en' ? 'en' : 'fr';
  });
  const [activeMode, setActiveMode] = useState<AuraMode>('chat');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<AuraProject[]>([]);
  const [missions, setMissions] = useState<AuraMission[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [persistenceInfo, setPersistenceInfo] = useState<PersistenceInfo>({
    engine: 'server-json-store',
    supabaseConfigured: false,
    description: 'Persistance serveur active',
  });
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Clean up any legacy demo storage keys on boot
  useEffect(() => {
    safeRemoveItem('aura_onboarded');
    safeRemoveItem('aura_onboarding_profile');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    safeSetItem('aura_theme', theme);
  }, [theme]);

  useEffect(() => {
    safeSetItem('aura_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const setTheme = useCallback((newTheme: AuraTheme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setLanguage = useCallback((newLang: AuraLanguage) => {
    setLanguageState(newLang);
  }, []);

  const clearError = useCallback(() => setErrorBanner(null), []);

  const clearClientUserData = useCallback(() => {
    setAuthenticatedUser(null);
    setConversations([]);
    setProjects([]);
    setMissions([]);
    setLibraryItems([]);
    setActiveProjectId(undefined);
    setUsage(null);
  }, []);

  const refreshAll = useCallback(async () => {
    const token = getStoredToken();
    try {
      const statusRes = await fetchWithTimeout('/api/status', {
        headers: authHeaders(),
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setProviders(statusData.providers || []);
        if (statusData.persistence) setPersistenceInfo(statusData.persistence);
        if (statusData.usage) setUsage(statusData.usage);
      }

      if (!token) {
        clearClientUserData();
        setIsLoadingInitial(false);
        return;
      }

      const meRes = await fetchWithTimeout('/api/auth/me', {
        headers: authHeaders(),
      });

      if (!meRes.ok) {
        safeRemoveItem(SESSION_TOKEN_KEY);
        clearClientUserData();
        setIsLoadingInitial(false);
        return;
      }

      const meData = await meRes.json();
      if (!meData.user) {
        safeRemoveItem(SESSION_TOKEN_KEY);
        clearClientUserData();
        setIsLoadingInitial(false);
        return;
      }

      setAuthenticatedUser(meData.user);
      if (meData.user.preferences?.defaultMode) {
        setActiveMode(meData.user.preferences.defaultMode);
      }

      const [convRes, projRes, missRes, libRes, usageRes] = await Promise.all([
        fetchWithTimeout('/api/conversations', { headers: authHeaders() }),
        fetchWithTimeout('/api/projects', { headers: authHeaders() }),
        fetchWithTimeout('/api/missions', { headers: authHeaders() }),
        fetchWithTimeout('/api/library', { headers: authHeaders() }),
        fetchWithTimeout('/api/usage', { headers: authHeaders() }),
      ]);

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData.conversations || []);
      } else {
        setConversations([]);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      } else {
        setProjects([]);
      }

      if (missRes.ok) {
        const missData = await missRes.json();
        setMissions(missData.missions || []);
      } else {
        setMissions([]);
      }

      if (libRes.ok) {
        const libData = await libRes.json();
        setLibraryItems(libData.items || []);
      } else {
        setLibraryItems([]);
      }

      if (usageRes.ok) {
        const uData = await usageRes.json();
        setUsage(uData.usage || null);
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation Aura:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [clearClientUserData]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const sendMessage = useCallback(
    async (params: {
      conversationId?: string;
      message: string;
      mode?: AuraMode;
      projectId?: string;
      providerId?: string;
      modelId?: string;
      attachments?: AttachmentItem[];
      activeArtifactContext?: {
        title?: string;
        mode?: AuraMode;
        filename?: string;
        code?: string;
        content?: string;
      };
      onConversationReady?: (conversationId: string) => void;
    }): Promise<Conversation | null> => {
      if (!authenticatedUser) {
        setErrorBanner('Veuillez vous connecter pour utiliser Aura.');
        return null;
      }

      setIsSending(true);
      setErrorBanner(null);

      const modeToUse = params.mode || activeMode;
      const targetConvId =
        params.conversationId ||
        `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nowIso = new Date().toISOString();
      const optimisticUserMsg = {
        id: `msg-u-opt-${Date.now()}`,
        conversationId: targetConvId,
        role: 'user' as const,
        content: params.message,
        mode: modeToUse,
        createdAt: nowIso,
        attachments: params.attachments,
      };

      const autoTitle =
        params.message.length > 52
          ? `${params.message.slice(0, 52)}...`
          : params.message;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === targetConvId);
        if (existing) {
          const updated: Conversation = {
            ...existing,
            mode: modeToUse,
            updatedAt: nowIso,
            messages: [...existing.messages, optimisticUserMsg],
          };
          return [updated, ...prev.filter((c) => c.id !== targetConvId)];
        }
        const optimisticConv: Conversation = {
          id: targetConvId,
          userId: authenticatedUser.id,
          title: autoTitle,
          mode: modeToUse,
          projectId: params.projectId ?? activeProjectId,
          createdAt: nowIso,
          updatedAt: nowIso,
          messages: [optimisticUserMsg],
        };
        return [optimisticConv, ...prev];
      });

      if (params.onConversationReady) {
        params.onConversationReady(targetConvId);
      }

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            conversationId: targetConvId,
            projectId: params.projectId ?? activeProjectId,
            mode: modeToUse,
            message: params.message,
            providerId:
              params.providerId ||
              authenticatedUser.preferences.defaultProvider ||
              'gemini',
            modelId: params.modelId || 'gemini-3.8-flash',
            language,
            attachments: params.attachments,
            activeArtifactContext: params.activeArtifactContext,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorBanner(
            data.error || 'Une erreur est survenue lors de la génération.'
          );
          if (data.usage) setUsage(data.usage);
          return null;
        }

        const updatedConv: Conversation = data.conversation;
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== updatedConv.id);
          return [updatedConv, ...filtered];
        });
        if (data.usage) {
          setUsage(data.usage);
        }
        if (params.attachments && params.attachments.length > 0) {
          const libRes = await fetch('/api/library', {
            headers: authHeaders(),
          });
          if (libRes.ok) {
            const libData = await libRes.json();
            setLibraryItems(libData.items || []);
          }
        }
        return updatedConv;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Impossible de contacter le serveur Aura.';
        setErrorBanner(msg);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [activeMode, activeProjectId, authenticatedUser, language]
  );

  const updateConversationArtifact = useCallback(
    async (params: {
      conversationId: string;
      title?: string;
      projectId?: string | null;
      messageId?: string;
      updatedCode?: string;
      updatedContent?: string;
    }): Promise<Conversation | null> => {
      try {
        const res = await fetch(`/api/conversations/${params.conversationId}`, {
          method: 'PUT',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(params),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const updatedConv: Conversation = data.conversation;
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
        return updatedConv;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteConversation = useCallback(async (id: string) => {
    await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setLibraryItems((prev) => prev.filter((i) => i.conversationId !== id));
  }, []);

  const saveMessageToLibrary = useCallback(
    async (params: {
      title: string;
      excerpt: string;
      mode: AuraMode;
      conversationId?: string;
      messageId?: string;
      tags?: string[];
    }) => {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          type: 'saved_response',
          ...params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibraryItems((prev) => [data.item, ...prev]);
        if (params.conversationId && params.messageId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === params.conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === params.messageId ? { ...m, savedToLibrary: true } : m
                    ),
                  }
                : c
            )
          );
        }
      }
    },
    []
  );

  const deleteLibraryItem = useCallback(async (id: string) => {
    await fetch(`/api/library/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    setLibraryItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const createProject = useCallback(
    async (params: {
      name: string;
      description: string;
      category: AuraProject['category'];
      color: string;
      icon: string;
      systemContext?: string;
    }): Promise<AuraProject | null> => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [data.project, ...prev]);
        return data.project;
      }
      return null;
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(undefined);
    },
    [activeProjectId]
  );

  const createMission = useCallback(
    async (params: {
      title: string;
      category?: string;
      description: string;
      mode?: AuraMode;
      steps?: { label: string; done: boolean }[];
      prompt?: string;
    }): Promise<AuraMission | null> => {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setMissions((prev) => [data.mission, ...prev]);
        return data.mission;
      }
      return null;
    },
    []
  );

  const deleteMission = useCallback(async (id: string) => {
    await fetch(`/api/missions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setAuthenticatedUser(data.user);
      if (updates.preferences?.theme) setThemeState(updates.preferences.theme);
      if (updates.preferences?.language) setLanguageState(updates.preferences.language);
    }
  }, []);

  const completeOnboarding = useCallback(
    async (data: Omit<OnboardingData, 'completed'>): Promise<boolean> => {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      const result = await res.json();
      if (result.user) {
        setAuthenticatedUser(result.user);
        if (result.user.preferences?.defaultMode) {
          setActiveMode(result.user.preferences.defaultMode);
        }
        if (result.user.preferences?.language) {
          setLanguageState(result.user.preferences.language);
        }
      }
      return true;
    },
    []
  );

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; user?: UserProfile }> => {
      setErrorBanner(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Identifiants invalides.');
        return { ok: false };
      }

      safeSetItem(SESSION_TOKEN_KEY, data.token);
      setAuthenticatedUser(data.user);
      await refreshAll();
      return { ok: true, user: data.user };
    },
    [refreshAll]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ ok: boolean; user?: UserProfile }> => {
      setErrorBanner(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Inscription impossible.');
        return { ok: false };
      }

      // Start with a completely fresh session for this newly registered user
      safeSetItem(SESSION_TOKEN_KEY, data.token);
      setAuthenticatedUser(data.user);
      setConversations([]);
      setProjects([]);
      setMissions([]);
      setLibraryItems([]);
      setActiveProjectId(undefined);
      return { ok: true, user: data.user };
    },
    []
  );

  const loginWithOAuth = useCallback(
    async (params: {
      provider: 'google' | 'github';
      email: string;
      name: string;
    }): Promise<{ ok: boolean; user?: UserProfile; isNewUser?: boolean }> => {
      setErrorBanner(null);
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Connexion OAuth impossible.');
        return { ok: false };
      }

      safeSetItem(SESSION_TOKEN_KEY, data.token);
      setAuthenticatedUser(data.user);
      await refreshAll();
      return {
        ok: true,
        user: data.user,
        isNewUser: Boolean(data.isNewUser),
      };
    },
    [refreshAll]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch {
      // ignore network error on logout
    }
    safeRemoveItem(SESSION_TOKEN_KEY);
    safeRemoveItem('aura_onboarded');
    safeRemoveItem('aura_onboarding_profile');
    clearClientUserData();
  }, [clearClientUserData]);

  const resetQuota = useCallback(async (newLimit?: number) => {
    const res = await fetch('/api/usage/reset', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ dailyLimit: newLimit }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsage(data.usage);
      setErrorBanner(null);
    }
  }, []);

  const user = authenticatedUser || emptyGuestPlaceholder;
  const isAuthenticated = Boolean(authenticatedUser && authenticatedUser.id);

  return (
    <AuraContext.Provider
      value={{
        user,
        authenticatedUser,
        isAuthenticated,
        theme,
        language,
        activeMode,
        activeProjectId,
        conversations,
        projects,
        missions,
        libraryItems,
        providers,
        persistenceInfo,
        usage,
        isLoadingInitial,
        isSending,
        errorBanner,
        clearError,
        setTheme,
        toggleTheme,
        setLanguage,
        setActiveMode,
        setActiveProjectId,
        sendMessage,
        updateConversationArtifact,
        deleteConversation,
        saveMessageToLibrary,
        deleteLibraryItem,
        createProject,
        deleteProject,
        createMission,
        deleteMission,
        updateProfile,
        completeOnboarding,
        login,
        register,
        loginWithOAuth,
        logout,
        resetQuota,
        refreshAll,
      }}
    >
      {children}
    </AuraContext.Provider>
  );
};

export function useAura(): AuraContextValue {
  const ctx = useContext(AuraContext);
  if (!ctx) {
    throw new Error('useAura doit être utilisé à l’intérieur d’un AuraProvider.');
  }
  return ctx;
}
