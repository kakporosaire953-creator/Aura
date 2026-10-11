import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { aiRegistry } from './src/server/ai/externalAdapters.ts';
import { dataStore } from './src/server/dataStore.ts';
import { SendMessagePayloadSchema, ChatMessage, UserProfile } from './src/shared/types.ts';

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- API: System & Multi-Provider Status ---
  app.get('/api/status', (req, res) => {
    const user = getAuthenticatedUser(req);
    const providers = aiRegistry.getAllStatuses();
    const supabaseConfigured = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    );
    res.json({
      providers,
      persistence: {
        engine: supabaseConfigured ? 'supabase-postgres' : 'server-json-store',
        supabaseConfigured,
        description: supabaseConfigured
          ? 'Connecté à Supabase PostgreSQL & Auth'
          : 'Persistance serveur isolée par utilisateur (.data/aura-store.json).',
      },
      usage: dataStore.getUsage(user?.id),
    });
  });

  // --- API: User & Authentication ---
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ user: null, error: 'Non authentifié.' });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({
        error: 'Veuillez renseigner votre adresse e-mail et votre mot de passe.',
      });
      return;
    }
    const authResult = dataStore.authenticateUser(String(email), String(password));
    if (!authResult) {
      res.status(401).json({
        error: 'Identifiants incorrects ou compte inexistant. Veuillez vérifier vos informations ou créer un compte.',
      });
      return;
    }
    res.json({
      user: authResult.user,
      token: authResult.token,
      message: 'Connexion réussie.',
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body || {};
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

    try {
      const result = dataStore.registerUser(
        String(name),
        String(email),
        String(password)
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
    res.json({ user: updated });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body || {};
    if (!email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Veuillez entrer une adresse e-mail valide.' });
      return;
    }
    res.json({
      success: true,
      message: `Si un compte est associé à ${email}, les instructions de réinitialisation ont été envoyées.`,
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }
    const updated = dataStore.updateUserProfile(user.id, req.body || {});
    res.json({ user: updated });
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

    // 1. Server-side Quota Check per user
    const quotaCheck = dataStore.canMakeRequest(user.id);
    if (!quotaCheck.allowed) {
      dataStore.recordUsage(user.id, {
        mode: payload.mode,
        modelId: payload.modelId || 'gemini-3.8-flash',
        providerId: payload.providerId || 'gemini',
        inputTokens: 0,
        outputTokens: 0,
        status: 'quota_exceeded',
      });
      res.status(429).json({
        error: `Limite quotidienne atteinte (${quotaCheck.limit} requêtes/jour). Consultez l'espace Utilisation & Limites pour ajuster ou réinitialiser votre quota.`,
        code: 'QUOTA_EXCEEDED',
        usage: dataStore.getUsage(user.id),
      });
      return;
    }

    try {
      const adapter = aiRegistry.getAdapter(payload.providerId);
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
        language: payload.language || user.preferences.language || 'fr',
        systemContext: project?.systemContext,
        attachments: payload.attachments,
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

      const updatedUsage = dataStore.recordUsage(user.id, {
        mode: payload.mode,
        modelId: aiResponse.modelId,
        providerId: aiResponse.providerId,
        inputTokens: aiResponse.estimatedInputTokens,
        outputTokens: aiResponse.estimatedOutputTokens,
        status: 'success',
      });

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

      dataStore.recordUsage(user.id, {
        mode: payload.mode,
        modelId: payload.modelId || 'gemini-3.8-flash',
        providerId: payload.providerId || 'gemini',
        inputTokens: 0,
        outputTokens: 0,
        status: 'error',
      });

      const isNotConfigured = errMessage.includes('PROVIDER_NOT_CONFIGURED');
      res.status(isNotConfigured ? 503 : 500).json({
        error: errMessage.replace('PROVIDER_NOT_CONFIGURED: ', ''),
        code: isNotConfigured ? 'PROVIDER_NOT_CONFIGURED' : 'AI_PROVIDER_ERROR',
      });
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

  // --- Vite Middleware in Development / Static in Production ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
