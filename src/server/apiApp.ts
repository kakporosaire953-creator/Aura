import 'dotenv/config';
import express, { Request, Response } from 'express';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { aiRegistry } from './ai/externalAdapters.ts';
import { dataStore } from './dataStore.ts';
import {
  SendMessagePayloadSchema,
  ChatMessage,
  UserProfile,
  StudioCreateRequestSchema,
  StudioIterateRequestSchema,
  StudioProjectPatchSchema,
  StudioSaveFilesRequestSchema,
  VirtualStudioFile,
} from '../shared/types.ts';
import {
  buildStudioCreationPrompt,
  buildStudioIterationPrompt,
  composePreviewHtml,
  ensureIndexHtml,
  extractStudioFiles,
  validateStudioProject,
} from './ai/studioGenerator.ts';
import { createProjectZip } from './zip.ts';
import { AURA_PLANS, classifyUsageCategory, PlanId } from '../shared/plans.ts';
import { paymentGatewayService } from './billing/paymentAdapter.ts';

import {
  checkSupabaseHealth,
  getPublicSupabaseConfig,
  getSupabaseServerClient,
  verifySupabaseAccessToken,
} from './supabaseClient.ts';

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim() || null;
}

function getAuthenticatedUser(req: Request): UserProfile | null {
  const token = extractBearerToken(req);
  return dataStore.getUserByToken(token);
}

export function createApiApp() {
  const app = express();

  // Basic CORS & Options preflight
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // URL Normalization for Vercel Serverless Function rewrites & subroutes
  app.use((req: any, _res, next) => {
    const qAny = req.query as Record<string, unknown> | undefined;
    const vercelPath = qAny?.__path;

    if (typeof vercelPath === 'string' && vercelPath.trim()) {
      if (qAny) {
        delete qAny.__path;
      }
      const [subpath, search] = vercelPath.split('?');
      req.url = '/api/' + subpath.replace(/^\/+/, '') + (search ? '?' + search : '');
    } else {
      const forwardedUri =
        (req.headers['x-forwarded-uri'] as string) ||
        (req.headers['x-original-url'] as string) ||
        (req.headers['x-real-url'] as string);

      if (forwardedUri && forwardedUri.startsWith('/api') && !forwardedUri.includes('api/index')) {
        req.url = forwardedUri;
      } else {
        const rawMatched =
          (req.headers['x-matched-path'] as string) ||
          (req.headers['x-vercel-matched-path'] as string);

        if (rawMatched && rawMatched.startsWith('/api') && !rawMatched.includes('api/index')) {
          req.url = rawMatched;
        } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/?')) {
          req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
        }
      }
    }

    if (req.body && typeof req.body === 'object') {
      req._body = true;
    }
    next();
  });

  app.use(express.json({ limit: '15mb' }));


  // Ensure Supabase PostgreSQL state is hydrated on serverless cold starts
  app.use(async (_req, _res, next) => {
    try {
      await dataStore.ensureHydrated();
    } catch {
      // non-blocking fallback to local/stateless store
    }
    next();
  });

  // Hydrate Supabase JWT tokens if presented in Bearer headers
  app.use(async (req, _res, next) => {
    const token = extractBearerToken(req);
    if (token && !dataStore.getUserByToken(token) && !token.startsWith('aura1.')) {
      try {
        const sbProfile = await verifySupabaseAccessToken(token);
        if (sbProfile) {
          dataStore.upsertSupabaseAuthUser(sbProfile, token);
        }
      } catch {
        // ignore unverified token
      }
    }
    next();
  });

  // --- API: Supabase Public Config & Diagnostics ---
  app.get('/api/supabase/public-config', (_req, res) => {
    res.json(getPublicSupabaseConfig());
  });

  app.get('/api/supabase/status', async (_req, res) => {
    const health = await dataStore.getSupabaseDiagnostics();
    res.json(health);
  });

  app.post('/api/supabase/sync', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    const result = await dataStore.forceSyncToSupabase();
    const health = await dataStore.getSupabaseDiagnostics();
    res.json({
      ...result,
      health,
    });
  });

  // --- API: System & Multi-Provider Status ---
  app.get('/api/status', async (req, res) => {
    const user = getAuthenticatedUser(req);
    const providers = aiRegistry.getAllStatuses();
    const sbHealth = await dataStore.getSupabaseDiagnostics();
    const supabaseConfigured = sbHealth.configured;
    res.json({
      providers,
      persistence: {
        engine: supabaseConfigured
          ? 'supabase-postgres'
          : process.env.VERCEL
          ? 'vercel-serverless-store'
          : 'server-json-store',
        supabaseConfigured,
        supabaseConnected: sbHealth.connected,
        supabaseTablesReady: sbHealth.tablesReady,
        description: sbHealth.configured
          ? sbHealth.message
          : process.env.VERCEL
          ? 'Fonction Serverless Vercel active (ajoutez SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY pour la persistance PostgreSQL).'
          : 'Persistance locale active (.data/aura-store.json). Prêt pour Supabase PostgreSQL.',
      },
      usage: dataStore.getUsage(user?.id),
    });
  });

  // --- API: User & Authentication (Supabase Auth + fallback) ---
  app.post('/api/auth/supabase-session', async (req, res) => {
    const { accessToken, user: clientProfile } = req.body || {};
    if (!accessToken) {
      res.status(400).json({ error: 'Jeton de session Supabase requis.' });
      return;
    }

    let profile = await verifySupabaseAccessToken(accessToken);
    if (!profile && clientProfile && clientProfile.email) {
      profile = clientProfile;
    }

    if (!profile) {
      res.status(401).json({ error: 'Session Supabase invalide ou expirée.' });
      return;
    }

    const synced = dataStore.upsertSupabaseAuthUser(profile, accessToken);
    res.json({
      user: synced.user,
      token: synced.token,
      message: 'Session Supabase synchronisée.',
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ user: null, error: 'Non authentifié.' });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({
        error: 'Veuillez renseigner votre adresse e-mail et votre mot de passe.',
      });
      return;
    }

    const sbClient = getSupabaseServerClient();
    if (sbClient) {
      try {
        const { data: sbData, error: sbError } =
          await sbClient.auth.signInWithPassword({
            email: String(email),
            password: String(password),
          });

        if (!sbError && sbData?.user && sbData.session) {
          const profile = await verifySupabaseAccessToken(
            sbData.session.access_token
          );
          if (profile) {
            const synced = dataStore.upsertSupabaseAuthUser(
              profile,
              sbData.session.access_token,
              String(password)
            );
            res.json({
              user: synced.user,
              token: sbData.session.access_token,
              message: 'Connexion réussie via Supabase Auth.',
            });
            return;
          }
        } else if (sbError && sbError.message.includes('Email not confirmed')) {
          try {
            const { data: usersData } = await sbClient.auth.admin.listUsers();
            const u = usersData?.users?.find(
              (x) => x.email?.toLowerCase() === String(email).trim().toLowerCase()
            );
            if (u) {
              await sbClient.auth.admin.updateUserById(u.id, { email_confirm: true });
              const retry = await sbClient.auth.signInWithPassword({
                email: String(email),
                password: String(password),
              });
              if (!retry.error && retry.data?.user && retry.data.session) {
                const profile = await verifySupabaseAccessToken(
                  retry.data.session.access_token
                );
                if (profile) {
                  const synced = dataStore.upsertSupabaseAuthUser(
                    profile,
                    retry.data.session.access_token,
                    String(password)
                  );
                  res.json({
                    user: synced.user,
                    token: retry.data.session.access_token,
                    message: 'Connexion réussie via Supabase Auth.',
                  });
                  return;
                }
              }
            }
          } catch {
            // continue to local fallback
          }
        }
      } catch {
        // Fallback to local store if Supabase Auth is unreachable
      }
    }

    const authResult = dataStore.authenticateUser(String(email), String(password));
    if (!authResult) {
      res.status(401).json({
        error:
          'Identifiants incorrects ou compte inexistant. Veuillez vérifier vos informations ou créer un compte.',
      });
      return;
    }
    res.json({
      user: authResult.user,
      token: authResult.token,
      message: 'Connexion réussie.',
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, termsConsent, marketingConsent } = req.body || {};
    if (
      !name ||
      !String(name).trim() ||
      !email ||
      !String(email).includes('@') ||
      !password ||
      String(password).length < 8
    ) {
      res.status(400).json({
        error:
          'Veuillez renseigner votre nom, une adresse e-mail valide et un mot de passe d’au moins 8 caractères.',
      });
      return;
    }

    if (termsConsent === false) {
      res.status(400).json({
        error:
          'Vous devez accepter les conditions d’utilisation et la politique de confidentialité pour créer un compte Aura.',
      });
      return;
    }

    const consentRecord = {
      termsVersion: '2026-v1.0',
      privacyVersion: '2026-v1.0',
      consentedAt: new Date().toISOString(),
      marketingConsent: Boolean(marketingConsent),
    };

    const sbClient = getSupabaseServerClient();
    if (sbClient) {
      try {
        const { data: sbData, error: sbError } = await sbClient.auth.signUp({
          email: String(email),
          password: String(password),
          options: {
            data: {
              name: String(name).trim(),
              full_name: String(name).trim(),
              role: 'Membre Aura',
              plan: 'free',
              onboardingCompleted: false,
              consents: consentRecord,
            },
          },
        });

        if (!sbError && sbData?.user) {
          let accessToken = sbData.session?.access_token;
          if (!accessToken) {
            try {
              await sbClient.auth.admin.updateUserById(sbData.user.id, {
                email_confirm: true,
              });
              const loginResult = await sbClient.auth.signInWithPassword({
                email: String(email),
                password: String(password),
              });
              if (loginResult.data?.session?.access_token) {
                accessToken = loginResult.data.session.access_token;
              }
            } catch {
              // ignore admin confirm
            }
          }

          const dummyProfile: UserProfile = {
            id: sbData.user.id,
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
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

          const token =
            accessToken ||
            dataStore.createSession(dummyProfile);

          const synced = dataStore.upsertSupabaseAuthUser(
            dummyProfile,
            accessToken,
            String(password)
          );

          res.status(201).json({
            user: synced.user,
            token,
            requiresEmailConfirmation: false,
            message: 'Compte Aura créé avec succès.',
          });
          return;
        } else if (sbError) {
          // If Supabase gave an explicit error like user already registered
          if (
            sbError.message.includes('already registered') ||
            sbError.message.includes('User already exists')
          ) {
            res.status(409).json({
              error:
                'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.',
            });
            return;
          }
        }
      } catch {
        // Fallback to local store
      }
    }

    try {
      const result = dataStore.registerUser(
        String(name),
        String(email),
        String(password),
        consentRecord
      );
      res.status(201).json({
        user: result.user,
        token: result.token,
        message: 'Compte Aura créé avec succès.',
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          error:
            'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.',
        });
        return;
      }
      res.status(500).json({
        error: 'Erreur lors de la création du compte.',
      });
    }
  });

  app.post('/api/auth/oauth', (req, res) => {
    const { provider, email, name } = req.body || {};
    if (
      (provider !== 'google' && provider !== 'github') ||
      !email ||
      !String(email).includes('@') ||
      !name ||
      !String(name).trim()
    ) {
      res.status(400).json({
        error: 'Informations du compte OAuth requises (nom et adresse e-mail).',
      });
      return;
    }

    const result = dataStore.authenticateOAuthUser({
      provider,
      email: String(email),
      name: String(name),
    });

    res.json({
      user: result.user,
      token: result.token,
      isNewUser: result.isNewUser,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    dataStore.revokeSession(token);
    res.json({ success: true });
  });

  app.post('/api/auth/onboarding', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Session expirée ou non authentifiée.' });
      return;
    }
    const { goals, experienceLevel, language, country } = req.body || {};
    const updated = dataStore.completeOnboarding(user.id, {
      completed: true,
      goals: Array.isArray(goals) ? goals : [],
      experienceLevel: String(experienceLevel || 'debutant'),
      language: String(language || 'Français'),
      country: String(country || ''),
    });
    if (!updated) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    const refreshedToken = dataStore.createSession(updated);
    res.json({ user: updated, token: refreshedToken });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body || {};
    if (!email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Veuillez entrer une adresse e-mail valide.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const sbClient = getSupabaseServerClient();
    if (sbClient) {
      try {
        await sbClient.auth.resetPasswordForEmail(cleanEmail);
      } catch {
        // ignore error to prevent email enumeration
      }
    }

    res.json({
      success: true,
      message: `Si un compte est associé à ${cleanEmail}, les instructions de réinitialisation ont été envoyées.`,
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const updated = dataStore.updateUserProfile(user.id, req.body || {});
    const refreshedToken = updated ? dataStore.createSession(updated) : undefined;
    res.json({ user: updated, token: refreshedToken });
  });

  // --- API: Privacy, Data Export & Account Deletion ---
  app.get('/api/user/export', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const exportData = dataStore.exportUserData(user.id);
    if (!exportData) {
      res.status(404).json({ error: 'Données utilisateur introuvables.' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aura-export-${user.id}-${Date.now()}.json"`
    );
    res.json(exportData);
  });

  app.delete('/api/user/history', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const result = dataStore.clearUserHistory(user.id);
    res.json({
      success: true,
      message: `${result.clearedCount} conversation(s) supprimée(s) avec succès.`,
      clearedCount: result.clearedCount,
    });
  });

  app.delete('/api/user/account', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { confirmEmail } = req.body || {};
    if (
      !confirmEmail ||
      String(confirmEmail).trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      res.status(400).json({
        error:
          'Veuillez renseigner exactement votre adresse e-mail pour confirmer la suppression irréversible de votre compte.',
      });
      return;
    }

    const success = dataStore.deleteUserAccount(user.id);
    if (!success) {
      res.status(500).json({ error: 'Impossible de supprimer le compte.' });
      return;
    }
    res.json({
      success: true,
      message:
        'Votre compte Aura, vos conversations et l’ensemble de vos données ont été définitivement supprimés.',
    });
  });

  app.put('/api/user/custom-instructions', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { customInstructions } = req.body || {};
    const updated = dataStore.updateUserProfile(user.id, {
      preferences: {
        ...user.preferences,
        customInstructions:
          typeof customInstructions === 'string' ? customInstructions.trim() : '',
      },
    });
    res.json({ success: true, user: updated });
  });

  // --- API: Conversations (Strictly per user) ---
  app.get('/api/conversations', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.', conversations: [] });
      return;
    }
    res.json({ conversations: dataStore.getConversations(user.id) });
  });

  app.get('/api/conversations/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const conv = dataStore.getConversationById(user.id, req.params.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation introuvable.' });
      return;
    }
    res.json({ conversation: conv });
  });

  app.put('/api/conversations/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const updated = dataStore.updateConversation(
      user.id,
      req.params.id,
      req.body || {}
    );
    if (!updated) {
      res.status(404).json({ error: 'Conversation introuvable.' });
      return;
    }
    res.json({ conversation: updated });
  });

  app.delete('/api/conversations/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const deleted = dataStore.deleteConversation(user.id, req.params.id);
    res.json({ deleted });
  });

  // --- API: Chat / AI Multi-Provider Completion (Strictly per user) ---
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({
        error: 'Veuillez vous connecter pour utiliser Aura.',
      });
      return;
    }

    const parseResult = SendMessagePayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Données de requête invalides.',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const payload = parseResult.data;

    // 1. Classify operation category and check quotas with two-phase reservation
    const category = classifyUsageCategory({
      mode: payload.mode,
      hasActiveCode: Boolean(payload.activeArtifactContext?.code),
    });

    const clientOpId =
      (req.headers['x-client-request-id'] as string) ||
      (req.headers['x-operation-id'] as string) ||
      `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const reservation = dataStore.reserveUsage(user.id, {
      operationId: clientOpId,
      category,
      modelId: payload.modelId || 'aura-3.8-flash',
      providerId: payload.providerId || 'gemini',
    });

    if (!reservation.allowed) {
      res.status(429).json({
        error:
          reservation.reason ||
          `Quota mensuel atteint. Consultez vos quotas dans Paramètres > Utilisation & Limites.`,
        code: reservation.code || 'QUOTA_EXCEEDED',
        usage: dataStore.getUsage(user.id),
        renewalDate: reservation.renewalDate,
      });
      return;
    }

    try {
      const adapter = aiRegistry.getAdapter(payload.providerId, payload.modelId);
      const existingConv = payload.conversationId
        ? dataStore.getConversationById(user.id, payload.conversationId)
        : undefined;

      const projectId = payload.projectId || existingConv?.projectId;
      const project = projectId
        ? dataStore.getProjects(user.id).find((p) => p.id === projectId)
        : undefined;

      const history = (existingConv?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Save Attachment items to User's Library if any
      if (payload.attachments && payload.attachments.length > 0) {
        for (const att of payload.attachments) {
          dataStore.addLibraryItem(user.id, {
            type: 'file',
            title: att.name,
            excerpt:
              att.contentPreview?.slice(0, 140) ||
              `Pièce jointe (${att.type.toUpperCase()} · ${Math.round(att.size / 1024)} Ko)`,
            mode: payload.mode,
            conversationId: existingConv?.id,
            fileMeta: {
              mimeType: att.mimeType,
              size: att.size,
              dataUrl: att.dataUrl,
            },
            tags: [payload.mode.toUpperCase(), att.type],
          });
        }
      }

      const aiResponse = await adapter.generateCompletion({
        mode: payload.mode,
        prompt: payload.message,
        history,
        modelId: payload.modelId,
        language: user.preferences?.language || 'fr',
        systemContext: [
          project?.systemContext,
          user.preferences.customInstructions
            ? `Directives personnalisées de l'utilisateur :\n${user.preferences.customInstructions}`
            : undefined,
        ]
          .filter(Boolean)
          .join('\n\n') || undefined,
        mediaOptions: payload.mediaOptions,
        activeArtifactContext: payload.activeArtifactContext,
      });

      const now = new Date().toISOString();
      const convId =
        existingConv?.id ||
        payload.conversationId ||
        `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const userMsg: ChatMessage = {
        id: `msg-u-${Date.now()}`,
        conversationId: convId,
        role: 'user',
        content: payload.message,
        mode: payload.mode,
        createdAt: now,
        attachments: payload.attachments,
      };

      const assistantMsg: ChatMessage = {
        id: `msg-a-${Date.now() + 1}`,
        conversationId: convId,
        role: 'assistant',
        content: aiResponse.text,
        mode: payload.mode,
        createdAt: new Date(Date.now() + 10).toISOString(),
        modelId: aiResponse.modelId,
        providerId: aiResponse.providerId,
        estimatedTokens:
          aiResponse.estimatedInputTokens + aiResponse.estimatedOutputTokens,
        sources: aiResponse.sources,
        codeArtifact: aiResponse.codeArtifact,
        creativeArtifact: aiResponse.creativeArtifact,
        imageArtifact: aiResponse.imageArtifact,
        videoArtifact: aiResponse.videoArtifact,
        slideArtifact: aiResponse.slideArtifact,
        isUncertainNote: aiResponse.isUncertainNote,
      };

      const autoTitle =
        payload.message.length > 52
          ? `${payload.message.slice(0, 52)}...`
          : payload.message;

      if (!existingConv) {
        dataStore.createConversation(user.id, {
          id: convId,
          title: autoTitle,
          mode: payload.mode,
          projectId,
        });
      }

      const updatedConversation = dataStore.appendMessages(
        user.id,
        convId,
        [userMsg, assistantMsg],
        autoTitle
      );

      // Commit usage deduction in audit ledger and unlock concurrency
      const updatedUsage = reservation.reservationId
        ? dataStore.commitUsage(reservation.reservationId, {
            inputTokens: aiResponse.estimatedInputTokens,
            outputTokens: aiResponse.estimatedOutputTokens,
            mode: payload.mode,
          })
        : dataStore.getUsage(user.id);

      res.json({
        conversation: updatedConversation,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        usage: updatedUsage,
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la communication avec le fournisseur IA.';

      // Release reserved units on failure so user is never charged unfairly!
      if (reservation.reservationId) {
        dataStore.releaseUsage(reservation.reservationId, errMessage);
      }

      const isNotConfigured = errMessage.includes('PROVIDER_NOT_CONFIGURED');
      res.status(isNotConfigured ? 503 : 500).json({
        error: errMessage.replace('PROVIDER_NOT_CONFIGURED: ', ''),
        code: isNotConfigured ? 'PROVIDER_NOT_CONFIGURED' : 'AI_PROVIDER_ERROR',
        usage: dataStore.getUsage(user.id),
      });
    }
  });

  // --- API: Billing, Plans & Freemium Architecture ---
  app.get('/api/billing/plans', (_req, res) => {
    const gateway = paymentGatewayService.getGatewayStatus();
    res.json({
      plans: Object.values(AURA_PLANS),
      gateway,
    });
  });

  app.get('/api/billing/subscription', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const subscription = dataStore.getUserSubscription(user.id);
    const plan = dataStore.getUserPlan(user.id);
    const gateway = paymentGatewayService.getGatewayStatus();
    res.json({
      subscription,
      plan,
      gateway,
    });
  });

  app.post('/api/billing/subscription', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { planId, reason } = req.body || {};
    if (!planId || !['free', 'plus', 'pro'].includes(planId)) {
      res.status(400).json({ error: 'Identifiant d’offre invalide.' });
      return;
    }

    const gateway = paymentGatewayService.getGatewayStatus();

    // If upgrading to Plus or Pro while real payment is not configured:
    // Transparently register user interest/waitlist without pretending a fake payment occurred!
    if ((planId === 'plus' || planId === 'pro') && !gateway.isConfigured) {
      res.status(200).json({
        success: true,
        isWaitlist: true,
        message:
          'Votre intérêt pour Aura Plus a bien été enregistré. Vous serez notifié dès l’ouverture officielle de la facturation avec vos moyens de paiement locaux (Mobile Money / Carte).',
        subscription: dataStore.getUserSubscription(user.id),
        plan: dataStore.getUserPlan(user.id),
      });
      return;
    }

    const updated = dataStore.updateUserSubscription(user.id, {
      planId: planId as PlanId,
    });
    res.json({
      success: true,
      subscription: updated,
      plan: dataStore.getUserPlan(user.id),
      usage: dataStore.getUsage(user.id),
    });
  });

  app.get('/api/usage/ledger', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const usage = dataStore.getUsage(user.id);
    res.json({
      ledger: usage.recentLedger || [],
      plan: dataStore.getUserPlan(user.id),
      subscription: dataStore.getUserSubscription(user.id),
    });
  });

  app.post('/api/waitlist', (req, res) => {
    const { email, planId, note } = req.body || {};
    if (!email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Adresse e-mail valide requise.' });
      return;
    }
    const record = dataStore.addContactMessage({
      kind: 'waitlist',
      email: String(email),
      message: String(note || 'Inscription liste d’attente Aura.'),
      planId: planId ? String(planId) : undefined,
    });
    res.json({
      success: true,
      message: 'Votre intérêt a bien été enregistré. Vous serez notifié prioritairement lors de l’ouverture officielle.',
      email: record.email,
      planId: record.planId || 'plus',
      registeredAt: record.createdAt,
    });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!email || !String(email).includes('@') || !message || String(message).trim().length < 10) {
      res.status(400).json({
        error: 'Une adresse e-mail valide et un message d’au moins 10 caractères sont requis.',
      });
      return;
    }
    const record = dataStore.addContactMessage({
      kind: 'contact',
      name: name ? String(name) : undefined,
      email: String(email),
      subject: subject ? String(subject) : undefined,
      message: String(message),
    });
    res.json({
      success: true,
      message: 'Votre message a bien été enregistré. L’équipe Aura le traitera prochainement.',
      receivedAt: record.createdAt,
    });
  });

  app.post('/api/billing/webhook', (req, res) => {
    const signature =
      (req.headers['x-fedapay-signature'] as string) ||
      (req.headers['stripe-signature'] as string) ||
      (req.headers['x-kkiapay-signature'] as string);

    const gateway = paymentGatewayService.getGatewayStatus();
    if (!gateway.isConfigured) {
      res.status(400).json({
        error: 'Passerelle non configurée. Webhook ignoré.',
      });
      return;
    }

    const isValid = paymentGatewayService.verifyWebhookSignature({
      provider: gateway.provider,
      rawBody: JSON.stringify(req.body),
      signatureHeader: signature,
      signingSecret:
        process.env.FEDAPAY_WEBHOOK_SECRET ||
        process.env.STRIPE_WEBHOOK_SECRET ||
        process.env.KKIAPAY_SECRET_KEY,
    });

    if (!isValid) {
      res.status(401).json({ error: 'Signature de webhook invalide.' });
      return;
    }

    // Process event idempotently
    res.json({ received: true });
  });

  // --- API: Veo 3.1 Video Operation Polling & Secure Download ---
  app.post('/api/ai/video-status', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { operationName } = req.body || {};
    if (!operationName || !process.env.GEMINI_API_KEY) {
      res.json({ done: false });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const op = new GenerateVideosOperation();
      op.name = String(operationName);
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: Boolean(updated.done) });
    } catch {
      res.json({ done: false });
    }
  });

  app.post('/api/ai/video-download', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { operationName } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!operationName || !apiKey) {
      res.status(400).json({ error: 'Opération vidéo introuvable.' });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const op = new GenerateVideosOperation();
      op.name = String(operationName);
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        res.status(404).json({ error: 'Flux vidéo non disponible.' });
        return;
      }
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });
      res.setHeader('Content-Type', 'video/mp4');
      const arrayBuf = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuf));
    } catch {
      res.status(500).json({ error: 'Erreur lors du téléchargement de la vidéo.' });
    }
  });

  // --- API: Library (Strictly per user) ---
  app.get('/api/library', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.', items: [] });
      return;
    }
    res.json({ items: dataStore.getLibrary(user.id) });
  });

  app.post('/api/library', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { type, title, excerpt, mode, conversationId, messageId, tags } =
      req.body || {};
    if (!title || !excerpt) {
      res.status(400).json({ error: 'Titre et extrait requis.' });
      return;
    }
    const item = dataStore.addLibraryItem(user.id, {
      type: type || 'saved_response',
      title,
      excerpt,
      mode: mode || 'chat',
      conversationId,
      messageId,
      tags: Array.isArray(tags) ? tags : ['Aura'],
    });
    res.json({ item });
  });

  app.delete('/api/library/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const deleted = dataStore.deleteLibraryItem(user.id, req.params.id);
    res.json({ deleted });
  });

  // --- API: Projects (Strictly per user) ---
  app.get('/api/projects', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.', projects: [] });
      return;
    }
    res.json({ projects: dataStore.getProjects(user.id) });
  });

  app.post('/api/projects', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { name, description, category, color, icon, systemContext } =
      req.body || {};
    if (!name) {
      res.status(400).json({ error: 'Le nom du projet est requis.' });
      return;
    }
    const project = dataStore.createProject(user.id, {
      name,
      description: description || 'Espace de travail thématique Aura.',
      category: category || 'general',
      color: color || '#078348',
      icon: icon || 'fa-solid fa-folder-open',
      systemContext,
    });
    res.json({ project });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const deleted = dataStore.deleteProject(user.id, req.params.id);
    res.json({ deleted });
  });

  // --- API: Missions (Strictly per user) ---
  app.get('/api/missions', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.', missions: [] });
      return;
    }
    res.json({ missions: dataStore.getMissions(user.id) });
  });

  app.post('/api/missions', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { title, category, description, mode, steps, prompt } = req.body || {};
    if (!title || !description) {
      res.status(400).json({ error: 'Titre et objectif requis.' });
      return;
    }
    const mission = dataStore.createMission(user.id, {
      title: String(title).trim(),
      category: category || 'Mission Aura',
      status: 'in_progress',
      statusLabel: 'En cours',
      progress: 33,
      description: String(description).trim(),
      mode: mode || 'create',
      steps: Array.isArray(steps)
        ? steps
        : [
            { label: 'Cadrage de l’objectif & plan d’action', done: true },
            { label: 'Exécution assistée par Aura', done: false },
            { label: 'Livrable final & validation', done: false },
          ],
      prompt: String(prompt || description).trim(),
    });
    res.status(201).json({ mission });
  });

  app.delete('/api/missions/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const deleted = dataStore.deleteMission(user.id, req.params.id);
    res.json({ deleted });
  });

  // --- API: Usage & Quotas (Strictly per user) ---
  app.get('/api/usage', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    res.json({ usage: dataStore.getUsage(user.id) });
  });

  app.post('/api/usage/reset', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const { dailyLimit } = req.body || {};
    const usage = dataStore.resetDailyQuota(
      user.id,
      dailyLimit ? Number(dailyLimit) : undefined
    );
    res.json({ usage });
  });

  // --- API: Aura Studio (Projets de création persistés, versions, export) ---
  app.get('/api/studio/projects', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const plan = dataStore.getUserPlan(user.id);
    res.json({
      projects: dataStore.getStudioProjectSummaries(user.id),
      storage: {
        used: dataStore.countStudioProjects(user.id),
        limit: plan.limits.maxProjects,
        planId: plan.id,
      },
    });
  });

  app.post('/api/studio/projects', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Veuillez vous connecter pour créer avec Aura Studio.' });
      return;
    }

    const parseResult = StudioCreateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Données de création invalides.',
        details: parseResult.error.flatten(),
      });
      return;
    }
    const payload = parseResult.data;

    // Contrôle de stockage côté serveur (jamais de confiance au frontend)
    const plan = dataStore.getUserPlan(user.id);
    if (dataStore.countStudioProjects(user.id) >= plan.limits.maxProjects) {
      res.status(429).json({
        error: `Limite de projets Studio atteinte (${plan.limits.maxProjects} sur l'offre ${plan.name}). Supprimez un projet ou passez à une offre supérieure.`,
        code: 'STORAGE_LIMIT',
      });
      return;
    }

    const clientOpId =
      (req.headers['x-client-request-id'] as string) ||
      `studio-create-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const reservation = dataStore.reserveUsage(user.id, {
      operationId: clientOpId,
      category: 'studio_creation',
      modelId: payload.modelId || 'aura-studio-architect',
      providerId: payload.providerId || 'gemini',
    });

    if (!reservation.allowed) {
      res.status(429).json({
        error: reservation.reason || 'Quota mensuel de créations atteint.',
        code: reservation.code || 'QUOTA_EXCEEDED',
        usage: dataStore.getUsage(user.id),
        renewalDate: reservation.renewalDate,
      });
      return;
    }

    const projectName =
      (payload.name || '').trim() ||
      (payload.idea.length > 48 ? `${payload.idea.slice(0, 48)}…` : payload.idea);

    // Création d'un VRAI projet et d'une VRAIE exécution de génération, avant l'appel IA
    const project = dataStore.createStudioProject(user.id, {
      name: projectName,
      description: payload.idea.slice(0, 600),
      type: payload.type || 'site-web',
      status: 'generating',
    });

    const run = dataStore.startStudioGenerationRun(user.id, project.id, {
      kind: 'creation',
      prompt: payload.idea,
      modelId: payload.modelId || 'aura-studio-architect',
      providerId: payload.providerId || 'gemini',
    });

    try {
      const adapter = aiRegistry.getAdapter(payload.providerId, payload.modelId);
      const prompt = buildStudioCreationPrompt({
        idea: payload.idea,
        name: projectName,
        type: payload.type,
        sections: payload.sections,
        styleNotes: payload.styleNotes,
        language: user.preferences?.language || 'fr',
      });

      const aiResponse = await adapter.generateCompletion({
        mode: 'code',
        prompt,
        history: [],
        modelId: payload.modelId || 'aura-studio-architect',
        language: user.preferences?.language || 'fr',
      });

      let files = extractStudioFiles(aiResponse.text);
      if (files.length === 0 && aiResponse.codeArtifact?.files?.length) {
        files = aiResponse.codeArtifact.files;
      }
      files = ensureIndexHtml(files);
      const validation = validateStudioProject(files);
      if (!validation.ok) {
        throw new Error(`Résultat de génération invalide : ${validation.error}`);
      }

      const saved = dataStore.saveStudioProjectFiles(user.id, project.id, files, {
        label: 'Génération initiale',
        origin: 'generation',
        generationRunId: run?.id,
        status: 'ready',
        lastBuildStatus: 'ok',
      });
      if (!saved) {
        throw new Error('Impossible de persister les fichiers générés.');
      }

      dataStore.finishStudioGenerationRun(user.id, project.id, run!.id, {
        status: 'succeeded',
        versionId: saved.version.id,
        modelId: aiResponse.modelId,
        providerId: aiResponse.providerId,
      });

      const updatedUsage = reservation.reservationId
        ? dataStore.commitUsage(reservation.reservationId, {
            inputTokens: aiResponse.estimatedInputTokens,
            outputTokens: aiResponse.estimatedOutputTokens,
            mode: 'code',
          })
        : dataStore.getUsage(user.id);

      res.json({
        project: dataStore.getStudioProject(user.id, project.id),
        usage: updatedUsage,
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inattendue pendant la génération.';

      if (reservation.reservationId) {
        dataStore.releaseUsage(reservation.reservationId, errMessage);
      }
      if (run) {
        dataStore.finishStudioGenerationRun(user.id, project.id, run.id, {
          status: 'failed',
          error: errMessage,
        });
      }
      dataStore.updateStudioProject(user.id, project.id, {
        status: 'failed',
        lastBuildStatus: 'unknown',
        lastBuildError: errMessage,
      });

      const isNotConfigured = errMessage.includes('PROVIDER_NOT_CONFIGURED');
      res.status(isNotConfigured ? 503 : 500).json({
        error: errMessage.replace('PROVIDER_NOT_CONFIGURED: ', ''),
        code: isNotConfigured ? 'PROVIDER_NOT_CONFIGURED' : 'AI_PROVIDER_ERROR',
        projectId: project.id,
        usage: dataStore.getUsage(user.id),
      });
    }
  });

  app.get('/api/studio/projects/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const project = dataStore.getStudioProject(user.id, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    res.json({
      project,
      previewHtml: composePreviewHtml(project.files),
    });
  });

  app.patch('/api/studio/projects/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const parseResult = StudioProjectPatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Mise à jour invalide.', details: parseResult.error.flatten() });
      return;
    }
    const updated = dataStore.updateStudioProject(user.id, req.params.id, parseResult.data);
    if (!updated) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    res.json({ project: updated });
  });

  app.delete('/api/studio/projects/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const deleted = dataStore.deleteStudioProject(user.id, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    res.json({ deleted: true });
  });

  app.post('/api/studio/projects/:id/duplicate', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const plan = dataStore.getUserPlan(user.id);
    if (dataStore.countStudioProjects(user.id) >= plan.limits.maxProjects) {
      res.status(429).json({
        error: `Limite de projets Studio atteinte (${plan.limits.maxProjects} sur l'offre ${plan.name}).`,
        code: 'STORAGE_LIMIT',
      });
      return;
    }
    const copy = dataStore.duplicateStudioProject(user.id, req.params.id);
    if (!copy) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    res.json({ project: copy });
  });

  app.put('/api/studio/projects/:id/files', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const parseResult = StudioSaveFilesRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Fichiers invalides.', details: parseResult.error.flatten() });
      return;
    }
    const files = parseResult.data.files.map(
      (f): VirtualStudioFile => ({
        path: f.path,
        language: f.language || f.path.split('.').pop() || 'text',
        content: f.content,
      })
    );
    const validation = validateStudioProject(files);
    const saved = dataStore.saveStudioProjectFiles(user.id, req.params.id, files, {
      label: parseResult.data.label,
      origin: 'manual',
      status: 'ready',
      lastBuildStatus: validation.ok ? 'ok' : 'failed',
      lastBuildError: validation.error,
    });
    if (!saved) {
      res.status(404).json({ error: 'Projet Studio introuvable ou fichiers invalides.' });
      return;
    }
    res.json({
      project: saved.project,
      version: saved.version,
      build: validation,
    });
  });

  app.post('/api/studio/projects/:id/iterate', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const parseResult = StudioIterateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Instruction invalide.', details: parseResult.error.flatten() });
      return;
    }
    const project = dataStore.getStudioProject(user.id, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    if (project.files.length === 0) {
      res.status(400).json({
        error: 'Ce projet ne contient aucun fichier à modifier. Relancez une génération.',
      });
      return;
    }

    const clientOpId =
      (req.headers['x-client-request-id'] as string) ||
      `studio-iter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const reservation = dataStore.reserveUsage(user.id, {
      operationId: clientOpId,
      category: 'studio_modification',
      modelId: parseResult.data.modelId || 'aura-studio-architect',
      providerId: parseResult.data.providerId || 'gemini',
    });

    if (!reservation.allowed) {
      res.status(429).json({
        error: reservation.reason || 'Quota mensuel de modifications atteint.',
        code: reservation.code || 'QUOTA_EXCEEDED',
        usage: dataStore.getUsage(user.id),
        renewalDate: reservation.renewalDate,
      });
      return;
    }

    const run = dataStore.startStudioGenerationRun(user.id, project.id, {
      kind: 'modification',
      prompt: parseResult.data.instruction,
      modelId: parseResult.data.modelId || 'aura-studio-architect',
      providerId: parseResult.data.providerId || 'gemini',
    });

    try {
      const adapter = aiRegistry.getAdapter(
        parseResult.data.providerId,
        parseResult.data.modelId
      );
      const prompt = buildStudioIterationPrompt({
        instruction: parseResult.data.instruction,
        files: project.files,
        language: user.preferences?.language || 'fr',
      });

      const aiResponse = await adapter.generateCompletion({
        mode: 'code',
        prompt,
        history: [],
        modelId: parseResult.data.modelId || 'aura-studio-architect',
        language: user.preferences?.language || 'fr',
      });

      let changedFiles = extractStudioFiles(aiResponse.text);
      if (changedFiles.length === 0 && aiResponse.codeArtifact?.files?.length) {
        changedFiles = aiResponse.codeArtifact.files;
      }
      if (changedFiles.length === 0) {
        throw new Error('Aucun fichier modifié n’a été retourné par le modèle.');
      }

      // Fusion ciblée : seuls les fichiers renvoyés sont remplacés, le reste est préservé
      const merged = new Map(project.files.map((f) => [f.path.toLowerCase(), f]));
      for (const f of changedFiles) {
        merged.set(f.path.toLowerCase(), f);
      }
      const files = ensureIndexHtml([...merged.values()]);

      const validation = validateStudioProject(files);
      const saved = dataStore.saveStudioProjectFiles(user.id, project.id, files, {
        label: parseResult.data.instruction.slice(0, 140),
        origin: 'iteration',
        generationRunId: run?.id,
        status: 'ready',
        lastBuildStatus: validation.ok ? 'ok' : 'failed',
        lastBuildError: validation.error,
      });
      if (!saved) {
        throw new Error('Impossible de persister les fichiers modifiés.');
      }

      dataStore.finishStudioGenerationRun(user.id, project.id, run!.id, {
        status: 'succeeded',
        versionId: saved.version.id,
        modelId: aiResponse.modelId,
        providerId: aiResponse.providerId,
      });

      const updatedUsage = reservation.reservationId
        ? dataStore.commitUsage(reservation.reservationId, {
            inputTokens: aiResponse.estimatedInputTokens,
            outputTokens: aiResponse.estimatedOutputTokens,
            mode: 'code',
          })
        : dataStore.getUsage(user.id);

      res.json({
        project: saved.project,
        version: saved.version,
        previewHtml: composePreviewHtml(saved.project.files),
        build: validation,
        usage: updatedUsage,
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Erreur pendant la modification.';
      if (reservation.reservationId) {
        dataStore.releaseUsage(reservation.reservationId, errMessage);
      }
      if (run) {
        dataStore.finishStudioGenerationRun(user.id, project.id, run.id, {
          status: 'failed',
          error: errMessage,
        });
      }
      const isNotConfigured = errMessage.includes('PROVIDER_NOT_CONFIGURED');
      res.status(isNotConfigured ? 503 : 500).json({
        error: errMessage.replace('PROVIDER_NOT_CONFIGURED: ', ''),
        code: isNotConfigured ? 'PROVIDER_NOT_CONFIGURED' : 'AI_PROVIDER_ERROR',
        usage: dataStore.getUsage(user.id),
      });
    }
  });

  app.post('/api/studio/projects/:id/versions/:versionId/restore', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const restored = dataStore.restoreStudioProjectVersion(
      user.id,
      req.params.id,
      req.params.versionId
    );
    if (!restored) {
      res.status(404).json({ error: 'Projet ou version introuvable.' });
      return;
    }
    res.json({
      project: restored.project,
      version: restored.version,
      previewHtml: composePreviewHtml(restored.project.files),
    });
  });

  app.get('/api/studio/projects/:id/preview', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const project = dataStore.getStudioProject(user.id, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    res.json({ previewHtml: composePreviewHtml(project.files) });
  });

  app.post('/api/studio/projects/:id/build', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const project = dataStore.getStudioProject(user.id, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    // Compilation honnête d'un projet statique : validation structurelle réelle
    const validation = validateStudioProject(project.files);
    const updated = dataStore.updateStudioProject(user.id, project.id, {
      lastBuildStatus: validation.ok ? 'ok' : 'failed',
      lastBuildError: validation.error,
    });
    res.json({ build: validation, project: updated });
  });

  app.get('/api/studio/projects/:id/export', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const project = dataStore.getStudioProject(user.id, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Projet Studio introuvable.' });
      return;
    }
    if (project.files.length === 0) {
      res.status(400).json({ error: 'Ce projet ne contient aucun fichier à exporter.' });
      return;
    }
    const zip = createProjectZip(project.files);
    const safeName =
      (project.name || 'projet-aura')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'projet-aura';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.zip"`
    );
    res.send(zip);
  });

  return app;
}

export const apiApp = createApiApp();
