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
  PlanId,
  PlanDefinition,
  UserSubscriptionState,
  AURA_PLANS,
} from '../shared/types';
import { aiService } from '../services/aiService';
import {
  getBrowserSupabaseClient,
  mapSupabaseUserToProfile,
} from '../services/supabaseAuthClient';

interface PersistenceInfo {
  engine: string;
  supabaseConfigured: boolean;
  description: string;
}

interface AuraContextValue {
  user: UserProfile;
  authenticatedUser: UserProfile | null;
  isAuthenticated: boolean;
  subscription: UserSubscriptionState | null;
  currentPlan: PlanDefinition;
  theme: AuraTheme;
  language: AuraLanguage;
  activeMode: AuraMode;
  activeModelId: string;
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
  setActiveModelId: (modelId: string) => void;
  setActiveProjectId: (projectId?: string) => void;
  sendMessage: (params: {
    conversationId?: string;
    message: string;
    mode?: AuraMode;
    projectId?: string;
    providerId?: string;
    modelId?: string;
    mediaOptions?: {
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      slideCount?: number;
      style?: string;
    };
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
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; user?: UserProfile; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    consents?: { termsConsent: boolean; marketingConsent?: boolean }
  ) => Promise<{ ok: boolean; user?: UserProfile; error?: string }>;
  loginWithOAuth: (params: {
    provider: 'google' | 'github';
    email: string;
    name: string;
  }) => Promise<{ ok: boolean; user?: UserProfile; isNewUser?: boolean; error?: string }>;
  exportUserData: () => Promise<unknown>;
  clearUserHistory: () => Promise<{ ok: boolean; message?: string }>;
  deleteUserAccount: (confirmEmail: string) => Promise<{ ok: boolean; error?: string }>;
  updateCustomInstructions: (instructions: string) => Promise<boolean>;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  joinWaitlistOrUpgrade: (
    planId: PlanId
  ) => Promise<{ ok: boolean; isWaitlist?: boolean; message?: string; error?: string }>;
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
  timeoutMs = 3500,
  retries = 0
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      window.clearTimeout(id);
      return response;
    } catch (err) {
      window.clearTimeout(id);
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => window.setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
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

function dedupeConversations(list: Conversation[]): Conversation[] {
  const seen = new Map<string, Conversation>();
  for (const conv of list) {
    if (!conv || !conv.id) continue;
    const prev = seen.get(conv.id);
    if (
      !prev ||
      (conv.messages?.length || 0) >= (prev.messages?.length || 0)
    ) {
      seen.set(conv.id, conv);
    }
  }
  return Array.from(seen.values());
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
  const [activeModelId, setActiveModelId] = useState<string>('aura-3.8-flash');
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
  const [subscription, setSubscription] = useState<UserSubscriptionState | null>(null);
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

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    const saved = safeGetItem('aura_reduced_motion');
    return saved === 'true';
  });

  const toggleReducedMotion = useCallback(() => {
    setReducedMotionState((prev) => {
      const next = !prev;
      safeSetItem('aura_reduced_motion', String(next));
      if (next) {
        document.documentElement.classList.add('aura-reduced-motion');
      } else {
        document.documentElement.classList.remove('aura-reduced-motion');
      }
      return next;
    });
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
    setSubscription(null);
  }, []);

  const refreshAll = useCallback(async () => {
    const token = getStoredToken();

    // If not authenticated, unblock initial loading immediately
    if (!token) {
      clearClientUserData();
      setIsLoadingInitial(false);
      // Fetch status in background without blocking rendering
      fetchWithTimeout('/api/status', {}, 2500, 0)
        .then(async (res) => {
          if (res.ok) {
            const statusData = await res.json();
            if (statusData.providers) setProviders(statusData.providers);
            if (statusData.persistence) setPersistenceInfo(statusData.persistence);
            if (statusData.usage) setUsage(statusData.usage);
          }
        })
        .catch(() => {});
      return;
    }

    try {
      const statusRes = await fetchWithTimeout('/api/status', {
        headers: authHeaders(),
      }).catch(() => null);

      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        setProviders(statusData.providers || []);
        if (statusData.persistence) setPersistenceInfo(statusData.persistence);
        if (statusData.usage) setUsage(statusData.usage);
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

      const [convRes, projRes, missRes, libRes, usageRes, subRes] = await Promise.all([
        fetchWithTimeout('/api/conversations', { headers: authHeaders() }),
        fetchWithTimeout('/api/projects', { headers: authHeaders() }),
        fetchWithTimeout('/api/missions', { headers: authHeaders() }),
        fetchWithTimeout('/api/library', { headers: authHeaders() }),
        fetchWithTimeout('/api/usage', { headers: authHeaders() }),
        fetchWithTimeout('/api/billing/subscription', { headers: authHeaders() }),
      ]);

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(dedupeConversations(convData.conversations || []));
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

      if (subRes.ok) {
        const sData = await subRes.json();
        setSubscription(sData.subscription || null);
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation Aura:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [clearClientUserData]);

  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      setIsLoadingInitial(false);
    }, 1500);

    refreshAll().finally(() => {
      window.clearTimeout(safetyTimer);
      setIsLoadingInitial(false);
    });

    return () => window.clearTimeout(safetyTimer);
  }, [refreshAll]);

  // Synchronize and subscribe to active Supabase Auth sessions
  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    (async () => {
      const supabase = await getBrowserSupabaseClient();
      if (!supabase || !isMounted) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeSession = sessionData?.session;
        if (activeSession?.user && activeSession.access_token) {
          safeSetItem(SESSION_TOKEN_KEY, activeSession.access_token);
          const profile = mapSupabaseUserToProfile(activeSession.user);
          setAuthenticatedUser((prev) => prev || profile);

          fetch('/api/auth/supabase-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: activeSession.access_token,
              user: profile,
            }),
          }).catch(() => {});
        }

        const { data: subData } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            if (
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'USER_UPDATED'
            ) {
              if (session?.user && session.access_token) {
                safeSetItem(SESSION_TOKEN_KEY, session.access_token);
                const profile = mapSupabaseUserToProfile(session.user);
                setAuthenticatedUser(profile);

                fetch('/api/auth/supabase-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    accessToken: session.access_token,
                    user: profile,
                  }),
                }).catch(() => {});

                await refreshAll();
              }
            } else if (event === 'SIGNED_OUT') {
              safeRemoveItem(SESSION_TOKEN_KEY);
              clearClientUserData();
            }
          }
        );
        authSubscription = subData.subscription;
      } catch (err) {
        console.warn('Supabase Auth init ignoré:', err);
      }
    })();

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, [clearClientUserData, refreshAll]);

  const sendMessage = useCallback(
    async (params: {
      conversationId?: string;
      message: string;
      mode?: AuraMode;
      projectId?: string;
      providerId?: string;
      modelId?: string;
      mediaOptions?: {
        aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
        slideCount?: number;
        style?: string;
      };
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

      const requestedMode = params.mode || activeMode;
      const requestedModel = params.modelId || activeModelId || 'aura-3.8-flash';
      const route = aiService.resolveModelRouting({
        modelId: requestedModel,
        providerId:
          params.providerId || authenticatedUser.preferences.defaultProvider,
        mode: requestedMode,
        providers,
      });

      const modeToUse = route.effectiveMode;
      const modelToUse = route.effectiveModelId;
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
        const result = await aiService.sendAIRequest(
          {
            conversationId: targetConvId,
            projectId: params.projectId ?? activeProjectId,
            mode: modeToUse,
            message: params.message,
            providerId: route.providerId,
            modelId: modelToUse,
            mediaOptions: params.mediaOptions,
            language,
            attachments: params.attachments,
            activeArtifactContext: params.activeArtifactContext,
          },
          providers
        );

        const updatedConv: Conversation = result.conversation;
        setConversations((prev) =>
          dedupeConversations([
            updatedConv,
            ...prev.filter((c) => c.id !== updatedConv.id),
          ])
        );
        if (result.usage) {
          setUsage(result.usage);
        }
        if (params.attachments && params.attachments.length > 0) {
          const libRes = await fetchWithTimeout('/api/library', {
            headers: authHeaders(),
          });
          if (libRes.ok) {
            const libData = await libRes.json();
            setLibraryItems(libData.items || []);
          }
        }
        return updatedConv;
      } catch (err) {
        const typedErr = err as Error & { usage?: UsageMetrics };
        if (typedErr.usage) {
          setUsage(typedErr.usage);
        }
        const msg =
          typedErr instanceof Error && typedErr.message !== 'Failed to fetch'
            ? typedErr.message
            : 'Impossible de contacter le serveur Aura. Veuillez réessayer.';
        setErrorBanner(msg);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [activeMode, activeModelId, activeProjectId, authenticatedUser, language, providers]
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
        const res = await fetchWithTimeout(`/api/conversations/${params.conversationId}`, {
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
    try {
      await fetchWithTimeout(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      // ignore network error
    }
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
      try {
        const res = await fetchWithTimeout('/api/library', {
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
      } catch {
        setErrorBanner('Impossible de sauvegarder dans la bibliothèque pour le moment.');
      }
    },
    []
  );

  const deleteLibraryItem = useCallback(async (id: string) => {
    try {
      await fetchWithTimeout(`/api/library/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      // ignore network error
    }
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
      try {
        const res = await fetchWithTimeout('/api/projects', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const data = await res.json();
          setProjects((prev) => [data.project, ...prev]);
          return data.project;
        }
      } catch {
        setErrorBanner('Impossible de créer le projet pour le moment.');
      }
      return null;
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await fetchWithTimeout(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      } catch {
        // ignore network error
      }
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
      try {
        const res = await fetchWithTimeout('/api/missions', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const data = await res.json();
          setMissions((prev) => [data.mission, ...prev]);
          return data.mission;
        }
      } catch {
        setErrorBanner('Impossible de créer la mission pour le moment.');
      }
      return null;
    },
    []
  );

  const deleteMission = useCallback(async (id: string) => {
    try {
      await fetchWithTimeout(`/api/missions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      // ignore network error
    }
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const supabase = await getBrowserSupabaseClient();
      if (supabase) {
        await supabase.auth
          .updateUser({
            data: {
              ...(updates.name ? { name: updates.name, full_name: updates.name } : {}),
              ...(updates.role ? { role: updates.role } : {}),
              ...(updates.organization !== undefined ? { organization: updates.organization } : {}),
              ...(updates.location !== undefined ? { location: updates.location } : {}),
              ...(updates.preferences ? { preferences: updates.preferences } : {}),
            },
          })
          .catch(() => {});
      }

      const res = await fetchWithTimeout('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          safeSetItem(SESSION_TOKEN_KEY, data.token);
        }
        setAuthenticatedUser(data.user);
        if (updates.preferences?.theme) setThemeState(updates.preferences.theme);
        if (updates.preferences?.language) setLanguageState(updates.preferences.language);
      }
    } catch {
      setErrorBanner('Impossible de mettre à jour le profil.');
    }
  }, []);

  const completeOnboarding = useCallback(
    async (data: Omit<OnboardingData, 'completed'>): Promise<boolean> => {
      try {
        const supabase = await getBrowserSupabaseClient();
        if (supabase) {
          await supabase.auth
            .updateUser({
              data: {
                onboardingCompleted: true,
                onboarding: { ...data, completed: true },
              },
            })
            .catch(() => {});
        }

        const res = await fetchWithTimeout('/api/auth/onboarding', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(data),
        });
        if (!res.ok) return false;
        const result = await res.json();
        if (result.token) {
          safeSetItem(SESSION_TOKEN_KEY, result.token);
        }
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
      } catch {
        setErrorBanner('Impossible de finaliser la configuration pour le moment.');
        return false;
      }
    },
    []
  );

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; user?: UserProfile; error?: string }> => {
      setErrorBanner(null);
      const cleanEmail = email.trim().toLowerCase();
      try {
        const supabase = await getBrowserSupabaseClient();
        if (supabase) {
          try {
            const { data: sbData, error: sbError } =
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });

            if (!sbError && sbData?.user && sbData.session) {
              const profile = mapSupabaseUserToProfile(sbData.user);
              safeSetItem(SESSION_TOKEN_KEY, sbData.session.access_token);
              setAuthenticatedUser(profile);

              await fetch('/api/auth/supabase-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: sbData.session.access_token,
                  user: profile,
                }),
              }).catch(() => {});

              await refreshAll();
              return { ok: true, user: profile };
            }
          } catch {
            // Supabase network / auth issue, proceed to server endpoint
          }
        }

        const res = await fetchWithTimeout('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg =
            data.error ||
            'Identifiants incorrects ou compte inexistant. Avez-vous déjà créé votre compte ?';
          setErrorBanner(errMsg);
          return { ok: false, error: errMsg };
        }

        safeSetItem(SESSION_TOKEN_KEY, data.token);
        setAuthenticatedUser(data.user);
        await refreshAll();
        return { ok: true, user: data.user };
      } catch {
        const errMsg =
          'Le service d’authentification est momentanément indisponible.';
        setErrorBanner(errMsg);
        return { ok: false, error: errMsg };
      }
    },
    [refreshAll]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      consents?: { termsConsent: boolean; marketingConsent?: boolean }
    ): Promise<{ ok: boolean; user?: UserProfile; error?: string }> => {
      setErrorBanner(null);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      try {
        const supabase = await getBrowserSupabaseClient();
        if (supabase) {
          try {
            const { data: sbData, error: sbError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  name: cleanName,
                  full_name: cleanName,
                  role: 'Membre Aura',
                  plan: 'free',
                  onboardingCompleted: false,
                  consents: {
                    termsVersion: '2026-v1.0',
                    privacyVersion: '2026-v1.0',
                    consentedAt: new Date().toISOString(),
                    marketingConsent: Boolean(consents?.marketingConsent),
                  },
                },
              },
            });

            if (!sbError && sbData?.user) {
              const profile = mapSupabaseUserToProfile(sbData.user);
              const token = sbData.session?.access_token;
              if (token) {
                safeSetItem(SESSION_TOKEN_KEY, token);
                await fetch('/api/auth/supabase-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    accessToken: token,
                    user: profile,
                  }),
                }).catch(() => {});
                setAuthenticatedUser(profile);
                setConversations([]);
                setProjects([]);
                setMissions([]);
                setLibraryItems([]);
                setActiveProjectId(undefined);
                return { ok: true, user: profile };
              }
            } else if (sbError) {
              if (
                sbError.message.includes('already registered') ||
                sbError.message.includes('User already exists')
              ) {
                const errMsg =
                  'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.';
                setErrorBanner(errMsg);
                return { ok: false, error: errMsg };
              }
            }
          } catch {
            // Ignore error and fall through to server registration
          }
        }

        const res = await fetchWithTimeout('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
            termsConsent: consents?.termsConsent ?? true,
            marketingConsent: Boolean(consents?.marketingConsent),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = data.error || 'Inscription impossible.';
          setErrorBanner(errMsg);
          return { ok: false, error: errMsg };
        }

        safeSetItem(SESSION_TOKEN_KEY, data.token);
        setAuthenticatedUser(data.user);
        setConversations([]);
        setProjects([]);
        setMissions([]);
        setLibraryItems([]);
        setActiveProjectId(undefined);
        return { ok: true, user: data.user };
      } catch {
        const errMsg =
          'Le service d’authentification est momentanément indisponible.';
        setErrorBanner(errMsg);
        return { ok: false, error: errMsg };
      }
    },
    []
  );

  const loginWithOAuth = useCallback(
    async (params: {
      provider: 'google' | 'github';
      email: string;
      name: string;
    }): Promise<{ ok: boolean; user?: UserProfile; isNewUser?: boolean; error?: string }> => {
      setErrorBanner(null);
      try {
        const supabase = await getBrowserSupabaseClient();
        if (supabase) {
          // Check if OAuth URL redirection can be initiated
          const isIframe = window.self !== window.top;
          if (!isIframe) {
            const { error: oauthErr } = await supabase.auth.signInWithOAuth({
              provider: params.provider,
              options: {
                redirectTo: `${window.location.origin}/auth`,
              },
            });
            if (!oauthErr) {
              return { ok: true };
            }
          }
        }

        const res = await fetchWithTimeout('/api/auth/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = data.error || 'Connexion OAuth impossible.';
          setErrorBanner(errMsg);
          return { ok: false, error: errMsg };
        }

        safeSetItem(SESSION_TOKEN_KEY, data.token);
        setAuthenticatedUser(data.user);
        await refreshAll();
        return {
          ok: true,
          user: data.user,
          isNewUser: Boolean(data.isNewUser),
        };
      } catch {
        const errMsg =
          'Le serveur Aura est momentanément injoignable. Veuillez réessayer dans quelques secondes.';
        setErrorBanner(errMsg);
        return { ok: false, error: errMsg };
      }
    },
    [refreshAll]
  );

  const logout = useCallback(async () => {
    try {
      const supabase = await getBrowserSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      await fetchWithTimeout('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
      }).catch(() => {});
    } catch {
      // ignore network error on logout
    }
    safeRemoveItem(SESSION_TOKEN_KEY);
    safeRemoveItem('aura_onboarded');
    safeRemoveItem('aura_onboarding_profile');
    clearClientUserData();
  }, [clearClientUserData]);

  const resetQuota = useCallback(async (newLimit?: number) => {
    try {
      const res = await fetchWithTimeout('/api/usage/reset', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ dailyLimit: newLimit }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
        setErrorBanner(null);
      }
    } catch {
      // ignore network error
    }
  }, []);

  const joinWaitlistOrUpgrade = useCallback(async (planId: PlanId) => {
    try {
      const res = await fetchWithTimeout('/api/billing/subscription', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.subscription) setSubscription(data.subscription);
        if (data.usage) setUsage(data.usage);
        return {
          ok: true,
          isWaitlist: Boolean(data.isWaitlist),
          message:
            data.message ||
            'Votre demande d’accès à Aura Plus a bien été prise en compte.',
        };
      }
      return {
        ok: false,
        error: data.error || 'Impossible de mettre à jour l’abonnement.',
      };
    } catch {
      return {
        ok: false,
        error: 'Le service de facturation est momentanément indisponible.',
      };
    }
  }, []);

  const exportUserData = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/user/export', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Échec de l’export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    } catch (err) {
      setErrorBanner('Impossible d’exporter vos données pour le moment.');
      throw err;
    }
  }, []);

  const clearUserHistory = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/user/history', {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Échec de la suppression de l’historique');
      const data = await res.json();
      setConversations([]);
      setLibraryItems((prev) =>
        prev.filter((item) => item.type !== 'conversation')
      );
      return { ok: true, message: data.message };
    } catch {
      setErrorBanner('Impossible de vider l’historique.');
      return { ok: false };
    }
  }, []);

  const deleteUserAccount = useCallback(async (confirmEmail: string) => {
    try {
      const res = await fetchWithTimeout('/api/user/account', {
        method: 'DELETE',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ confirmEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || 'Erreur lors de la suppression du compte.',
        };
      }
      safeRemoveItem(SESSION_TOKEN_KEY);
      setAuthenticatedUser(null);
      setConversations([]);
      setProjects([]);
      setMissions([]);
      setLibraryItems([]);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Service momentanément indisponible.' };
    }
  }, []);

  const updateCustomInstructions = useCallback(
    async (instructions: string): Promise<boolean> => {
      try {
        const res = await fetchWithTimeout('/api/user/custom-instructions', {
          method: 'PUT',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ customInstructions: instructions }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.user) {
          setAuthenticatedUser(data.user);
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const user = authenticatedUser || emptyGuestPlaceholder;
  const isAuthenticated = Boolean(authenticatedUser && authenticatedUser.id);
  const currentPlan =
    AURA_PLANS[subscription?.planId || authenticatedUser?.plan || 'free'] ||
    AURA_PLANS.free;

  return (
    <AuraContext.Provider
      value={{
        user,
        authenticatedUser,
        isAuthenticated,
        subscription,
        currentPlan,
        theme,
        language,
        activeMode,
        activeModelId,
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
        setActiveModelId,
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
        exportUserData,
        clearUserHistory,
        deleteUserAccount,
        updateCustomInstructions,
        reducedMotion,
        toggleReducedMotion,
        joinWaitlistOrUpgrade,
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
