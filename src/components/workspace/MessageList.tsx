import React, { useState } from 'react';
import { ChatMessage } from '../../shared/types';
import { AuraLogo } from '../brand/AuraLogo';
import { AuraIntelligenceCore } from '../brand/AuraIntelligenceCore';
import { AuraStudioItem } from './AuraStudioPanel';
import { useAura } from '../../context/AuraContext';
import { MODE_DEFINITIONS } from './PromptComposer';

interface MessageListProps {
  messages: ChatMessage[];
  onRegenerate: (userPrompt: string, mode: ChatMessage['mode']) => void;
  onOpenInStudio?: (item: AuraStudioItem) => void;
}

/**
 * Formateur Markdown propre et structuré avec prise en charge des blocs de code,
 * de l'aperçu HTML/CSS/JS interactif en direct, des listes et des titres.
 */
const FormattedContent: React.FC<{
  content: string;
  previewableHtml?: string;
  onOpenCodeInStudio?: (code: string, lang: string) => void;
}> = ({ content, previewableHtml, onOpenCodeInStudio }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(
    previewableHtml ? 0 : null
  );

  // Split content by fenced code blocks
  const segments = content.split(/(```[\s\S]*?```)/g);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[#14282D] dark:text-[#F3F2EC]">
      {segments.map((segment, index) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const lines = segment.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine.toLowerCase() : 'code';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          const canPreviewHtml =
            lang === 'html' ||
            codeBody.includes('<!DOCTYPE html>') ||
            codeBody.includes('<html') ||
            (codeBody.includes('<div') && codeBody.includes('<style'));

          const showPreview = activePreviewIndex === index;

          return (
            <div
              key={index}
              className="my-4 rounded-2xl overflow-hidden border border-[#223236] bg-[#101B1E] text-[#F3F2EC]"
            >
              {/* Code Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#162428] border-b border-[#223236] text-xs">
                <div className="flex items-center gap-2 font-mono text-[#94A09E]">
                  <i className="fa-solid fa-code text-[#8CCB4A]" />
                  <span>{lang === 'html' ? 'index.html' : lang}</span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenCodeInStudio && (
                    <button
                      type="button"
                      onClick={() => onOpenCodeInStudio(codeBody, lang)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#078348]/25 hover:bg-[#078348]/40 text-[#8CCB4A] font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="fa-solid fa-compass-drafting text-[10px]" />
                      <span>Ouvrir dans Aura Studio</span>
                    </button>
                  )}

                  {canPreviewHtml && (
                    <button
                      type="button"
                      onClick={() =>
                        setActivePreviewIndex(showPreview ? null : index)
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        showPreview
                          ? 'bg-[#078348] text-white'
                          : 'bg-[#1F3136] text-[#F3F2EC] hover:bg-[#2A4046]'
                      }`}
                    >
                      <i className={`fa-solid ${showPreview ? 'fa-code' : 'fa-play'} text-[10px]`} />
                      <span>{showPreview ? 'Voir le code' : 'Aperçu en direct'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeBody, index)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F3136] hover:bg-[#2A4046] text-[#F3F2EC] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i
                      className={`fa-regular ${
                        copiedIndex === index ? 'fa-circle-check text-[#8CCB4A]' : 'fa-copy'
                      }`}
                    />
                    <span>{copiedIndex === index ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* Either Live Sandboxed HTML Preview or Code Pre */}
              {showPreview && canPreviewHtml ? (
                <div className="bg-white">
                  <div className="px-3 py-1.5 bg-[#F4F2EA] border-b border-[#E8E6DE] flex items-center justify-between text-[11px] text-[#77817F]">
                    <span>Aperçu interactif HTML / CSS / JS (Sandbox isolée)</span>
                    <span className="font-mono">100% Client-Side</span>
                  </div>
                  <iframe
                    title={`Aperçu code ${index}`}
                    srcDoc={codeBody}
                    sandbox="allow-scripts"
                    className="w-full h-[360px] border-0 bg-white"
                  />
                </div>
              ) : (
                <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-[#E6ECEA]">
                  <code>{codeBody}</code>
                </pre>
              )}
            </div>
          );
        }

        // Render normal text paragraphs, headings, and lists
        const blocks = segment.trim().split(/\n\n+/);
        return (
          <React.Fragment key={index}>
            {blocks.map((block, bIdx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={bIdx}
                    className="font-display font-bold text-base sm:text-lg text-[#14282D] dark:text-[#F3F2EC] pt-2"
                  >
                    {trimmed.replace(/^###\s+/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={bIdx}
                    className="font-display font-bold text-lg sm:text-xl text-[#14282D] dark:text-[#F3F2EC] pt-3"
                  >
                    {trimmed.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2
                    key={bIdx}
                    className="font-display font-bold text-xl sm:text-2xl text-[#14282D] dark:text-[#F3F2EC] pt-3"
                  >
                    {trimmed.replace(/^#\s+/, '')}
                  </h2>
                );
              }

              // Check if bullet list
              const lines = trimmed.split('\n');
              const isBulletList = lines.every(
                (l) => l.trim().startsWith('- ') || l.trim().startsWith('* ')
              );
              if (isBulletList) {
                return (
                  <ul key={bIdx} className="space-y-1.5 pl-5 list-disc marker:text-[#078348]">
                    {lines.map((line, lIdx) => (
                      <li key={lIdx} className="leading-relaxed">
                        {renderInlineFormatting(line.trim().replace(/^[-*]\s+/, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Check if numbered list
              const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
              if (isNumberedList) {
                return (
                  <ol
                    key={bIdx}
                    className="space-y-1.5 pl-5 list-decimal marker:font-semibold marker:text-[#078348]"
                  >
                    {lines.map((line, lIdx) => (
                      <li key={lIdx} className="leading-relaxed">
                        {renderInlineFormatting(line.trim().replace(/^\d+\.\s+/, ''))}
                      </li>
                    ))}
                  </ol>
                );
              }

              return (
                <p key={bIdx} className="leading-relaxed whitespace-pre-line">
                  {renderInlineFormatting(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function renderInlineFormatting(text: string): React.ReactNode {
  // Handle **bold** and `inline code`
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[#14282D] dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-[#F4F2EA] dark:bg-[#1B292D] font-mono text-[13px] text-[#078348] dark:text-[#8CCB4A]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onRegenerate,
  onOpenInStudio,
}) => {
  const { saveMessageToLibrary, language, isSending, activeMode } = useAura();
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-8">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const modeInfo = MODE_DEFINITIONS[msg.mode || 'chat'];

        // Find preceding user message for regeneration
        const previousUserMsg =
          !isUser && idx > 0
            ? messages
                .slice(0, idx)
                .reverse()
                .find((m) => m.role === 'user')
            : undefined;

        if (isUser) {
          return (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-[#EAF1E8] dark:bg-[#182E24] border border-[#D8E5D5] dark:border-[#244233] px-4 sm:px-5 py-3.5 text-[#14282D] dark:text-[#F3F2EC]">
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-[#152023] text-xs"
                      >
                        {att.type === 'image' && att.dataUrl ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <i className="fa-regular fa-file-lines text-[#078348]" />
                        )}
                        <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#77817F] px-1">
                <span>{language === 'en' ? modeInfo.labelEn : modeInfo.labelFr}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-4 sm:p-6 shadow-[0_4px_20px_rgba(20,40,45,0.03)]"
          >
            {/* Assistant Message Header */}
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E8E6DE]/60 dark:border-[#243337]">
              <div className="flex items-center gap-2.5">
                <AuraLogo size="xs" withWordmark={false} />
                <span className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                  Aura
                </span>
                <span aria-hidden="true" className="text-[#77817F]">
                  ·
                </span>
                <span className="text-xs font-medium text-[#77817F]">
                  {language === 'en' ? modeInfo.labelEn : modeInfo.labelFr}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#77817F] tabular-nums">
                {msg.modelId && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F4F2EA] dark:bg-[#1B292D] text-[11px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    {msg.modelId}
                  </span>
                )}
                {msg.estimatedTokens && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>~{msg.estimatedTokens} tokens</span>
                  </>
                )}
              </div>
            </div>

            {/* Verified Web Sources Block (Mode Recherche) */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    <i className="fa-solid fa-circle-check" />
                    <span>
                      {language === 'en'
                        ? `Verified Web Sources (${msg.sources.length})`
                        : `Sources web vérifiées (${msg.sources.length})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#77817F]">Google Search Grounding</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {msg.sources.map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348] transition-colors"
                    >
                      <span className="w-5 h-5 rounded bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {sIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#14282D] dark:text-[#F3F2EC] group-hover:text-[#078348] dark:group-hover:text-[#8CCB4A] truncate">
                          {src.title}
                        </p>
                        <p className="text-[11px] text-[#77817F] truncate">{src.domain}</p>
                      </div>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#77817F] opacity-60 group-hover:opacity-100 mt-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Main Formatted Response */}
            <FormattedContent
              content={msg.content}
              previewableHtml={msg.codeArtifact?.previewableHtml}
              onOpenCodeInStudio={
                onOpenInStudio
                  ? (code, lang) =>
                      onOpenInStudio({
                        messageId: msg.id,
                        conversationId: msg.conversationId,
                        title:
                          previousUserMsg?.content.slice(0, 56) ||
                          msg.codeArtifact?.filename ||
                          'Code Aura Studio',
                        mode: 'code',
                        codeArtifact: {
                          language: lang,
                          filename:
                            msg.codeArtifact?.filename ||
                            (lang === 'html' ? 'index.html' : `snippet.${lang}`),
                          code,
                          previewableHtml:
                            lang === 'html' || code.includes('<html') || code.includes('<style')
                              ? code
                              : undefined,
                          files: msg.codeArtifact?.files,
                        },
                        imageArtifact: msg.imageArtifact,
                        videoArtifact: msg.videoArtifact,
                        slideArtifact: msg.slideArtifact,
                        sources: msg.sources,
                        rawContent: msg.content,
                        modelId: msg.modelId,
                        estimatedTokens: msg.estimatedTokens,
                        createdAt: msg.createdAt,
                      })
                  : undefined
              }
            />

            {/* Inline Image Artifact Card (Mode Image HD) */}
            {msg.imageArtifact && (
              <div className="mt-5 rounded-2xl overflow-hidden bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                <div className="px-4 py-2.5 border-b border-[#E8E6DE] dark:border-[#243337] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] dark:text-[#FBBF24]">
                    <i className="fa-solid fa-image" />
                    <span>Image HD générée ({msg.imageArtifact.aspectRatio})</span>
                  </div>
                  {onOpenInStudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInStudio({
                          messageId: msg.id,
                          conversationId: msg.conversationId,
                          title:
                            msg.imageArtifact?.title ||
                            previousUserMsg?.content.slice(0, 56) ||
                            'Image Aura Studio',
                          mode: 'image',
                          imageArtifact: msg.imageArtifact,
                          rawContent: msg.content,
                          modelId: msg.modelId,
                          estimatedTokens: msg.estimatedTokens,
                          createdAt: msg.createdAt,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <i className="fa-solid fa-expand text-[10px]" />
                      <span>Ouvrir dans Studio</span>
                    </button>
                  )}
                </div>
                <div className="p-3 flex justify-center bg-[#14282D]/5 dark:bg-[#0B1214]">
                  <img
                    src={msg.imageArtifact.imageUrl}
                    alt={msg.imageArtifact.prompt}
                    referrerPolicy="no-referrer"
                    className="max-h-[340px] w-auto rounded-xl object-contain shadow-md"
                  />
                </div>
              </div>
            )}

            {/* Inline Video / Motion Artifact Card (Mode Vidéo) */}
            {msg.videoArtifact && (
              <div className="mt-5 p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#EA580C]">
                    <i className="fa-solid fa-film" />
                    <span>
                      {msg.videoArtifact.status === 'polling'
                        ? 'Rendu vidéo Veo 3.1 en cours + Motion Canvas prêt'
                        : 'Séquence Vidéo & Storyboard Aura Motion'}
                    </span>
                  </div>
                  {onOpenInStudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInStudio({
                          messageId: msg.id,
                          conversationId: msg.conversationId,
                          title:
                            msg.videoArtifact?.title ||
                            previousUserMsg?.content.slice(0, 56) ||
                            'Séquence Vidéo Aura',
                          mode: 'video',
                          videoArtifact: msg.videoArtifact,
                          codeArtifact: msg.codeArtifact,
                          rawContent: msg.content,
                          modelId: msg.modelId,
                          estimatedTokens: msg.estimatedTokens,
                          createdAt: msg.createdAt,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <i className="fa-solid fa-play text-[10px]" />
                      <span>Lire dans Aura Studio</span>
                    </button>
                  )}
                </div>
                {msg.videoArtifact.scenes && msg.videoArtifact.scenes.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {msg.videoArtifact.scenes.slice(0, 4).map((sc) => (
                      <div
                        key={sc.sceneNumber}
                        className="p-2.5 rounded-xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337]"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#EA580C] mb-1">
                          <span>Scène {sc.sceneNumber}</span>
                          <span>{sc.durationSeconds}s</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#14282D] dark:text-[#F3F2EC] truncate">
                          {sc.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inline Slide Deck Artifact Card (Mode Slides) */}
            {msg.slideArtifact && (
              <div className="mt-5 p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    <i className="fa-solid fa-chalkboard-user" />
                    <span>
                      Présentation interactive ({msg.slideArtifact.slides.length} slides)
                    </span>
                  </div>
                  {onOpenInStudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInStudio({
                          messageId: msg.id,
                          conversationId: msg.conversationId,
                          title: msg.slideArtifact!.title,
                          mode: 'slides',
                          slideArtifact: msg.slideArtifact,
                          codeArtifact: msg.codeArtifact,
                          rawContent: msg.content,
                          modelId: msg.modelId,
                          estimatedTokens: msg.estimatedTokens,
                          createdAt: msg.createdAt,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <i className="fa-solid fa-display text-[10px]" />
                      <span>Présenter dans Studio</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {msg.slideArtifact.slides.slice(0, 3).map((sl, sIdx) => (
                    <div
                      key={sl.slideNumber || sIdx}
                      className="p-2.5 rounded-xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337]"
                    >
                      <span className="text-[10px] font-mono font-bold text-[#078348] dark:text-[#8CCB4A]">
                        Slide {sl.slideNumber || sIdx + 1}
                      </span>
                      <p className="text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] truncate mt-0.5">
                        {sl.title}
                      </p>
                      {sl.subtitle && (
                        <p className="text-[11px] text-[#77817F] truncate mt-0.5">{sl.subtitle}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aura Studio Summary Card (Mode Créer / Aura Studio) */}
            {msg.creativeArtifact && (
              <div className="mt-5 p-4 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF790D]">
                    <i className="fa-solid fa-compass-drafting" />
                    <span>Fiche Aura Studio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.creativeArtifact.palette && (
                      <div className="flex items-center gap-1">
                        {msg.creativeArtifact.palette.map((hex) => (
                          <span
                            key={hex}
                            title={hex}
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    )}
                    {onOpenInStudio && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenInStudio({
                            messageId: msg.id,
                            conversationId: msg.conversationId,
                            title: msg.creativeArtifact!.title,
                            mode: 'create',
                            codeArtifact: msg.codeArtifact,
                            creativeArtifact: msg.creativeArtifact,
                            imageArtifact: msg.imageArtifact,
                            videoArtifact: msg.videoArtifact,
                            slideArtifact: msg.slideArtifact,
                            sources: msg.sources,
                            rawContent: msg.content,
                            modelId: msg.modelId,
                            estimatedTokens: msg.estimatedTokens,
                            createdAt: msg.createdAt,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <i className="fa-solid fa-up-right-and-down-left-from-center text-[10px]" />
                        <span>Ouvrir dans Aura Studio</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#77817F] mb-2">
                  Prompt visuel suggéré pour générateur d’images :
                </p>
                <div className="p-2.5 rounded-lg bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] flex items-center justify-between gap-3">
                  <p className="text-xs font-mono text-[#14282D] dark:text-[#F3F2EC] line-clamp-2">
                    {msg.creativeArtifact.promptSuggestion}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(msg.creativeArtifact!.promptSuggestion)
                    }
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F4F2EA] dark:bg-[#1B292D] hover:bg-[#E8E6DE] text-[#14282D] dark:text-[#F3F2EC] shrink-0 cursor-pointer"
                  >
                    Copier le prompt
                  </button>
                </div>
              </div>
            )}

            {/* Search Verification Footnote */}
            {msg.isUncertainNote && (
              <div className="mt-4 pt-3 border-t border-[#E8E6DE]/60 dark:border-[#243337] flex items-center gap-2 text-xs text-[#77817F]">
                <i className="fa-solid fa-shield-halved text-[#078348]" />
                <span>{msg.isUncertainNote}</span>
              </div>
            )}

            {/* Message Footer Actions */}
            <div className="mt-4 pt-3 border-t border-[#E8E6DE]/60 dark:border-[#243337] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i
                    className={`fa-regular ${
                      copiedMsgId === msg.id ? 'fa-circle-check text-[#078348]' : 'fa-copy'
                    }`}
                  />
                  <span>
                    {copiedMsgId === msg.id
                      ? language === 'en'
                        ? 'Copied'
                        : 'Copié'
                      : language === 'en'
                      ? 'Copy'
                      : 'Copier'}
                  </span>
                </button>

                {previousUserMsg && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => onRegenerate(previousUserMsg.content, msg.mode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors whitespace-nowrap disabled:opacity-40 cursor-pointer"
                  >
                    <i className="fa-solid fa-rotate-right" />
                    <span>{language === 'en' ? 'Regenerate' : 'Régénérer'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={msg.savedToLibrary}
                  onClick={() =>
                    saveMessageToLibrary({
                      title:
                        msg.slideArtifact?.title ||
                        msg.creativeArtifact?.title ||
                        previousUserMsg?.content.slice(0, 64) ||
                        `Réponse Aura (${msg.mode.toUpperCase()})`,
                      excerpt: msg.content.slice(0, 220),
                      mode: msg.mode,
                      conversationId: msg.conversationId,
                      messageId: msg.id,
                      tags: [msg.mode.toUpperCase()],
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    msg.savedToLibrary
                      ? 'text-[#078348] bg-[#EAF1E8] dark:bg-[#182E24]'
                      : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]'
                  }`}
                >
                  <i
                    className={`${
                      msg.savedToLibrary ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'
                    }`}
                  />
                  <span>
                    {msg.savedToLibrary
                      ? language === 'en'
                        ? 'Saved in Library'
                        : 'Sauvegardé'
                      : language === 'en'
                      ? 'Save to Library'
                      : 'Sauvegarder'}
                  </span>
                </button>
              </div>

              {onOpenInStudio && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenInStudio({
                      messageId: msg.id,
                      conversationId: msg.conversationId,
                      title:
                        msg.slideArtifact?.title ||
                        msg.creativeArtifact?.title ||
                        previousUserMsg?.content.slice(0, 56) ||
                        'Résultat Aura Studio',
                      mode: msg.mode,
                      codeArtifact: msg.codeArtifact,
                      creativeArtifact: msg.creativeArtifact,
                      imageArtifact: msg.imageArtifact,
                      videoArtifact: msg.videoArtifact,
                      slideArtifact: msg.slideArtifact,
                      sources: msg.sources,
                      rawContent: msg.content,
                      modelId: msg.modelId,
                      estimatedTokens: msg.estimatedTokens,
                      createdAt: msg.createdAt,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAF2E2] dark:bg-[#182E24] hover:brightness-95 text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="fa-solid fa-table-cells-large text-[11px]" />
                  <span>
                    {language === 'en'
                      ? 'Open in Aura Studio'
                      : 'Ouvrir dans Aura Studio'}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Animation B — Aura Intelligence Core (États de génération IA contextuels) */}
      {isSending && (
        <AuraIntelligenceCore
          mode={activeMode}
          variant="message"
          language={language}
        />
      )}
    </div>
  );
};
