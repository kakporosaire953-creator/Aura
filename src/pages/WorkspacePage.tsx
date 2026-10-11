import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { AuraLogo, AuraActivityState } from '../components/brand/AuraLogo';
import { AuraIntelligenceCore } from '../components/brand/AuraIntelligenceCore';
import { PromptComposer } from '../components/workspace/PromptComposer';
import { MessageList } from '../components/workspace/MessageList';
import { AuraStudioPanel, AuraStudioItem } from '../components/workspace/AuraStudioPanel';
import { useAura } from '../context/AuraContext';
import { AttachmentItem, AuraMode, ChatMessage } from '../shared/types';

function formatRelativeTime(isoDate: string, lang: 'fr' | 'en'): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return lang === 'en' ? 'Just now' : 'À l’instant';
  if (mins < 60) return lang === 'en' ? `${mins} min ago` : `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'en' ? `${hours}h ago` : `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return lang === 'en' ? `${days}d ago` : `Il y a ${days} j`;
}

export const WorkspacePage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    conversations,
    projects,
    missions,
    activeMode,
    setActiveMode,
    activeProjectId,
    language,
    sendMessage,
    isSending,
    isLoadingInitial,
    providers,
  } = useAura();

  const [promptInput, setPromptInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [userDismissedStudio, setUserDismissedStudio] = useState(false);
  const [studioItem, setStudioItem] = useState<AuraStudioItem | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const firstName = user.name?.trim().split(' ')[0] || '';

  useEffect(() => {
    setUserDismissedStudio(false);
    if (!conversationId) {
      setIsActivating(true);
      setStudioItem(null);
      const timer = setTimeout(() => setIsActivating(false), 1150);
      return () => clearTimeout(timer);
    }
  }, [conversationId, location.key]);

  useEffect(() => {
    const modeParam = searchParams.get('mode') as AuraMode | null;
    const promptParam = searchParams.get('prompt');
    const studioParam = searchParams.get('studio');
    if (modeParam && ['chat', 'search', 'code', 'create'].includes(modeParam)) {
      setActiveMode(modeParam);
    }
    if (promptParam) {
      setPromptInput(promptParam);
    }
    if (studioParam === '1' || location.pathname.startsWith('/app/studio')) {
      setStudioOpen(true);
      setUserDismissedStudio(false);
    } else if (!conversationId) {
      setStudioOpen(false);
    }
  }, [searchParams, setActiveMode, location.pathname, conversationId]);

  const activeConversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : undefined;

  useEffect(() => {
    if (activeConversation?.messages.length) {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages.length, isSending]);

  // Synchronize Aura Studio with the latest assistant deliverable in the active conversation
  useEffect(() => {
    if (!activeConversation || activeConversation.messages.length === 0) return;

    const assistantMessages = activeConversation.messages.filter(
      (m) => m.role === 'assistant'
    );
    if (assistantMessages.length === 0) return;

    const lastMsg = assistantMessages[assistantMessages.length - 1];
    const resolvedMode: AuraMode = lastMsg.codeArtifact
      ? 'code'
      : lastMsg.creativeArtifact
      ? 'create'
      : lastMsg.mode || activeConversation.mode;

    setStudioItem({
      messageId: lastMsg.id,
      conversationId: activeConversation.id,
      title: lastMsg.creativeArtifact?.title || activeConversation.title,
      mode: resolvedMode,
      codeArtifact: lastMsg.codeArtifact,
      creativeArtifact: lastMsg.creativeArtifact,
      rawContent: lastMsg.content,
      sources: lastMsg.sources,
      modelId: lastMsg.modelId,
      estimatedTokens: lastMsg.estimatedTokens,
      createdAt: lastMsg.createdAt,
    });

    // Automatically open Aura Studio in split-view on desktop unless manually closed by user
    if (!userDismissedStudio) {
      setStudioOpen(true);
    }
  }, [activeConversation, userDismissedStudio]);

  // Also open Aura Studio during live generation in code/create modes so user sees live progress
  useEffect(() => {
    if (isSending && (activeMode === 'code' || activeMode === 'create') && !userDismissedStudio) {
      setStudioOpen(true);
    }
  }, [isSending, activeMode, userDismissedStudio]);

  const logoActivityState: AuraActivityState = isSending
    ? 'generating'
    : isActivating
    ? 'activating'
    : 'idle';

  const handleOpenInStudio = (item: AuraStudioItem) => {
    setStudioItem(item);
    setUserDismissedStudio(false);
    setStudioOpen(true);
  };

  const handleCloseStudio = () => {
    setStudioOpen(false);
    setUserDismissedStudio(true);
  };

  const buildActiveArtifactContext = () => {
    if (!studioItem || !activeConversation) return undefined;
    return {
      title: studioItem.title,
      mode: studioItem.mode,
      filename: studioItem.codeArtifact?.filename,
      code: studioItem.codeArtifact?.code,
      content: studioItem.rawContent,
    };
  };

  const handleSend = async (attachments: AttachmentItem[]) => {
    const trimmed = promptInput.trim();
    if (!trimmed && attachments.length === 0) return;

    const currentText = trimmed || 'Analyse les pièces jointes fournies.';
    setPromptInput('');
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 1150);

    await sendMessage({
      conversationId: activeConversation?.id,
      message: currentText,
      mode: activeMode,
      attachments,
      activeArtifactContext: buildActiveArtifactContext(),
      onConversationReady: (readyId) => {
        if (!conversationId) {
          navigate(`/app/chat/${readyId}`, { replace: true });
        }
      },
    });
  };

  const handleStudioIterate = async (
    instruction: string,
    currentContext: {
      title?: string;
      mode?: AuraMode;
      filename?: string;
      code?: string;
      content?: string;
    }
  ) => {
    if (!instruction.trim()) return;
    const targetMode = currentContext.mode || studioItem?.mode || activeMode;
    setActiveMode(targetMode);
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 1150);

    await sendMessage({
      conversationId: activeConversation?.id,
      message: instruction.trim(),
      mode: targetMode,
      activeArtifactContext: currentContext,
      onConversationReady: (readyId) => {
        if (!conversationId) {
          navigate(`/app/chat/${readyId}`, { replace: true });
        }
      },
    });
  };

  const handleSelectStudioVersion = (msg: ChatMessage) => {
    if (!activeConversation) return;
    const resolvedMode: AuraMode = msg.codeArtifact
      ? 'code'
      : msg.creativeArtifact
      ? 'create'
      : msg.mode || activeConversation.mode;

    setStudioItem({
      messageId: msg.id,
      conversationId: activeConversation.id,
      title: msg.creativeArtifact?.title || activeConversation.title,
      mode: resolvedMode,
      codeArtifact: msg.codeArtifact,
      creativeArtifact: msg.creativeArtifact,
      rawContent: msg.content,
      sources: msg.sources,
      modelId: msg.modelId,
      estimatedTokens: msg.estimatedTokens,
      createdAt: msg.createdAt,
    });
  };

  const handleActionCardClick = async (mode: AuraMode, promptText: string) => {
    setActiveMode(mode);
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 1150);

    if (mode === 'code' || mode === 'create') {
      setUserDismissedStudio(false);
      setStudioOpen(true);
    }

    await sendMessage({
      conversationId: undefined,
      message: promptText,
      mode,
      onConversationReady: (readyId) => {
        navigate(`/app/chat/${readyId}`);
      },
    });
  };

  const handleRegenerate = async (userPrompt: string, mode: AuraMode) => {
    if (!activeConversation) return;
    await sendMessage({
      conversationId: activeConversation.id,
      message: userPrompt,
      mode,
      activeArtifactContext: buildActiveArtifactContext(),
    });
  };

  // Les 4 cartes d'action pour démarrer une vraie création
  const actionCards = [
    {
      id: 'website',
      mode: 'code' as AuraMode,
      titleFr: 'Créer un site web',
      titleEn: 'Build a website',
      descFr: 'Un site moderne et responsive pour mon projet.',
      descEn: 'A modern and responsive website for my project.',
      icon: 'fa-solid fa-wand-magic-sparkles',
      iconBg: 'bg-[#EAF2E2] dark:bg-[#182E24]',
      iconColor: '#078348',
      promptFr:
        'Crée une page web complète, moderne et responsive en HTML et CSS (dans un seul bloc HTML avec aperçu en direct) pour présenter mon projet.',
      promptEn:
        'Create a complete, modern and responsive single-file HTML/CSS landing page for my project.',
    },
    {
      id: 'document',
      mode: 'chat' as AuraMode,
      titleFr: 'Analyser un document',
      titleEn: 'Analyze a document',
      descFr: 'Résume et extrait les infos importantes.',
      descEn: 'Summarize and extract key information.',
      icon: 'fa-regular fa-file-lines',
      iconBg: 'bg-[#EEF4DC] dark:bg-[#1E2E1A]',
      iconColor: '#4D8B31',
      promptFr:
        'Aide-moi à structurer l’analyse d’un document professionnel : synthétise les points clés, les chiffres importants et les actions recommandées.',
      promptEn:
        'Help me analyze a document: summarize key takeaways, metrics, and action items.',
    },
    {
      id: 'code',
      mode: 'code' as AuraMode,
      titleFr: "M'aider à coder",
      titleEn: 'Help me code',
      descFr: 'Corrige, explique ou génère du code.',
      descEn: 'Debug, explain, or generate clean code.',
      icon: 'fa-solid fa-code',
      iconBg: 'bg-[#FDF0DF] dark:bg-[#2E2216]',
      iconColor: '#EA6B05',
      promptFr:
        'Écris un composant interactif moderne en HTML/CSS/JS autonome avec aperçu en direct et explique sa structure.',
      promptEn:
        'Write an interactive modern web component in self-contained HTML/CSS/JS with live preview.',
    },
    {
      id: 'learn',
      mode: 'chat' as AuraMode,
      titleFr: "M'aider à apprendre",
      titleEn: 'Help me learn',
      descFr: 'Une explication claire sur un sujet.',
      descEn: 'A clear, structured explanation on any topic.',
      icon: 'fa-solid fa-graduation-cap',
      iconBg: 'bg-[#EAF2E2] dark:bg-[#182E24]',
      iconColor: '#078348',
      promptFr:
        'Explique-moi avec pédagogie, des exemples concrets et un mini-quiz comment fonctionnent les architectures modernes d’intelligence artificielle.',
      promptEn:
        'Explain clearly with concrete examples and a short quiz how modern AI architectures work.',
    },
  ];

  // Éléments récents RÉELS appartenant exclusivement à l'utilisateur connecté (aucune donnée fictive)
  const realRecentItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      metaPrefix: string;
      metaSuffix: string;
      isOngoing: boolean;
      icon: string;
      iconBg: string;
      iconColor: string;
      updatedAt: string;
      onClick: () => void;
    }[] = [];

    conversations.forEach((conv) => {
      items.push({
        id: `conv-${conv.id}`,
        title: conv.title,
        metaPrefix: language === 'en' ? 'Conversation' : 'Conversation',
        metaSuffix: formatRelativeTime(conv.updatedAt, language),
        isOngoing: false,
        icon:
          conv.mode === 'code'
            ? 'fa-solid fa-code'
            : conv.mode === 'search'
            ? 'fa-solid fa-magnifying-glass'
            : conv.mode === 'create'
            ? 'fa-solid fa-wand-magic-sparkles'
            : 'fa-regular fa-comment-dots',
        iconBg: 'bg-[#EAF2E2] dark:bg-[#182E24]',
        iconColor: '#078348',
        updatedAt: conv.updatedAt,
        onClick: () => navigate(`/app/chat/${conv.id}`),
      });
    });

    projects.forEach((proj) => {
      items.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        metaPrefix: language === 'en' ? 'Project' : 'Projet',
        metaSuffix: formatRelativeTime(proj.createdAt, language),
        isOngoing: false,
        icon: proj.icon || 'fa-regular fa-folder-open',
        iconBg: 'bg-[#EEF4DC] dark:bg-[#1E2E1A]',
        iconColor: proj.color || '#078348',
        updatedAt: proj.createdAt,
        onClick: () => navigate('/app/projects'),
      });
    });

    missions.forEach((mission) => {
      const isRunning = mission.status === 'in_progress';
      items.push({
        id: `miss-${mission.id}`,
        title: mission.title,
        metaPrefix: language === 'en' ? 'Mission' : 'Mission',
        metaSuffix: isRunning
          ? language === 'en'
            ? 'In progress'
            : 'En cours'
          : formatRelativeTime(mission.createdAt, language),
        isOngoing: isRunning,
        icon: 'fa-solid fa-rocket',
        iconBg: 'bg-[#FDF0DF] dark:bg-[#2E2216]',
        iconColor: '#FF790D',
        updatedAt: mission.createdAt,
        onClick: () => navigate('/app/missions'),
      });
    });

    return items
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [conversations, projects, missions, language, navigate]);

  const geminiProvider = providers.find((p) => p.id === 'gemini');
  const activeProject = projects.find(
    (p) => p.id === (activeConversation?.projectId || activeProjectId)
  );

  return (
    <WorkspaceLayout
      headerTitle={
        activeConversation
          ? activeConversation.title
          : studioOpen
          ? 'Aura Studio'
          : language === 'en'
          ? 'Home'
          : 'Accueil'
      }
    >
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Decorative Flowing Ribbon Wave on the Right */}
        {!activeConversation && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute right-[-40px] top-[12%] w-[320px] sm:w-[460px] h-[440px] opacity-85 dark:opacity-35 z-0 hidden md:block"
          >
            <svg
              viewBox="0 0 460 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="aura-dash-wave-1" x1="0%" y1="65%" x2="100%" y2="10%">
                  <stop offset="0%" stopColor="#8CCB4A" stopOpacity="0" />
                  <stop offset="35%" stopColor="#8CCB4A" stopOpacity="0.32" />
                  <stop offset="70%" stopColor="#EACB37" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#FF790D" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="aura-dash-wave-2" x1="10%" y1="80%" x2="100%" y2="20%">
                  <stop offset="0%" stopColor="#078348" stopOpacity="0" />
                  <stop offset="40%" stopColor="#8CCB4A" stopOpacity="0.24" />
                  <stop offset="78%" stopColor="#FF9E2C" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#FF790D" stopOpacity="0.18" />
                </linearGradient>
              </defs>
              <path
                d="M40 330 C 150 285, 250 250, 360 150 C 410 105, 445 65, 480 30 L 480 230 C 390 275, 270 315, 130 355 Z"
                fill="url(#aura-dash-wave-1)"
                style={{ filter: 'blur(8px)' }}
              />
              <path
                d="M15 350 C 145 310, 265 265, 390 175 C 430 145, 455 110, 485 80"
                stroke="url(#aura-dash-wave-2)"
                strokeWidth="26"
                strokeLinecap="round"
                style={{ filter: 'blur(4px)' }}
              />
              <path
                d="M50 322 C 175 282, 285 242, 415 135"
                stroke="#FFFDF8"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* Bottom-Right Signature Motto ("PLUS D'IDÉES / PLUS D'ACTION / PLUS D'AURA") */}
        {!activeConversation && !studioOpen && (
          <div
            aria-hidden="true"
            className="hidden xl:flex items-center gap-2.5 fixed bottom-5 right-6 z-10 pointer-events-none select-none"
          >
            <span
              className="w-[2.5px] h-9 rounded-full shrink-0"
              style={{
                background:
                  'linear-gradient(180deg, #078348 0%, #8CCB4A 38%, #EACB37 68%, #FF790D 100%)',
              }}
            />
            <div className="text-[9.5px] font-bold uppercase tracking-wider leading-[1.35] text-[#8F9693] dark:text-[#687370]">
              <p>PLUS D’IDÉES</p>
              <p>PLUS D’ACTION</p>
              <p>PLUS D’AURA</p>
            </div>
          </div>
        )}

        {/* Zone B: Conversation Aura (Left / Center Column) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10">
          {conversationId && isLoadingInitial && !activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <AuraIntelligenceCore
                mode={activeMode}
                variant="workspace"
                language={language}
                customLabel={
                  language === 'en'
                    ? 'Loading conversation...'
                    : 'Chargement de la conversation...'
                }
              />
            </div>
          ) : activeConversation ? (
            <div className="flex-1 flex flex-col justify-between px-4 sm:px-6 pt-4 pb-4 max-w-4xl w-full mx-auto min-h-0">
              {/* Top Context & Aura Studio Toggle Bar */}
              <div className="w-full max-w-3xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeProject ? (
                    <div className="flex items-center gap-2 text-xs text-[#14282D] dark:text-[#F3F2EC] truncate">
                      <i className={activeProject.icon} style={{ color: activeProject.color }} />
                      <span className="font-semibold truncate">{activeProject.name}</span>
                      <span className="text-[11px] text-[#77817F] hidden sm:inline">
                        · Contexte actif
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#77817F] truncate">
                      <AuraLogo size="sm" variant="symbol" />
                      <span className="font-medium text-[#14282D] dark:text-[#F3F2EC] truncate">
                        {activeConversation.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (studioOpen) {
                        handleCloseStudio();
                      } else {
                        setUserDismissedStudio(false);
                        setStudioOpen(true);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      studioOpen
                        ? 'bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] border-[#078348]/30'
                        : 'bg-[#FBFAF5] dark:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC] border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348]/40'
                    }`}
                  >
                    <i className="fa-solid fa-table-columns text-[11px]" />
                    <span>
                      {studioOpen
                        ? language === 'en'
                          ? 'Hide Aura Studio'
                          : 'Masquer Aura Studio'
                        : language === 'en'
                        ? 'Open Aura Studio'
                        : 'Ouvrir Aura Studio'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <MessageList
                  messages={activeConversation.messages}
                  onRegenerate={handleRegenerate}
                  onOpenInStudio={handleOpenInStudio}
                />
                <div ref={bottomAnchorRef} />
              </div>

              <div className="pt-3 bg-gradient-to-t from-[#F9F7F0] via-[#F9F7F0] to-transparent dark:from-[#0E1618] dark:via-[#0E1618]">
                <PromptComposer
                  value={promptInput}
                  onChange={setPromptInput}
                  onSubmit={handleSend}
                />
              </div>
            </div>
          ) : (
            /* Dashboard Home ("Accueil") — Personnalisé pour l'utilisateur authentifié */
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-8 flex flex-col items-center justify-between">
              {geminiProvider && !geminiProvider.configured && (
                <div className="w-full max-w-2xl mb-3 px-4 py-2 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-medium flex items-center justify-center gap-2 border border-[#FDE68A]">
                  <i className="fa-solid fa-circle-info" />
                  <span>
                    Aucun fournisseur IA connecté (GEMINI_API_KEY absente). Configurez votre clé dans
                    Settings &gt; Secrets.
                  </span>
                </div>
              )}

              <div className="w-full max-w-[960px] mx-auto flex flex-col items-center text-center">
                <div className="mb-3 sm:mb-4">
                  <AuraLogo
                    size="hero"
                    variant="symbol"
                    animated
                    glow="hero"
                    activityState={logoActivityState}
                  />
                </div>

                {/* Personalized Greeting Headline with the authenticated user's real name */}
                <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] leading-[1.12] tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
                  {language === 'en'
                    ? `Hello${firstName ? ` ${firstName}` : ''}!`
                    : `Bonjour${firstName ? ` ${firstName}` : ''} !`}
                </h2>

                <p className="font-display font-bold text-[22px] sm:text-[33px] leading-[1.18] tracking-tight text-[#14282D] dark:text-[#F3F2EC] mt-0.5">
                  {language === 'en' ? (
                    <>
                      From{' '}
                      <span className="text-[#D97706] dark:text-[#FBBF24]">idea</span> to{' '}
                      <span className="bg-gradient-to-r from-[#16994A] via-[#8CCB4A] to-[#FF790D] bg-clip-text text-transparent">
                        result.
                      </span>
                    </>
                  ) : (
                    <>
                      De l’
                      <span className="text-[#D97706] dark:text-[#FBBF24]">idé</span>e au{' '}
                      <span className="bg-gradient-to-r from-[#16994A] via-[#8CCB4A] to-[#FF790D] bg-clip-text text-transparent">
                        résultat.
                      </span>
                    </>
                  )}
                </p>

                <p className="mt-2.5 text-xs sm:text-[14.5px] text-[#5C6664] dark:text-[#94A09E] max-w-xl leading-relaxed">
                  {language === 'en' ? (
                    <>
                      I am Aura, your versatile AI assistant. I can help you think,
                      <br className="hidden sm:inline" /> research, create, code, and much more.
                    </>
                  ) : (
                    <>
                      Je suis Aura, ton assistant IA polyvalent. Je peux t’aider à réfléchir,
                      <br className="hidden sm:inline" /> rechercher, créer, coder et bien plus
                      encore.
                    </>
                  )}
                </p>

                {/* Elevated Two-Row Prompt Composer */}
                <div className="w-full mt-5 sm:mt-6">
                  <PromptComposer
                    value={promptInput}
                    onChange={setPromptInput}
                    onSubmit={handleSend}
                  />
                </div>

                {/* Four Action Cards Grid */}
                <div className="w-full mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5 text-left">
                  {actionCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      disabled={isSending}
                      onClick={() =>
                        handleActionCardClick(
                          card.mode,
                          language === 'en' ? card.promptEn : card.promptFr
                        )
                      }
                      className="group rounded-[22px] bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#FFFDFC] dark:hover:bg-[#1B292D] border border-[#EAE6DC] dark:border-[#243337] hover:border-[#078348]/35 p-4 sm:p-4.5 flex flex-col justify-between shadow-[0_6px_22px_rgba(20,40,45,0.028)] hover:shadow-[0_12px_30px_rgba(20,40,45,0.055)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`w-9 h-9 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}
                          style={{ color: card.iconColor }}
                        >
                          <i className={`${card.icon} text-sm`} />
                        </span>
                        <i className="fa-solid fa-arrow-right text-xs text-[#77817F] group-hover:text-[#14282D] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-[14.5px] text-[#14282D] dark:text-[#F3F2EC]">
                          {language === 'en' ? card.titleEn : card.titleFr}
                        </h3>
                        <p className="text-xs text-[#6E7775] dark:text-[#94A09E] leading-snug mt-1">
                          {language === 'en' ? card.descEn : card.descFr}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* "Vos récents" Section Container — Affiche uniquement les vraies créations de l'utilisateur ou un état vide invitant à commencer */}
                <div className="w-full mt-5 sm:mt-6 rounded-[24px] bg-[#FFFDF9]/90 dark:bg-[#152023]/90 border border-[#EAE6DC] dark:border-[#243337] p-4 sm:p-5 text-left shadow-[0_8px_28px_rgba(20,40,45,0.025)]">
                  <div className="flex items-center justify-between gap-2 mb-3.5 px-0.5">
                    <div className="flex items-center gap-2">
                      <i className="fa-regular fa-clock text-sm text-[#4A5552] dark:text-[#94A09E]" />
                      <h3 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                        {language === 'en' ? 'Your recents' : 'Vos récents'}
                      </h3>
                    </div>

                    {realRecentItems.length > 0 && (
                      <Link
                        to="/app/library"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline"
                      >
                        <span>{language === 'en' ? 'See all' : 'Voir tout'}</span>
                        <i className="fa-solid fa-arrow-right text-[10px]" />
                      </Link>
                    )}
                  </div>

                  {realRecentItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {realRecentItems.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={rec.onClick}
                          className="group rounded-2xl bg-[#FAF8F2] dark:bg-[#111B1E] hover:bg-[#F3F0E6] dark:hover:bg-[#1B292D] border border-[#EAE6DC]/90 dark:border-[#243337] hover:border-[#078348]/35 p-3 flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-full ${rec.iconBg} flex items-center justify-center shrink-0`}
                              style={{ color: rec.iconColor }}
                            >
                              <i className={`${rec.icon} text-xs`} />
                            </span>

                            <div className="min-w-0">
                              <p className="font-display font-bold text-xs text-[#14282D] dark:text-[#F3F2EC] truncate">
                                {rec.title}
                              </p>
                              <p className="text-[11px] text-[#77817F] truncate mt-0.5">
                                <span>{rec.metaPrefix}</span>
                                <span className="mx-1">•</span>
                                <span
                                  className={
                                    rec.isOngoing ? 'text-[#FF790D] font-semibold' : ''
                                  }
                                >
                                  {rec.metaSuffix}
                                </span>
                              </p>
                            </div>
                          </div>

                          <i className="fa-solid fa-chevron-right text-[10px] text-[#77817F] group-hover:text-[#14282D] dark:group-hover:text-white shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#FAF8F2] dark:bg-[#111B1E] border border-dashed border-[#DFDBD0] dark:border-[#243337] px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 text-center sm:text-left">
                        <span className="w-10 h-10 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-seedling text-sm" />
                        </span>
                        <div>
                          <p className="font-display font-bold text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC]">
                            {language === 'en'
                              ? 'Your workspace is brand new'
                              : 'Ton espace est prêt et entièrement vierge'}
                          </p>
                          <p className="text-xs text-[#6E7775] dark:text-[#94A09E] mt-0.5">
                            {language === 'en'
                              ? 'Your recent conversations, projects, and missions will appear here as soon as you create them.'
                              : 'Tes conversations, projets et missions apparaîtront ici dès que tu commenceras à créer.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/app/projects"
                          className="px-3.5 py-2 rounded-full bg-[#FFFDF9] dark:bg-[#152023] border border-[#E5E0D2] dark:border-[#243337] hover:border-[#078348]/40 text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-colors"
                        >
                          {language === 'en' ? 'New project' : 'Créer un projet'}
                        </Link>
                        <Link
                          to="/app/missions"
                          className="px-3.5 py-2 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] hover:brightness-95 transition-all"
                        >
                          {language === 'en' ? 'Start a mission' : 'Lancer une mission'}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zone C: Desktop Split-View Aura Studio Panel */}
        {studioOpen && (
          <div className="hidden lg:flex h-full relative z-20 shrink-0">
            <AuraStudioPanel
              item={studioItem}
              conversation={activeConversation}
              activeMode={activeMode}
              isGenerating={isSending}
              onClose={handleCloseStudio}
              onIterate={handleStudioIterate}
              onSelectVersion={handleSelectStudioVersion}
            />
          </div>
        )}

        {/* Zone C: Mobile / Tablet Drawer Aura Studio Panel */}
        {studioOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Aura Studio"
            className="fixed inset-0 z-50 lg:hidden flex justify-end"
          >
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
              onClick={handleCloseStudio}
            />
            <div className="relative z-10 w-full max-w-2xl h-full bg-[#FFFDF8] dark:bg-[#152023] shadow-2xl">
              <AuraStudioPanel
                item={studioItem}
                conversation={activeConversation}
                activeMode={activeMode}
                isGenerating={isSending}
                onClose={handleCloseStudio}
                onIterate={handleStudioIterate}
                onSelectVersion={handleSelectStudioVersion}
              />
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
};
