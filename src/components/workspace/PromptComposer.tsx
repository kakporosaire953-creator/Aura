import React, { useRef, useState, useEffect } from 'react';
import { AttachmentItem, AuraMode } from '../../shared/types';
import { useAura } from '../../context/AuraContext';

interface PromptComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (attachments: AttachmentItem[]) => void;
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
};

const MODEL_OPTIONS = [
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    subtitleFr: 'Raisonnement & Polyvalence',
    subtitleEn: 'Reasoning & Versatility',
    icon: 'fa-solid fa-microchip',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Aura Flash 3.8',
    subtitleFr: 'Vitesse & Recherche Web Google',
    subtitleEn: 'Fast & Google Search Grounding',
    icon: 'fa-solid fa-bolt',
  },
  {
    id: 'claude-3-7-sonnet',
    label: 'Claude 3.7',
    subtitleFr: 'Code & Architecture créative',
    subtitleEn: 'Code & Creative Architecture',
    icon: 'fa-solid fa-code-branch',
  },
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  compact = false,
}) => {
  const { activeMode, setActiveMode, language, isSending } = useAura();
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [selectedModelLabel, setSelectedModelLabel] = useState('GPT-4o');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const plusDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModeConfig = MODE_DEFINITIONS[activeMode];

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
    onSubmit(attachments);
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
    <div className="w-full max-w-[740px] mx-auto">
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

      {/* Main Elevated Two-Row Input Surface matching Dashboard Reference */}
      <div
        className={`relative bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] rounded-[26px] shadow-[0_14px_40px_rgba(20,40,45,0.055)] transition-all duration-150 focus-within:border-[#078348]/45 dark:focus-within:border-[#8CCB4A]/45 ${
          compact ? 'px-3.5 py-2.5' : 'px-4 sm:px-5 pt-3.5 pb-3'
        }`}
      >
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
              title={language === 'en' ? 'Add content or switch mode' : 'Ajouter un fichier ou choisir un mode'}
              aria-label="Menu d’ajout rapide"
              className="w-8 h-8 rounded-full bg-[#F3F0E6] dark:bg-[#1B292D] hover:bg-[#E8E4D7] dark:hover:bg-[#243337] text-[#4A5552] dark:text-[#F3F2EC] flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs" />
            </button>

            {plusMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xl p-1.5 z-50 space-y-0.5">
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
                  <span>{language === 'en' ? 'Upload image' : 'Joindre une image'}</span>
                </button>
                <div className="my-1 border-t border-[#EAE6DC]/60 dark:border-[#243337]" />
                {(Object.keys(MODE_DEFINITIONS) as AuraMode[]).map((mKey) => {
                  const m = MODE_DEFINITIONS[mKey];
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        setActiveMode(mKey);
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
                        <span>{language === 'en' ? m.labelEn : m.labelFr}</span>
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

        {/* ROW 2: Bottom Toolbar (Left: GPT-4o Model Selector | Right: Fichiers, Recherche, Code + Send Circle) */}
        <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Model Selector Dropdown matching Image ("GPT-4o v") */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              type="button"
              onClick={() => setModelMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-[#F4F1E8] dark:hover:bg-[#1B292D] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-colors cursor-pointer"
              aria-expanded={modelMenuOpen}
            >
              <span className="w-5 h-5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-wand-magic-sparkles text-[10px]" />
              </span>
              <span>{selectedModelLabel}</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-[#77817F]" />
            </button>

            {modelMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xl p-1.5 z-50 space-y-0.5">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#77817F] border-b border-[#EAE6DC]/60 dark:border-[#243337] mb-1">
                  {language === 'en' ? 'Select AI Model' : 'Modèle d’intelligence'}
                </div>
                {MODEL_OPTIONS.map((mod) => {
                  const isCurrent = selectedModelLabel === mod.label;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setSelectedModelLabel(mod.label);
                        setModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#14282D] dark:text-[#F3F2EC]'
                          : 'hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold">{mod.label}</p>
                        <p className="text-[10.5px] text-[#77817F] truncate">
                          {language === 'en' ? mod.subtitleEn : mod.subtitleFr}
                        </p>
                      </div>
                      {isCurrent && (
                        <i className="fa-solid fa-check text-[11px] text-[#078348] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: 3 Quick Pills (Fichiers, Recherche, Code) + Orange Gradient Send Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Pill 1: Fichiers */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                attachments.length > 0
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/35 text-[#078348] dark:text-[#8CCB4A]'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i className="fa-solid fa-paperclip text-[11px] text-[#5A6562] dark:text-[#94A09E]" />
              <span className="hidden xs:inline sm:inline">
                {language === 'en' ? 'Files' : 'Fichiers'}
              </span>
            </button>

            {/* Pill 2: Recherche */}
            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'search' ? 'chat' : 'search')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                activeMode === 'search'
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-magnifying-glass text-[11px] ${
                  activeMode === 'search' ? 'text-[#078348] dark:text-[#8CCB4A]' : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>{language === 'en' ? 'Search' : 'Recherche'}</span>
            </button>

            {/* Pill 3: Code */}
            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'code' ? 'chat' : 'code')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                activeMode === 'code'
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#F2EFE6] dark:hover:bg-[#243337] border-[#E6E2D6] dark:border-[#243337] text-[#3D4A47] dark:text-[#F3F2EC]'
              }`}
            >
              <i
                className={`fa-solid fa-code text-[11px] ${
                  activeMode === 'code' ? 'text-[#078348] dark:text-[#8CCB4A]' : 'text-[#5A6562] dark:text-[#94A09E]'
                }`}
              />
              <span>Code</span>
            </button>

            {/* Circular Warm Orange Gradient Send Button matching Reference */}
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
