import React, { useState, useEffect, useMemo } from 'react';
import { AuraLogo } from '../brand/AuraLogo';
import {
  AuraMode,
  ChatMessage,
  CodeArtifact,
  Conversation,
  CreativeArtifact,
  GroundingSource,
  VirtualStudioFile,
} from '../../shared/types';
import { useAura } from '../../context/AuraContext';

export interface AuraStudioItem {
  messageId?: string;
  conversationId?: string;
  title: string;
  mode: AuraMode;
  codeArtifact?: CodeArtifact;
  creativeArtifact?: CreativeArtifact;
  sources?: GroundingSource[];
  rawContent?: string;
  modelId?: string;
  estimatedTokens?: number;
  createdAt?: string;
}

interface AuraStudioPanelProps {
  item: AuraStudioItem | null;
  isGenerating?: boolean;
  activeMode?: AuraMode;
  conversation?: Conversation;
  onSelectVersion?: (msg: ChatMessage) => void;
  onIterate?: (
    instruction: string,
    currentContext: {
      title?: string;
      mode?: AuraMode;
      filename?: string;
      code?: string;
      content?: string;
    }
  ) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_STUDIO_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aura Studio — Aperçu Interactif</title>
  <style>
    :root {
      --bg: #FBFAF5;
      --surface: #FFFDF8;
      --text: #14282D;
      --muted: #6E7775;
      --green: #078348;
      --lime: #8CCB4A;
      --yellow: #EACB37;
      --orange: #FF790D;
      --border: #E8E6DE;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'DM Sans', 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px 24px;
      line-height: 1.55;
    }
    .studio-card {
      max-width: 560px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 14px 36px rgba(20, 40, 45, 0.05);
    }
    .kicker {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--green);
      margin-bottom: 10px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      color: var(--muted);
      margin-bottom: 22px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(92deg, #078348 0%, #8CCB4A 48%, #EACB37 76%, #FF790D 100%);
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="studio-card">
    <span class="kicker">Aura Studio · Espace de création interactif</span>
    <h1>Votre espace de travail en direct est prêt.</h1>
    <p>Envoyez une demande dans la conversation à gauche pour générer un site web, du code, une recherche vérifiée ou un document structuré, puis modifiez-le de façon itérative ici.</p>
    <button class="btn" onclick="this.textContent = 'Aperçu interactif opérationnel ✓'">Tester l’interaction en direct</button>
  </div>
</body>
</html>`;

export const AuraStudioPanel: React.FC<AuraStudioPanelProps> = ({
  item,
  isGenerating = false,
  activeMode = 'chat',
  conversation,
  onSelectVersion,
  onIterate,
  onClose,
}) => {
  const {
    language,
    projects,
    createProject,
    saveMessageToLibrary,
    updateConversationArtifact,
  } = useAura();

  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'details'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [wideMode, setWideMode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const [editableCode, setEditableCode] = useState<string>(
    item?.codeArtifact?.code || ''
  );
  const [editableBrief, setEditableBrief] = useState<string>(
    item?.rawContent || item?.creativeArtifact?.summary || ''
  );
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [iterationInput, setIterationInput] = useState('');

  const [copied, setCopied] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [isPersistingEdit, setIsPersistingEdit] = useState(false);
  const [editPersisted, setEditPersisted] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectSaveNotice, setProjectSaveNotice] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);

  // Animate generation steps while Aura is generating
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStep(0);
      return;
    }
    setGenerationStep(0);
    const t1 = setTimeout(() => setGenerationStep(1), 950);
    const t2 = setTimeout(() => setGenerationStep(2), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isGenerating]);

  // Synchronize studio state whenever item changes
  useEffect(() => {
    if (!item) {
      setEditableCode('');
      setEditableBrief('');
      return;
    }
    setSelectedFileIndex(0);
    if (item.codeArtifact?.code) {
      setEditableCode(item.codeArtifact.code);
      setEditableBrief(item.rawContent || '');
      setActiveTab('preview');
    } else {
      setEditableCode('');
      setEditableBrief(item.rawContent || item.creativeArtifact?.summary || '');
      setActiveTab('preview');
    }
  }, [item]);

  const hasCode = Boolean(editableCode.trim().length > 0);
  const isPreviewableHtml =
    hasCode &&
    (editableCode.includes('<!DOCTYPE html>') ||
      editableCode.includes('<html') ||
      editableCode.includes('<style') ||
      editableCode.includes('<div') ||
      item?.codeArtifact?.language === 'html');

  // Build virtual file list for the Code / Contenu tab
  const virtualFiles: VirtualStudioFile[] = useMemo(() => {
    const list: VirtualStudioFile[] = [];

    if (item?.codeArtifact?.files && item.codeArtifact.files.length > 0) {
      item.codeArtifact.files.forEach((f, idx) => {
        list.push({
          path: f.path,
          language: f.language,
          content: idx === 0 && editableCode ? editableCode : f.content,
        });
      });
    } else if (hasCode) {
      list.push({
        path: item?.codeArtifact?.filename || (isPreviewableHtml ? 'index.html' : 'main.ts'),
        language: item?.codeArtifact?.language || (isPreviewableHtml ? 'html' : 'typescript'),
        content: editableCode,
      });
    }

    if (editableBrief.trim()) {
      list.push({
        path: item?.mode === 'create' ? 'brief-studio.md' : 'document-aura.md',
        language: 'markdown',
        content: editableBrief,
      });
    }

    if (item?.sources && item.sources.length > 0) {
      list.push({
        path: 'sources-verifiees.json',
        language: 'json',
        content: JSON.stringify(item.sources, null, 2),
      });
    }

    if (list.length === 0) {
      list.push({
        path: 'index.html',
        language: 'html',
        content: DEFAULT_STUDIO_HTML,
      });
    }

    return list;
  }, [item, editableCode, editableBrief, hasCode, isPreviewableHtml]);

  const activeFile = virtualFiles[selectedFileIndex] || virtualFiles[0];

  const assistantVersions = useMemo(() => {
    if (!conversation) return [];
    return conversation.messages.filter((m) => m.role === 'assistant');
  }, [conversation]);

  const activeVersionIndex = useMemo(() => {
    if (!item?.messageId || assistantVersions.length === 0) {
      return assistantVersions.length;
    }
    const idx = assistantVersions.findIndex((m) => m.id === item.messageId);
    return idx !== -1 ? idx + 1 : assistantVersions.length;
  }, [assistantVersions, item?.messageId]);

  const handleFileContentChange = (newVal: string) => {
    if (!activeFile) return;
    if (activeFile.path.endsWith('.md')) {
      setEditableBrief(newVal);
    } else if (selectedFileIndex === 0 || activeFile.path === 'index.html') {
      setEditableCode(newVal);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'code' && activeFile
        ? activeFile.content
        : hasCode
        ? editableCode
        : editableBrief || DEFAULT_STUDIO_HTML;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fileToExport =
      activeTab === 'code' && activeFile
        ? activeFile
        : hasCode
        ? {
            path: item?.codeArtifact?.filename || 'aura-studio-export.html',
            content: editableCode,
          }
        : {
            path: 'aura-livrable.md',
            content: editableBrief || DEFAULT_STUDIO_HTML,
          };

    const isHtml = fileToExport.path.endsWith('.html');
    const blob = new Blob([fileToExport.content], {
      type: isHtml ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileToExport.path;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePersistStudioChanges = async () => {
    const convId = item?.conversationId || conversation?.id;
    const msgId = item?.messageId;
    if (!convId || !msgId) return;

    setIsPersistingEdit(true);
    const updated = await updateConversationArtifact({
      conversationId: convId,
      messageId: msgId,
      updatedCode: hasCode ? editableCode : undefined,
      updatedContent: editableBrief || undefined,
    });
    setIsPersistingEdit(false);
    if (updated) {
      setEditPersisted(true);
      setTimeout(() => setEditPersisted(false), 2500);
    }
  };

  const handleSaveToLibrary = async () => {
    const contentToSave = hasCode ? editableCode : editableBrief;
    if (!contentToSave.trim()) return;
    await saveMessageToLibrary({
      title: item?.title || conversation?.title || 'Création Aura Studio',
      excerpt: contentToSave.slice(0, 220),
      mode: item?.mode || activeMode,
      conversationId: item?.conversationId || conversation?.id,
      messageId: item?.messageId,
      tags: ['AURA STUDIO', (item?.mode || activeMode).toUpperCase()],
    });
    setSavedToLibrary(true);
    setTimeout(() => setSavedToLibrary(false), 2500);
  };

  const handleAssignProject = async (projectId: string | null) => {
    const convId = item?.conversationId || conversation?.id;
    if (!convId) return;
    const updated = await updateConversationArtifact({
      conversationId: convId,
      projectId,
    });
    if (updated) {
      const proj = projects.find((p) => p.id === projectId);
      setProjectSaveNotice(
        proj
          ? language === 'en'
            ? `Linked to project "${proj.name}"`
            : `Associé au projet « ${proj.name} »`
          : language === 'en'
          ? 'Project link removed'
          : 'Association projet retirée'
      );
      setTimeout(() => setProjectSaveNotice(null), 3000);
    }
  };

  const handleCreateAndLinkProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    setIsCreatingProject(true);
    const created = await createProject({
      name: trimmed,
      description:
        item?.title ||
        conversation?.title ||
        'Projet créé depuis Aura Studio',
      category:
        item?.mode === 'code'
          ? 'web'
          : item?.mode === 'create'
          ? 'content'
          : 'general',
      color: '#078348',
      icon:
        item?.mode === 'code'
          ? 'fa-solid fa-laptop-code'
          : 'fa-solid fa-compass-drafting',
      systemContext: (editableBrief || editableCode).slice(0, 800),
    });
    setIsCreatingProject(false);
    setNewProjectName('');

    if (created) {
      const convId = item?.conversationId || conversation?.id;
      if (convId) {
        await updateConversationArtifact({
          conversationId: convId,
          projectId: created.id,
        });
      }
      setProjectSaveNotice(
        language === 'en'
          ? `Saved in new project "${created.name}"`
          : `Sauvegardé dans le projet « ${created.name} »`
      );
      setTimeout(() => setProjectSaveNotice(null), 3000);
    }
  };

  const triggerIterativePrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || !onIterate || isGenerating) return;
    setIterationInput('');
    await onIterate(trimmed, {
      title: item?.title || conversation?.title,
      mode: item?.mode || activeMode,
      filename: item?.codeArtifact?.filename || (hasCode ? 'index.html' : 'document.md'),
      code: hasCode ? editableCode : undefined,
      content: !hasCode ? editableBrief : undefined,
    });
  };

  const quickIterations = useMemo(() => {
    if (isPreviewableHtml || item?.mode === 'code') {
      return language === 'en'
        ? [
            'Refine layout & mobile responsiveness',
            'Add interactive animations & transitions',
            'Add a dark/light theme switcher',
          ]
        : [
            'Améliorer le design & le responsive mobile',
            'Ajouter des micro-interactions fluides',
            'Ajouter une section interactive supplémentaire',
          ];
    }
    return language === 'en'
      ? [
          'Expand with concrete examples & metrics',
          'Turn this into an interactive HTML prototype',
          'Summarize into an executive action plan',
        ]
      : [
          'Approfondir avec des exemples concrets',
          'Transformer ce livrable en page web interactive HTML',
          'Structurer en plan d’action opérationnel',
        ];
  }, [isPreviewableHtml, item?.mode, language]);

  const linkedProject = projects.find(
    (p) => p.id === conversation?.projectId
  );

  return (
    <aside
      aria-label="Aura Studio — Espace de résultat et d’édition en direct"
      className={`w-full ${
        wideMode
          ? 'lg:w-[580px] xl:w-[740px]'
          : 'lg:w-[470px] xl:w-[560px]'
      } shrink-0 border-l border-[#E8E6DE] dark:border-[#243337] bg-[#FFFDF8] dark:bg-[#152023] flex flex-col h-full select-none transition-all duration-200`}
    >
      {/* 1. Top Studio Header Bar */}
      <div className="px-4 py-3 border-b border-[#E8E6DE] dark:border-[#243337] flex items-center justify-between gap-3 bg-[#FBFAF5]/95 dark:bg-[#111B1E]">
        <div className="flex items-center gap-2.5 min-w-0">
          <AuraLogo
            size="xs"
            variant="symbol"
            animated={isGenerating}
            activityState={isGenerating ? 'generating' : 'idle'}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <h2 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC] truncate">
                Aura Studio
              </h2>
              <span aria-hidden="true" className="text-[#77817F]">
                ·
              </span>
              <span className="text-[11px] text-[#078348] dark:text-[#8CCB4A] font-medium truncate">
                {assistantVersions.length > 0
                  ? `v${activeVersionIndex}/${assistantVersions.length}`
                  : language === 'en'
                  ? 'Live Workspace'
                  : 'Espace interactif'}
              </span>
            </div>
            <p className="text-[11px] text-[#77817F] truncate">
              {item?.title ||
                conversation?.title ||
                (language === 'en'
                  ? 'Live preview, code & iterative creation'
                  : 'Aperçu en direct, code & modification itérative')}
            </p>
          </div>
        </div>

        {/* Action Toolbar: Copy, Download, Save to Library, Wide toggle, Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg border border-[#E8E6DE] dark:border-[#243337] text-xs font-medium text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
            title={language === 'en' ? 'Copy code or content' : 'Copier le code ou contenu'}
          >
            <i
              className={`fa-regular ${
                copied ? 'fa-circle-check text-[#078348]' : 'fa-copy'
              } mr-1`}
            />
            <span>{copied ? (language === 'en' ? 'Copied' : 'Copié') : 'Copier'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg border border-[#E8E6DE] dark:border-[#243337] flex items-center justify-center text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
            title={language === 'en' ? 'Download file' : 'Télécharger le fichier'}
            aria-label="Télécharger le fichier"
          >
            <i className="fa-solid fa-download text-xs" />
          </button>

          <button
            type="button"
            onClick={handleSaveToLibrary}
            disabled={savedToLibrary}
            className={`w-8 h-8 rounded-lg border border-[#E8E6DE] dark:border-[#243337] flex items-center justify-center transition-colors cursor-pointer ${
              savedToLibrary
                ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]'
            }`}
            title={
              language === 'en'
                ? 'Save to Library'
                : 'Sauvegarder dans la Bibliothèque'
            }
            aria-label="Sauvegarder dans la Bibliothèque"
          >
            <i
              className={`${
                savedToLibrary ? 'fa-solid fa-check' : 'fa-regular fa-bookmark'
              } text-xs`}
            />
          </button>

          <button
            type="button"
            onClick={() => setWideMode((prev) => !prev)}
            className="hidden lg:flex w-8 h-8 rounded-lg border border-[#E8E6DE] dark:border-[#243337] items-center justify-center text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
            title={
              wideMode
                ? language === 'en'
                  ? 'Standard width'
                  : 'Largeur standard'
                : language === 'en'
                ? 'Expand Studio width'
                : 'Élargir le panneau Studio'
            }
            aria-label="Basculer la largeur du panneau"
          >
            <i
              className={`fa-solid ${
                wideMode ? 'fa-compress' : 'fa-expand'
              } text-xs`}
            />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E8E6DE] dark:border-[#243337] flex items-center justify-center text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
            title={language === 'en' ? 'Close Aura Studio' : 'Fermer Aura Studio'}
            aria-label="Fermer Aura Studio"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      </div>

      {/* 2. Primary Studio Tabs (Aperçu | Code / Contenu | Sources & Détails) + Viewport Controls */}
      <div className="px-4 py-2.5 border-b border-[#E8E6DE] dark:border-[#243337] flex items-center justify-between gap-2 bg-[#FFFDF8] dark:bg-[#152023]">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EA] dark:bg-[#1B292D]">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#FFFDF8] dark:bg-[#152023] text-[#14282D] dark:text-white shadow-xs'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-white'
            }`}
          >
            <i className="fa-regular fa-eye mr-1.5 text-[11px]" />
            <span>{language === 'en' ? 'Preview' : 'Aperçu'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#FFFDF8] dark:bg-[#152023] text-[#14282D] dark:text-white shadow-xs'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-code mr-1.5 text-[11px]" />
            <span>
              {language === 'en' ? 'Code / Content' : 'Code / Contenu'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'bg-[#FFFDF8] dark:bg-[#152023] text-[#14282D] dark:text-white shadow-xs'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-layer-group mr-1.5 text-[11px]" />
            <span>
              {item?.sources && item.sources.length > 0
                ? language === 'en'
                  ? `Sources (${item.sources.length})`
                  : `Sources (${item.sources.length})`
                : language === 'en'
                ? 'Details & Project'
                : 'Détails & Projet'}
            </span>
          </button>
        </div>

        {/* Viewport Controls when in Preview mode with HTML */}
        {activeTab === 'preview' && (isPreviewableHtml || !item) && (
          <div className="flex items-center gap-1 text-xs text-[#77817F]">
            {(
              [
                { id: 'desktop', icon: 'fa-solid fa-desktop', label: 'Desktop' },
                {
                  id: 'tablet',
                  icon: 'fa-solid fa-tablet-screen-button',
                  label: 'Tablette',
                },
                {
                  id: 'mobile',
                  icon: 'fa-solid fa-mobile-screen-button',
                  label: 'Mobile',
                },
              ] as const
            ).map((vp) => (
              <button
                key={vp.id}
                type="button"
                onClick={() => setViewport(vp.id)}
                title={vp.label}
                aria-label={vp.label}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  viewport === vp.id
                    ? 'bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]'
                    : 'hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]'
                }`}
              >
                <i className={`${vp.icon} text-[11px]`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Main Studio Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 bg-[#FBFAF5] dark:bg-[#0E1618] relative">
        {/* Visible Real-Time Generation Progress Overlay when Aura is building/updating */}
        {isGenerating && (
          <div className="mb-4 p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#078348]/30 shadow-[0_8px_24px_rgba(7,131,72,0.06)]">
            <div className="flex items-center gap-3 mb-3">
              <AuraLogo
                size="sm"
                variant="symbol"
                animated
                activityState="generating"
              />
              <div>
                <p className="font-display font-bold text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC]">
                  {language === 'en'
                    ? 'Aura is building your result...'
                    : 'Aura assemble votre résultat en direct...'}
                </p>
                <p className="text-[11px] text-[#77817F]">
                  {language === 'en'
                    ? 'Live synchronization with Aura Studio'
                    : 'Synchronisation automatique avec l’aperçu Aura Studio'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  fr: 'Analyse de la demande et du contexte actif',
                  en: 'Analyzing prompt and active workspace context',
                },
                {
                  fr:
                    activeMode === 'search'
                      ? 'Vérification des sources web et extraction des données'
                      : activeMode === 'code'
                      ? 'Génération de l’architecture HTML / CSS / JS interactive'
                      : 'Structuration du livrable et mise en forme éditoriale',
                  en:
                    activeMode === 'search'
                      ? 'Verifying web sources and extracting key findings'
                      : activeMode === 'code'
                      ? 'Generating interactive HTML / CSS / JS architecture'
                      : 'Structuring deliverable and editorial layout',
                },
                {
                  fr: 'Assemblage et rafraîchissement de l’aperçu Aura Studio',
                  en: 'Assembling and refreshing live Aura Studio preview',
                },
              ].map((step, sIdx) => {
                const isDone = generationStep > sIdx;
                const isCurrent = generationStep === sIdx;
                return (
                  <div
                    key={sIdx}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-[#EAF2E2]/80 dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                        : isDone
                        ? 'text-[#14282D] dark:text-[#F3F2EC]'
                        : 'text-[#77817F] opacity-60'
                    }`}
                  >
                    {isDone ? (
                      <i className="fa-solid fa-circle-check text-[#078348] dark:text-[#8CCB4A] text-xs" />
                    ) : isCurrent ? (
                      <i className="fa-solid fa-circle-notch fa-spin text-[#FF790D] text-xs" />
                    ) : (
                      <i className="fa-regular fa-circle text-[10px]" />
                    )}
                    <span>{language === 'en' ? step.en : step.fr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 1: APERÇU (Live HTML Sandbox OR Rich Structured Deliverable Document) */}
        {activeTab === 'preview' && (
          <>
            {isPreviewableHtml || !item ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[380px]">
                <div
                  className={`h-full min-h-[380px] rounded-2xl overflow-hidden border border-[#E8E6DE] dark:border-[#243337] bg-white shadow-sm transition-all duration-200 flex flex-col ${
                    viewport === 'mobile'
                      ? 'w-[340px] max-w-full'
                      : viewport === 'tablet'
                      ? 'w-[440px] max-w-full'
                      : 'w-full'
                  }`}
                >
                  {/* Simulated Browser / Preview Bar */}
                  <div className="px-3 py-2 bg-[#F4F2EA] border-b border-[#E8E6DE] flex items-center justify-between gap-2 text-[11px] text-[#77817F]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#078348]/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EACB37]/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF790D]/80" />
                      <span className="ml-1.5 font-mono truncate text-[#14282D]">
                        aura-studio://preview/{item?.codeArtifact?.filename || 'index.html'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIframeKey((k) => k + 1)}
                        className="hover:text-[#14282D] transition-colors cursor-pointer"
                        title={
                          language === 'en'
                            ? 'Reload live preview'
                            : 'Rafraîchir l’aperçu en direct'
                        }
                      >
                        <i className="fa-solid fa-rotate-right text-[11px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('code')}
                        className="text-[#078348] font-semibold hover:underline cursor-pointer"
                      >
                        {language === 'en' ? 'Edit code' : 'Éditer le code'}
                      </button>
                    </div>
                  </div>

                  <iframe
                    key={iframeKey}
                    title="Aperçu en direct Aura Studio"
                    srcDoc={hasCode ? editableCode : DEFAULT_STUDIO_HTML}
                    sandbox="allow-scripts"
                    className="w-full flex-1 min-h-[340px] border-0 bg-white"
                  />
                </div>
              </div>
            ) : (
              /* Structured Deliverable / Document / Search Report / Code Snippet View */
              <div className="flex-1 flex flex-col space-y-4">
                {/* Creative Brief Summary Header if available */}
                {item.creativeArtifact && (
                  <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                        {item.creativeArtifact.category} · Direction Créative
                      </span>
                      {item.creativeArtifact.palette && (
                        <div className="flex items-center gap-1.5">
                          {item.creativeArtifact.palette.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(hex);
                                setCopiedHex(hex);
                                setTimeout(() => setCopiedHex(null), 1500);
                              }}
                              title={`Copier ${hex}`}
                              className="w-5 h-5 rounded-full border border-black/15 transition-transform hover:scale-110 cursor-pointer"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                          {copiedHex && (
                            <span className="text-[10px] font-mono text-[#078348] dark:text-[#8CCB4A]">
                              {copiedHex}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                      {item.creativeArtifact.title}
                    </h3>
                    <p className="text-xs text-[#5C6664] dark:text-[#94A09E] leading-relaxed">
                      {item.creativeArtifact.summary}
                    </p>
                  </div>
                )}

                {/* Verified Web Sources Banner if Search Mode */}
                {item.sources && item.sources.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-check" />
                        <span>
                          {language === 'en'
                            ? `${item.sources.length} Verified Web Sources`
                            : `${item.sources.length} Sources web vérifiées`}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className="text-[11px] font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-white cursor-pointer"
                      >
                        {language === 'en' ? 'Inspect all →' : 'Tout inspecter →'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.sources.slice(0, 4).map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348] transition-colors flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate font-medium text-[#14282D] dark:text-[#F3F2EC]">
                            {src.title}
                          </span>
                          <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#77817F] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Non-HTML Code Artifact Preview Card */}
                {hasCode && !isPreviewableHtml && (
                  <div className="rounded-2xl overflow-hidden border border-[#223236] bg-[#101B1E] text-[#E6ECEA]">
                    <div className="px-4 py-2 bg-[#162428] border-b border-[#223236] flex items-center justify-between text-xs text-[#94A09E]">
                      <span className="font-mono">
                        {item.codeArtifact?.filename || 'snippet.ts'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('code')}
                        className="text-[#8CCB4A] hover:underline font-medium cursor-pointer"
                      >
                        {language === 'en' ? 'Open in editor →' : 'Éditer le fichier →'}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed max-h-[300px]">
                      <code>{editableCode}</code>
                    </pre>
                  </div>
                )}

                {/* Structured Deliverable Canvas */}
                <div className="flex-1 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E6DE]/70 dark:border-[#243337]">
                    <span className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      {language === 'en'
                        ? 'Structured Deliverable'
                        : 'Livrable structuré Aura Studio'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const mdIndex = virtualFiles.findIndex((f) =>
                          f.path.endsWith('.md')
                        );
                        if (mdIndex !== -1) setSelectedFileIndex(mdIndex);
                        setActiveTab('code');
                      }}
                      className="text-xs font-medium text-[#078348] dark:text-[#8CCB4A] hover:underline cursor-pointer"
                    >
                      <i className="fa-regular fa-pen-to-square mr-1" />
                      <span>
                        {language === 'en' ? 'Edit content' : 'Modifier le texte'}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-[13.5px] leading-relaxed text-[#14282D] dark:text-[#F3F2EC] whitespace-pre-wrap">
                    {editableBrief || item.rawContent}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CODE / CONTENU (Bolt-Inspired File Explorer + Live Code/Markdown Editor) */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[#223236] bg-[#101B1E] text-[#E6ECEA] min-h-[390px]">
            {/* File Tabs / Explorer Bar */}
            <div className="px-3 py-2 bg-[#162428] border-b border-[#223236] flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 min-w-0">
                {virtualFiles.map((file, idx) => {
                  const isSelected = idx === selectedFileIndex;
                  const icon = file.path.endsWith('.html')
                    ? 'fa-brands fa-html5 text-[#FF790D]'
                    : file.path.endsWith('.css')
                    ? 'fa-brands fa-css3-alt text-[#38BDF8]'
                    : file.path.endsWith('.js') || file.path.endsWith('.ts')
                    ? 'fa-solid fa-code text-[#EACB37]'
                    : file.path.endsWith('.json')
                    ? 'fa-solid fa-brackets-curly text-[#8CCB4A]'
                    : 'fa-regular fa-file-lines text-[#8CCB4A]';

                  return (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#22363C] text-white font-semibold'
                          : 'text-[#94A09E] hover:text-white hover:bg-[#1B2C31]'
                      }`}
                    >
                      <i className={`${icon} text-[11px]`} />
                      <span>{file.path}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(item?.conversationId || conversation?.id) && item?.messageId && (
                  <button
                    type="button"
                    disabled={isPersistingEdit}
                    onClick={handlePersistStudioChanges}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#078348] hover:bg-[#066e3c] text-white text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <i
                      className={`fa-solid ${
                        editPersisted ? 'fa-check' : 'fa-floppy-disk'
                      } text-[10px]`}
                    />
                    <span>
                      {editPersisted
                        ? language === 'en'
                          ? 'Saved ✓'
                          : 'Enregistré ✓'
                        : language === 'en'
                        ? 'Save edits'
                        : 'Sauvegarder'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="text-xs text-[#8CCB4A] hover:underline font-medium cursor-pointer whitespace-nowrap"
                >
                  {language === 'en' ? 'Preview →' : 'Voir l’aperçu →'}
                </button>
              </div>
            </div>

            {/* Editor Body with Line Count */}
            <div className="flex-1 flex min-h-[340px] relative">
              <div
                aria-hidden="true"
                className="py-4 px-2.5 bg-[#0D1619] border-r border-[#1C2B2F] text-right font-mono text-[11px] leading-relaxed text-[#526367] select-none hidden sm:block"
              >
                {(activeFile?.content || '')
                  .split('\n')
                  .slice(0, 120)
                  .map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
              </div>
              <textarea
                value={activeFile?.content || ''}
                onChange={(e) => handleFileContentChange(e.target.value)}
                spellCheck={false}
                aria-label={`Éditeur de fichier ${activeFile?.path || 'Aura Studio'}`}
                className="flex-1 w-full p-4 bg-transparent font-mono text-xs leading-relaxed text-[#E6ECEA] focus:outline-none resize-none min-h-[340px]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: SOURCES & DÉTAILS (Iterations History, Project Persistence, Grounding Sources) */}
        {activeTab === 'details' && (
          <div className="flex-1 space-y-4">
            {/* Section A: Save / Link Creation to a Real Aura Project */}
            <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-folder-open text-[#078348] dark:text-[#8CCB4A] text-sm" />
                  <h3 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                    {language === 'en'
                      ? 'Project Persistence'
                      : 'Persistance dans un Projet Aura'}
                  </h3>
                </div>
                {linkedProject && (
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {linkedProject.name}
                  </span>
                )}
              </div>

              {projectSaveNotice && (
                <div className="px-3 py-2 rounded-xl bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-medium flex items-center gap-2">
                  <i className="fa-solid fa-circle-check" />
                  <span>{projectSaveNotice}</span>
                </div>
              )}

              {projects.length > 0 && (conversation?.id || item?.conversationId) && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#77817F]">
                    {language === 'en'
                      ? 'Assign to an existing project:'
                      : 'Associer à un projet existant :'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {projects.map((proj) => {
                      const isLinked = conversation?.projectId === proj.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() =>
                            handleAssignProject(isLinked ? null : proj.id)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isLinked
                              ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A]'
                              : 'bg-[#FBFAF5] dark:bg-[#1B292D] border-[#E8E6DE] dark:border-[#243337] text-[#14282D] dark:text-[#F3F2EC] hover:border-[#078348]/40'
                          }`}
                        >
                          <i className={proj.icon} style={{ color: proj.color }} />
                          <span>{proj.name}</span>
                          {isLinked && <i className="fa-solid fa-check text-[10px]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateAndLinkProject} className="pt-1 flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'New project name (e.g. SaaS Launch)...'
                      : 'Nom d’un nouveau projet (ex: Site E-commerce)...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] text-xs text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#078348]"
                />
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isCreatingProject}
                  className="px-3.5 py-2 rounded-xl bg-[#078348] hover:bg-[#066e3c] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                >
                  {isCreatingProject
                    ? '...'
                    : language === 'en'
                    ? 'Create & Save'
                    : 'Créer & Sauvegarder'}
                </button>
              </form>
            </div>

            {/* Section B: Conversation Version / Iteration History (v1, v2, v3...) */}
            {assistantVersions.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                    {language === 'en'
                      ? 'Iterations in this conversation'
                      : 'Historique des itérations'}
                  </h3>
                  <span className="text-xs text-[#77817F]">
                    {assistantVersions.length}{' '}
                    {assistantVersions.length > 1 ? 'versions' : 'version'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {assistantVersions.map((verMsg, idx) => {
                    const isCurrentVersion =
                      item?.messageId === verMsg.id ||
                      (!item?.messageId && idx === assistantVersions.length - 1);
                    return (
                      <button
                        key={verMsg.id}
                        type="button"
                        onClick={() => {
                          if (onSelectVersion) {
                            onSelectVersion(verMsg);
                            setActiveTab('preview');
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrentVersion
                            ? 'bg-[#EAF2E2]/80 dark:bg-[#182E24] border-[#078348]/40 text-[#14282D] dark:text-[#F3F2EC]'
                            : 'bg-[#FBFAF5] dark:bg-[#1B292D] border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348]/35 text-[#5A6562] dark:text-[#94A09E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-[#14282D] text-white font-mono text-[11px] font-bold shrink-0">
                            v{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-[#14282D] dark:text-[#F3F2EC]">
                              {verMsg.codeArtifact?.filename ||
                                verMsg.creativeArtifact?.title ||
                                verMsg.content.slice(0, 48)}
                            </p>
                            <p className="text-[11px] text-[#77817F]">
                              {new Date(verMsg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              · {verMsg.mode.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-medium text-[#078348] dark:text-[#8CCB4A] shrink-0">
                          {isCurrentVersion
                            ? language === 'en'
                              ? 'Active'
                              : 'Affichée'
                            : language === 'en'
                            ? 'Restore'
                            : 'Afficher'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section C: Verified Web Sources & Generation Metadata */}
            <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] space-y-3">
              <h3 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                {language === 'en'
                  ? 'Verified Sources & Execution Details'
                  : 'Sources vérifiées & Détails de génération'}
              </h3>

              {item?.sources && item.sources.length > 0 ? (
                <div className="space-y-2">
                  {item.sources.map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2.5 p-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] truncate">
                          {src.title}
                        </p>
                        <p className="text-[11px] text-[#078348] dark:text-[#8CCB4A] truncate">
                          {src.uri}
                        </p>
                      </div>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#77817F] mt-1 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#77817F]">
                  {language === 'en'
                    ? 'Switch to "Search" mode in the composer to attach verified Google Search Grounding web sources to your creations.'
                    : 'Utilisez le mode « Recherche » dans le champ de prompt pour ancrer vos résultats sur des sources web vérifiées en direct.'}
                </p>
              )}

              <div className="pt-2 border-t border-[#E8E6DE]/70 dark:border-[#243337] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#77817F] tabular-nums">
                <span>
                  {language === 'en' ? 'Mode:' : 'Mode :'}{' '}
                  <strong className="text-[#14282D] dark:text-[#F3F2EC]">
                    {(item?.mode || activeMode).toUpperCase()}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {language === 'en' ? 'Model:' : 'Modèle :'}{' '}
                  <strong className="text-[#14282D] dark:text-[#F3F2EC]">
                    {item?.modelId || 'gemini-3.8-flash'}
                  </strong>
                </span>
                {item?.estimatedTokens && (
                  <>
                    <span>·</span>
                    <span>~{item.estimatedTokens} tokens</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Iterative Refinement Bar ("Modification itérative en direct") */}
      {onIterate && (
        <div className="p-3.5 border-t border-[#E8E6DE] dark:border-[#243337] bg-[#FFFDF8] dark:bg-[#152023] space-y-2.5">
          {/* Quick 1-Click Iteration Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {quickIterations.map((qText) => (
              <button
                key={qText}
                type="button"
                disabled={isGenerating}
                onClick={() => triggerIterativePrompt(qText)}
                className="px-2.5 py-1 rounded-lg bg-[#F4F2EA] dark:bg-[#1B292D] hover:bg-[#EAF2E2] dark:hover:bg-[#182E24] text-[11px] font-medium text-[#3D4A47] dark:text-[#F3F2EC] hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[10px] mr-1 text-[#078348] dark:text-[#8CCB4A]" />
                <span>{qText}</span>
              </button>
            ))}
          </div>

          {/* Direct Iterative Prompt Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerIterativePrompt(iterationInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={iterationInput}
              onChange={(e) => setIterationInput(e.target.value)}
              disabled={isGenerating}
              placeholder={
                language === 'en'
                  ? 'Ask Aura to modify or refine this result...'
                  : 'Demander une modification sur ce résultat (ex: ajoute une section, change le style)...'
              }
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-xs text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#8F9693] focus:outline-none focus:border-[#078348]"
            />
            <button
              type="submit"
              disabled={!iterationInput.trim() || isGenerating}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-95 disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1.5"
              style={{
                background:
                  'linear-gradient(135deg, #078348 0%, #8CCB4A 48%, #EACB37 78%, #FF790D 100%)',
              }}
            >
              <span>{language === 'en' ? 'Iterate' : 'Affiner'}</span>
              <i className="fa-solid fa-arrow-up text-[10px]" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
