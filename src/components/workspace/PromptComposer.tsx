import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  AURA_MODEL_CATALOG,
  AttachmentItem,
  AuraMode,
  CatalogModelDefinition,
  ModelCategory,
} from '../../shared/types';
import { useAura } from '../../context/AuraContext';

export interface MediaWorkflowOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  slideCount?: number;
}

interface PromptComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (attachments: AttachmentItem[], mediaOptions?: MediaWorkflowOptions) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const MODE_DEFINITIONS: Record<
  AuraMode,
  {
    id: AuraMode;
    labelFr: string;
    labelEn: string;
    generalLabelFr: string;
    generalLabelEn: string;
    descFr: string;
    descEn: string;
    icon: string;
    accentColor: string;
    badgeBg: string;
    placeholderFr: string;
    placeholderEn: string;
  }
> = {
  chat: {
    id: 'chat',
    labelFr: 'Chat',
    labelEn: 'Chat',
    generalLabelFr: 'Général',
    generalLabelEn: 'General',
    descFr: 'Assistant conversationnel polyvalent',
    descEn: 'Versatile conversational assistant',
    icon: 'fa-solid fa-wand-magic-sparkles',
    accentColor: '#078348',
    badgeBg: 'bg-[#EAF2E2] text-[#078348]',
    placeholderFr: 'Pose-moi une question, demande une création, ou lance une mission...',
    placeholderEn: 'Ask me a question, request a creation, or launch a mission...',
  },
  search: {
    id: 'search',
    labelFr: 'Recherche',
    labelEn: 'Search',
    generalLabelFr: 'Recherche Web',
    generalLabelEn: 'Web Search',
    descFr: 'Recherche web vérifiée avec sources et citations',
    descEn: 'Verified web search with sources and citations',
    icon: 'fa-solid fa-magnifying-glass',
    accentColor: '#EACB37',
    badgeBg: 'bg-[#FDF8E1] text-[#B88E00]',
    placeholderFr: 'Rechercher une information sourcée sur le web...',
    placeholderEn: 'Search for verified web information...',
  },
  code: {
    id: 'code',
    labelFr: 'Code',
    labelEn: 'Code',
    generalLabelFr: 'Code & Web',
    generalLabelEn: 'Code & Web',
    descFr: 'Génération, explication, débogage et aperçu HTML/JS',
    descEn: 'Code generation, debugging, and live HTML/JS preview',
    icon: 'fa-solid fa-code',
    accentColor: '#078348',
    badgeBg: 'bg-[#EAF3EC] text-[#078348]',
    placeholderFr: 'Décris le site web, la fonction ou le bug à résoudre...',
    placeholderEn: 'Describe the website, script, or bug to solve...',
  },
  create: {
    id: 'create',
    labelFr: 'Aura Studio',
    labelEn: 'Aura Studio',
    generalLabelFr: 'Aura Studio',
    generalLabelEn: 'Aura Studio',
    descFr: 'Espace de création : concepts, plans éditoriaux et livrables visuels',
    descEn: 'Creation space: concepts, editorial plans, and visual deliverables',
    icon: 'fa-solid fa-compass-drafting',
    accentColor: '#FF790D',
    badgeBg: 'bg-[#FFF0E5] text-[#FF790D]',
    placeholderFr: 'Imagine un concept, un plan de marque ou un livrable dans Aura Studio...',
    placeholderEn: 'Imagine a brand concept, content plan, or deliverable in Aura Studio...',
  },
  image: {
    id: 'image',
    labelFr: 'Image',
    labelEn: 'Image',
    generalLabelFr: 'Image IA',
    generalLabelEn: 'AI Image',
    descFr: 'Génération d’images, illustrations et visuels haute définition',
    descEn: 'High-definition image, illustration, and visual generation',
    icon: 'fa-regular fa-image',
    accentColor: '#FF790D',
    badgeBg: 'bg-[#FFF0E5] text-[#FF790D]',
    placeholderFr: 'Décris l’image, l’affiche ou l’illustration à générer dans Aura Studio...',
    placeholderEn: 'Describe the image, poster, or illustration to generate in Aura Studio...',
  },
  video: {
    id: 'video',
    labelFr: 'Vidéo',
    labelEn: 'Video',
    generalLabelFr: 'Vidéo & Motion',
    generalLabelEn: 'Video & Motion',
    descFr: 'Génération vidéo Veo 3.1, animations motion et storyboards',
    descEn: 'Veo 3.1 video generation, motion scenes, and storyboards',
    icon: 'fa-solid fa-film',
    accentColor: '#FF790D',
    badgeBg: 'bg-[#FFF0E5] text-[#FF790D]',
    placeholderFr: 'Décris la scène vidéo, l’animation cinématique ou le clip à réaliser...',
    placeholderEn: 'Describe the video scene, cinematic animation, or clip to create...',
  },
  slides: {
    id: 'slides',
    labelFr: 'Slides',
    labelEn: 'Slides',
    generalLabelFr: 'Présentation 16:9',
    generalLabelEn: '16:9 Presentation',
    descFr: 'Création de présentations et pitch decks interactifs 16:9',
    descEn: 'Interactive 16:9 presentations and pitch decks',
    icon: 'fa-solid fa-person-chalkboard',
    accentColor: '#078348',
    badgeBg: 'bg-[#EAF2E2] text-[#078348]',
    placeholderFr: 'Indique le sujet de ta présentation (ex: Pitch deck startup fintech en 6 slides)...',
    placeholderEn: 'Enter your presentation topic (e.g., 6-slide fintech startup pitch deck)...',
  },
};

const CATEGORY_TABS: Array<{
  id: 'all' | ModelCategory;
  labelFr: string;
  labelEn: string;
}> = [
  { id: 'all', labelFr: 'Tous', labelEn: 'All' },
  { id: 'aura', labelFr: 'Aura (5)', labelEn: 'Aura (5)' },
  { id: 'free_llm', labelFr: 'Gemini · GPT · Claude', labelEn: 'Gemini · GPT · Claude' },
  { id: 'image', labelFr: 'Images', labelEn: 'Images' },
  { id: 'video_slides', labelFr: 'Vidéos & Slides', labelEn: 'Videos & Slides' },
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  compact = false,
}) => {
  const {
    activeMode,
    setActiveMode,
    activeModelId,
    setActiveModelId,
    language,
    isSending,
  } = useAura();

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [modelCategoryFilter, setModelCategoryFilter] = useState<'all' | ModelCategory>('all');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [slideCount, setSlideCount] = useState<number>(6);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const plusDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModeConfig = MODE_DEFINITIONS[activeMode] || MODE_DEFINITIONS.chat;

  const selectedModel: CatalogModelDefinition = useMemo(() => {
    return (
      AURA_MODEL_CATALOG.find((m) => m.id === activeModelId) ||
      AURA_MODEL_CATALOG[0]
    );
  }, [activeModelId]);

  const filteredModels = useMemo(() => {
    if (modelCategoryFilter === 'all') return AURA_MODEL_CATALOG;
    return AURA_MODEL_CATALOG.filter((m) => m.category === modelCategoryFilter);
  }, [modelCategoryFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
      if (plusDropdownRef.current && !plusDropdownRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = (mod: CatalogModelDefinition) => {
    setActiveModelId(mod.id);
    if (mod.defaultMode) {
      setActiveMode(mod.defaultMode);
    } else if (
      ['image', 'video', 'slides'].includes(activeMode) &&
      !mod.capabilities.includes(activeMode)
    ) {
      setActiveMode('chat');
    }
    setModelMenuOpen(false);
  };

  const handleWorkflowModeSelect = (nextMode: AuraMode) => {
    const targetMode = activeMode === nextMode ? 'chat' : nextMode;
    setActiveMode(targetMode);

    // Automatically select the best matching model for Image, Video, or Slides if current model doesn't specialize in it
    if (targetMode === 'image' && selectedModel.category !== 'image') {
      setActiveModelId('gemini-3.1-flash-lite-image');
    } else if (targetMode === 'video' && !selectedModel.capabilities.includes('video')) {
      setActiveModelId('veo-3.1-lite-generate-preview');
    } else if (targetMode === 'slides' && selectedModel.id !== 'aura-slides-pro') {
      setActiveModelId('aura-slides-pro');
    } else if (
      targetMode === 'chat' &&
      (selectedModel.category === 'image' || selectedModel.category === 'video_slides')
    ) {
      setActiveModelId('aura-3.8-flash');
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    forcedType?: 'image' | 'document'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = forcedType === 'image' || file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImage) {
        reader.onload = () => {
          const item: AttachmentItem = {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: 'image',
            mimeType: file.type || 'image/png',
            size: file.size,
            dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
          };
          setAttachments((prev) => [...prev, item]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const textContent = typeof reader.result === 'string' ? reader.result : '';
          const item: AttachmentItem = {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.name.match(/\.(ts|tsx|js|jsx|py|html|css|json|sql)$/i)
              ? 'code'
              : 'document',
            mimeType: file.type || 'text/plain',
            size: file.size,
            contentPreview: textContent.slice(0, 6000),
          };
          setAttachments((prev) => [...prev, item]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || disabled || isSending) return;
    onSubmit(attachments, {
      aspectRatio,
      slideCount,
    });
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  const resolvedPlaceholder =
    placeholder ||
    (language === 'en'
      ? currentModeConfig.placeholderEn
      : currentModeConfig.placeholderFr);

  return (
    <div className="w-full max-w-[780px] mx-auto">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css,.pdf"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'document')}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />

      {/* Main Elevated Two-Row Input Surface */}
      <div
        className={`relative bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] rounded-[26px] shadow-[0_14px_40px_rgba(20,40,45,0.055)] transition-all duration-150 focus-within:border-[#078348]/45 dark:focus-within:border-[#8CCB4A]/45 ${
          compact ? 'px-3.5 py-2.5' : 'px-4 sm:px-5 pt-3.5 pb-3'
        }`}
      >
        {/* Contextual Media Format Bar when Image, Video, or Slides mode is active */}
        {(activeMode === 'image' || activeMode === 'video' || activeMode === 'slides') && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#EAE6DC]/70 dark:border-[#243337] text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: currentModeConfig.accentColor }}
              >
                <i className={currentModeConfig.icon} />
              </span>
              <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                {language === 'en'
                  ? `Workflow: ${currentModeConfig.generalLabelEn}`
                  : `Workflow : ${currentModeConfig.generalLabelFr}`}
              </span>
              <span className="text-[#77817F]">·</span>
              <span className="text-[#078348] dark:text-[#8CCB4A] font-medium">
                {selectedModel.label}
              </span>
            </div>

            {activeMode === 'slides' ? (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#77817F] mr-1">
                  {language === 'en' ? 'Slides:' : 'Diapositives :'}
                </span>
                {[5, 6, 8, 10].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSlideCount(cnt)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                      slideCount === cnt
                        ? 'bg-[#078348] text-white'
                        : 'bg-[#F4F1E8] dark:bg-[#1B292D] text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#77817F] mr-1">Ratio :</span>
                {(activeMode === 'video'
                  ? (['16:9', '9:16'] as const)
                  : (['1:1', '16:9', '9:16', '4:3'] as const)
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAspectRatio(r)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                      aspectRatio === r
                        ? 'bg-[#FF790D] text-white'
                        : 'bg-[#F4F1E8] dark:bg-[#1B292D] text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attachment Preview Row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-2.5 mb-2.5 border-b border-[#EAE6DC]/70 dark:border-[#243337]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#EAE6DC] dark:border-[#243337] text-xs text-[#14282D] dark:text-[#F3F2EC]"
              >
                {att.type === 'image' && att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <i
                    className={`${
                      att.type === 'code'
                        ? 'fa-solid fa-file-code text-[#078348]'
                        : 'fa-regular fa-file-lines text-[#FF790D]'
                    }`}
                  />
                )}
                <span className="max-w-[160px] truncate font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-[#77817F] hover:text-[#14282D] dark:hover:text-white ml-1 cursor-pointer"
                  aria-label="Retirer la pièce jointe"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ROW 1: Plus Button + Paperclip + Textarea Input */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Plus Quick Menu Button */}
          <div className="relative shrink-0" ref={plusDropdownRef}>
            <button
              type="button"
              onClick={() => setPlusMenuOpen((prev) => !prev)}
              title={language === 'en' ? 'Add content or switch workflow' : 'Ajouter un fichier ou choisir un workflow'}
              aria-label="Menu d’ajout rapide"
              className="w-8 h-8 rounded-full bg-[#F3F0E6] dark:bg-[#1B292D] hover:bg-[#E8E4D7] dark:hover:bg-[#243337] text-[#4A5552] dark:text-[#F3F2EC] flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs" />
            </button>

            {plusMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xl p-1.5 z-50 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors text-left cursor-pointer"
                >
                  <i className="fa-regular fa-file-lines text-[#078348] w-4 text-center" />
                  <span>{language === 'en' ? 'Upload document / code' : 'Joindre un document'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors text-left cursor-pointer"
                >
                  <i className="fa-regular fa-image text-[#FF790D] w-4 text-center" />
                  <span>{language === 'en' ? 'Upload reference image' : 'Joindre une image'}</span>
                </button>
                <div className="my-1 border-t border-[#EAE6DC]/60 dark:border-[#243337]" />
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77817F]">
                  {language === 'en' ? 'Creation Workflows' : 'Modes & Création Multimédia'}
                </div>
                {(Object.keys(MODE_DEFINITIONS) as AuraMode[]).map((mKey) => {
                  const m = MODE_DEFINITIONS[mKey];
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        handleWorkflowModeSelect(mKey);
                        setPlusMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                        activeMode === mKey
                          ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                          : 'text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <i
                          className={`${m.icon} w-4 text-center`}
                          style={{ color: m.accentColor }}
                        />
                        <span>{language === 'en' ? m.generalLabelEn : m.generalLabelFr}</span>
                      </span>
                      {activeMode === mKey && <i className="fa-solid fa-check text-[10px]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paperclip Direct Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={language === 'en' ? 'Attach file' : 'Joindre un fichier'}
            aria-label="Joindre un fichier"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F3F0E6] dark:hover:bg-[#1B292D] transition-colors shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-paperclip text-[14px]" />
          </button>

          {/* Center Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled || isSending}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            aria-label={resolvedPlaceholder}
            className="flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-[14px] sm:text-[15px] text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#8B9390] py-1.5 leading-relaxed max-h-[140px]"
          />
        </div>

        {/* ROW 2: Bottom Workflow Toolbar (Left: Categorized Multi-Model Selector | Right: Workflow Triggers + Send Circle) */}
        <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Rich Categorized Model Selector Dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              type="button"
              onClick={() => setModelMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#F4F1E8]/80 dark:bg-[#1B292D] hover:bg-[#EAE5D7] dark:hover:bg-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-colors cursor-pointer"
              aria-expanded={modelMenuOpen}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: selectedModel.accentColor }}
              >
                <i className={`${selectedModel.icon} text-[10px]`} />
              </span>
              <span className="truncate max-w-[155px]">{selectedModel.label}</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-[#77817F]" />
            </button>

            {modelMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-[330px] sm:w-[370px] rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-2xl p-2 z-50">
                <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-[#EAE6DC]/70 dark:border-[#243337] mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#14282D] dark:text-[#F3F2EC]">
                    {language === 'en'
                      ? 'Aura & Multi-Model Hub (18 Models)'
                      : 'Catalogue de Modèles IA & Studio'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {language === 'en' ? 'Free Tier Ready' : 'Accès Gratuit Actif'}
                  </span>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 border-b border-[#EAE6DC]/50 dark:border-[#243337]">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setModelCategoryFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        modelCategoryFilter === tab.id
                          ? 'bg-[#078348] text-white'
                          : 'bg-[#F4F1E8] dark:bg-[#1B292D] text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-white'
                      }`}
                    >
                      {language === 'en' ? tab.labelEn : tab.labelFr}
                    </button>
                  ))}
                </div>

                {/* Scrollable Model List */}
                <div className="max-h-[290px] overflow-y-auto space-y-1 pr-0.5">
                  {filteredModels.map((mod) => {
                    const isCurrent = selectedModel.id === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleSelectModel(mod)}
                        className={`w-full flex items-start justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#14282D] dark:text-[#F3F2EC]'
                            : 'hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white mt-0.5"
                            style={{ backgroundColor: mod.accentColor }}
                          >
                            <i className={`${mod.icon} text-xs`} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold">{mod.label}</span>
                              <span className="text-[10px] font-medium text-[#078348] dark:text-[#8CCB4A]">
                                · {language === 'en' ? mod.badgeEn : mod.badgeFr}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#77817F] leading-snug mt-0.5">
                              {language === 'en' ? mod.subtitleEn : mod.subtitleFr}
                            </p>
                          </div>
                        </div>
                        {isCurrent && (
                          <i className="fa-solid fa-check text-xs text-[#078348] dark:text-[#8CCB4A] shrink-0 mt-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Workflow Mode Buttons (Recherche, Code, Image, Vidéo, Slides) + Send Button */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-wrap justify-end">
            {/* Trigger: Recherche */}
            <button
              type="button"
              onClick={() => handleWorkflowModeSelect('search')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'search'
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-magnifying-glass text-[11px] ${
                  activeMode === 'search'
                    ? 'text-[#078348] dark:text-[#8CCB4A]'
                    : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Search' : 'Recherche'}
              </span>
            </button>

            {/* Trigger: Code */}
            <button
              type="button"
              onClick={() => handleWorkflowModeSelect('code')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'code'
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-code text-[11px] ${
                  activeMode === 'code'
                    ? 'text-[#078348] dark:text-[#8CCB4A]'
                    : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>Code</span>
            </button>

            {/* Trigger: Image */}
            <button
              type="button"
              onClick={() => handleWorkflowModeSelect('image')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'image'
                  ? 'bg-[#FFF0E5] dark:bg-[#2E2016] border-[#FF790D]/45 text-[#FF790D] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-regular fa-image text-[11px] ${
                  activeMode === 'image' ? 'text-[#FF790D]' : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>Image</span>
            </button>

            {/* Trigger: Vidéo */}
            <button
              type="button"
              onClick={() => handleWorkflowModeSelect('video')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'video'
                  ? 'bg-[#FFF0E5] dark:bg-[#2E2016] border-[#FF790D]/45 text-[#FF790D] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-film text-[11px] ${
                  activeMode === 'video' ? 'text-[#FF790D]' : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>{language === 'en' ? 'Video' : 'Vidéo'}</span>
            </button>

            {/* Trigger: Slides */}
            <button
              type="button"
              onClick={() => handleWorkflowModeSelect('slides')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'slides'
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-person-chalkboard text-[11px] ${
                  activeMode === 'slides'
                    ? 'text-[#078348] dark:text-[#8CCB4A]'
                    : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>Slides</span>
            </button>

            {/* Circular Warm Orange Gradient Send Button */}
            <button
              type="button"
              onClick={triggerSubmit}
              disabled={(!value.trim() && attachments.length === 0) || disabled || isSending}
              aria-label={language === 'en' ? 'Send message' : 'Envoyer le message'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#FF790D] via-[#FF8E1D] to-[#FFB338] hover:brightness-105 disabled:opacity-45 text-white flex items-center justify-center transition-all duration-150 shrink-0 shadow-[0_4px_14px_rgba(255,121,13,0.35)] cursor-pointer disabled:cursor-not-allowed"
            >
              {isSending ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs sm:text-sm" />
              ) : (
                <i className="fa-solid fa-arrow-right text-xs sm:text-sm" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
