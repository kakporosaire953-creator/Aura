import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StudioFileExplorer } from '../../components/studio/StudioFileExplorer';
import { StudioCodeEditor } from '../../components/studio/StudioCodeEditor';
import {
  StudioPreviewFrame,
  StudioViewport,
  STUDIO_VIEWPORTS,
} from '../../components/studio/StudioPreviewFrame';
import { StudioIterateBar } from '../../components/studio/StudioIterateBar';
import { studioApi, StudioApiError } from '../../services/studioService';
import { useAura } from '../../context/AuraContext';
import type { StudioProject, VirtualStudioFile } from '../../shared/types.ts';
import { composePreviewHtml, validateStudioProject } from '../../shared/studio.ts';

type MobileTab = 'files' | 'code' | 'preview';

export const StudioDevelopPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { theme } = useAura();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [files, setFiles] = useState<VirtualStudioFile[]>([]);
  const [activePath, setActivePath] = useState<string>('index.html');
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [buildStatus, setBuildStatus] = useState<{ ok: boolean; error?: string } | null>(null);
  const [viewport, setViewport] = useState<StudioViewport>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('code');
  const [iterateOpen, setIterateOpen] = useState(false);
  const filesRef = useRef<VirtualStudioFile[]>([]);
  filesRef.current = files;

  const load = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await studioApi.get(projectId);
      setProject(res.project);
      setFiles(res.project.files);
      const first = res.project.files.find((f) => f.path === 'index.html') || res.project.files[0];
      if (first) setActivePath(first.path);
      setDirty(new Set());
      setBuildStatus(
        res.project.lastBuildStatus === 'ok'
          ? { ok: true }
          : res.project.lastBuildStatus === 'failed'
            ? { ok: false, error: res.project.lastBuildError }
            : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Projet introuvable.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activePath),
    [files, activePath]
  );

  const previewHtml = useMemo(() => composePreviewHtml(files), [files]);

  const handleEditorChange = (next: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === activePath ? { ...f, content: next } : f))
    );
    setDirty((prev) => {
      const n = new Set(prev);
      n.add(activePath);
      return n;
    });
    setBuildStatus(null);
  };

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    setIsSaving(true);
    try {
      const res = await studioApi.saveFiles(projectId, filesRef.current, 'Sauvegarde Developer Mode');
      setProject(res.project);
      setFiles(res.project.files);
      setDirty(new Set());
      setBuildStatus(res.build);
      setRefreshKey((k) => k + 1);
      setNotice(
        res.build.ok
          ? 'Modifications sauvegardées et compilation validée.'
          : `Sauvegardé, mais compilation : ${res.build.error}`
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde impossible.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  const handleCreateFile = (path: string) => {
    const clean = path.replace(/^\/+/, '');
    if (files.some((f) => f.path === clean)) {
      setError(`Le fichier « ${clean} » existe déjà.`);
      return;
    }
    const ext = clean.split('.').pop()?.toLowerCase() || 'txt';
    const langMap: Record<string, string> = {
      html: 'html',
      css: 'css',
      js: 'javascript',
      ts: 'typescript',
      json: 'json',
      md: 'markdown',
      svg: 'svg',
    };
    setFiles((prev) => [
      ...prev,
      { path: clean, language: langMap[ext] || 'text', content: '' },
    ]);
    setActivePath(clean);
    setDirty((prev) => new Set(prev).add(clean));
  };

  const handleDeleteFile = (path: string) => {
    if (path === 'index.html') {
      setError('index.html est requis pour la compilation du projet.');
      return;
    }
    setFiles((prev) => prev.filter((f) => f.path !== path));
    setDirty((prev) => {
      const n = new Set(prev);
      n.add('__deleted__');
      return n;
    });
    if (activePath === path) {
      const next = files.find((f) => f.path !== path);
      if (next) setActivePath(next.path);
    }
  };

  const handleRenameFile = (path: string, nextPath: string) => {
    const clean = nextPath.replace(/^\/+/, '');
    if (files.some((f) => f.path === clean && f.path !== path)) {
      setError(`Le fichier « ${clean} » existe déjà.`);
      return;
    }
    setFiles((prev) =>
      prev.map((f) =>
        f.path === path
          ? { ...f, path: clean, language: clean.split('.').pop() || f.language }
          : f
      )
    );
    if (activePath === path) setActivePath(clean);
    setDirty((prev) => new Set(prev).add(clean));
  };

  const handleBuild = async () => {
    if (!projectId) return;
    // Validation locale immédiate, puis statut serveur persistant
    const local = validateStudioProject(filesRef.current);
    setBuildStatus(local);
    if (dirty.size > 0) {
      const saved = await saveAll();
      if (!saved) return;
    } else {
      try {
        const res = await studioApi.build(projectId);
        setBuildStatus(res.build);
        setProject(res.project);
        setNotice(res.build.ok ? 'Compilation validée.' : `Compilation : ${res.build.error}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Compilation impossible.');
      }
    }
    setRefreshKey((k) => k + 1);
  };

  const handleIterate = async (instruction: string) => {
    if (!projectId || isIterating) return;
    setIsIterating(true);
    if (dirty.size > 0) {
      await saveAll();
    }
    const opId = `iter-dev-${Date.now()}`;
    try {
      const res = await studioApi.iterate(projectId, instruction, opId);
      setProject(res.project);
      setFiles(res.project.files);
      setDirty(new Set());
      setBuildStatus(res.build);
      setRefreshKey((k) => k + 1);
      setNotice('Modification IA appliquée et sauvegardée.');
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Modification impossible.');
    } finally {
      setIsIterating(false);
    }
  };

  // Ctrl+S / Cmd+S global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveAll]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F6EF] dark:bg-[#0E1618]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E8E6DE] border-t-[#078348]" />
        <p className="text-[12px] text-[#77817F]">Ouverture du Developer Mode…</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F6EF] px-6 dark:bg-[#0E1618]">
        <i className="fa-solid fa-triangle-exclamation text-3xl text-[#FF790D]" />
        <p className="max-w-md text-center text-sm text-[#77817F]">{error}</p>
        <Link
          to="/app/studio"
          className="rounded-full bg-[#078348] px-5 py-2.5 text-[12px] font-semibold text-white"
        >
          Retour à la galerie
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F6EF] dark:bg-[#0E1618]">
      {/* Barre Developer Mode */}
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[#E8E6DE] bg-[#FFFDF8] px-3 py-2.5 dark:border-[#243337] dark:bg-[#152023]">
        <Link
          to={`/app/studio/${projectId}/preview`}
          className="flex h-8 items-center gap-1.5 rounded-full border border-[#E8E6DE] px-3 text-[11px] font-semibold text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
        >
          <i className="fa-solid fa-arrow-left text-[9px]" />
          Aperçu
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[12.5px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
            {project?.name}
          </span>
          <span className="rounded-full bg-[#14282D] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.12em] text-[#8CCB4A] dark:bg-[#F3F2EC] dark:text-[#078348]">
            Developer Mode
          </span>
          {dirty.size > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF3D9] px-2 py-[3px] text-[9.5px] font-bold text-[#A16207] dark:bg-[#2A2614] dark:text-[#EACB37]">
              <i className="fa-solid fa-circle text-[6px]" />
              {dirty.size} modification{dirty.size > 1 ? 's' : ''} non sauvegardée
              {dirty.size > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleBuild()}
            className="flex h-8 items-center gap-1.5 rounded-full border border-[#E8E6DE] px-3 text-[11px] font-semibold text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
            title="Valider et recompiler le projet"
          >
            <i className="fa-solid fa-hammer text-[9px]" />
            Compiler
          </button>
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={isSaving || dirty.size === 0}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#078348] px-3.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#066B3A] disabled:cursor-not-allowed disabled:opacity-45"
            title="Sauvegarder (Ctrl+S)"
          >
            <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'} text-[9px]`} />
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={() => setIterateOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-[#078348] via-[#8CCB4A] to-[#FF790D] px-3 text-[11px] font-semibold text-white"
            title="Modifier avec l’IA"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[9px]" />
            IA
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] lg:flex dark:border-[#243337]"
            title={previewOpen ? 'Masquer l’aperçu' : 'Afficher l’aperçu'}
          >
            <i className={`fa-solid ${previewOpen ? 'fa-angles-right' : 'fa-angles-left'}`} />
          </button>
        </div>
      </header>

      {/* Bandeaux */}
      {notice && (
        <div className="border-b border-[#C9E2B6] bg-[#EEF5E4] px-4 py-2 text-[11.5px] text-[#078348] dark:border-[#24402C] dark:bg-[#182E24] dark:text-[#8CCB4A]">
          <i className="fa-solid fa-circle-info mr-1.5" />
          {notice}
        </div>
      )}
      {error && project && (
        <div className="flex items-center justify-between gap-3 border-b border-[#F0C9A8] bg-[#FCEBDD] px-4 py-2 text-[11.5px] text-[#C2410C] dark:border-[#4A2B18] dark:bg-[#2B1B12] dark:text-[#FF790D]">
          <span>
            <i className="fa-solid fa-triangle-exclamation mr-1.5" />
            {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="font-semibold underline">
            Masquer
          </button>
        </div>
      )}
      {buildStatus && !buildStatus.ok && buildStatus.error && (
        <div className="border-b border-[#E8E6DE] bg-[#FBF3D9] px-4 py-2 text-[11px] text-[#A16207] dark:border-[#243337] dark:bg-[#2A2614] dark:text-[#EACB37]">
          <i className="fa-solid fa-screwdriver-wrench mr-1.5" />
          Diagnostics de compilation : {buildStatus.error} — la dernière version
          fonctionnelle est conservée dans l’historique.
        </div>
      )}

      {/* Onglets mobiles */}
      <div className="flex shrink-0 border-b border-[#E8E6DE] lg:hidden dark:border-[#243337]">
        {(
          [
            { id: 'files', label: 'Fichiers', icon: 'fa-solid fa-folder-tree' },
            { id: 'code', label: 'Code', icon: 'fa-solid fa-code' },
            { id: 'preview', label: 'Aperçu', icon: 'fa-solid fa-eye' },
          ] as { id: MobileTab; label: string; icon: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold ${
              mobileTab === tab.id
                ? 'border-b-2 border-[#078348] text-[#078348] dark:text-[#8CCB4A]'
                : 'text-[#77817F]'
            }`}
          >
            <i className={`${tab.icon} text-[10px]`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Composition trois panneaux */}
      <div className="flex min-h-0 flex-1">
        {/* Explorateur de fichiers */}
        <aside
          className={`w-full shrink-0 border-r border-[#E8E6DE] bg-[#FFFDF8] dark:border-[#243337] dark:bg-[#152023] lg:block lg:w-[230px] ${
            mobileTab === 'files' ? 'block' : 'hidden'
          }`}
        >
          <StudioFileExplorer
            files={files}
            activePath={activePath}
            onSelect={(p) => {
              setActivePath(p);
              setMobileTab('code');
            }}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        </aside>

        {/* Éditeur */}
        <section
          className={`min-w-0 flex-1 flex-col lg:flex ${
            mobileTab === 'code' ? 'flex' : 'hidden'
          }`}
        >
          {/* Onglet de fichier actif */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#E8E6DE] bg-[#FBFAF5] px-3 py-1.5 dark:border-[#243337] dark:bg-[#1B292D]">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#078348] shadow-sm dark:bg-[#152023] dark:text-[#8CCB4A]">
              <i className="fa-regular fa-file-code text-[9px]" />
              {activePath}
              {dirty.has(activePath) && <span className="text-[#FF790D]">●</span>}
            </span>
            <span className="ml-auto text-[9.5px] text-[#9AA5A3]">
              Ctrl+S pour sauvegarder
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#0E1618]">
            {activeFile ? (
              <StudioCodeEditor
                path={activeFile.path}
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleEditorChange}
                onSave={() => void saveAll()}
                dark={theme === 'dark'}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-[#77817F]">
                Sélectionnez un fichier dans l’explorateur.
              </div>
            )}
          </div>
        </section>

        {/* Aperçu en direct */}
        {previewOpen && (
          <section
            className={`w-full shrink-0 flex-col border-l border-[#E8E6DE] bg-[#F1EFE6] dark:border-[#243337] dark:bg-[#0A1113] lg:flex lg:w-[46%] xl:w-[48%] ${
              mobileTab === 'preview' ? 'flex' : 'hidden'
            }`}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-[#E8E6DE] bg-[#FFFDF8] px-3 py-1.5 dark:border-[#243337] dark:bg-[#152023]">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#77817F]">
                <i
                  className={`fa-solid ${buildStatus?.ok === false ? 'fa-circle-xmark text-[#C2410C]' : 'fa-circle-check text-[#078348]'} text-[9px]`}
                />
                {buildStatus?.ok === false ? 'Erreur de compilation' : 'Aperçu en direct'}
              </span>
              <div className="ml-auto flex overflow-hidden rounded-full border border-[#E8E6DE] dark:border-[#243337]">
                {(Object.keys(STUDIO_VIEWPORTS) as StudioViewport[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setViewport(v)}
                    title={`${STUDIO_VIEWPORTS[v].label} (${STUDIO_VIEWPORTS[v].width}×${STUDIO_VIEWPORTS[v].height})`}
                    className={`flex h-6 w-8 items-center justify-center text-[9.5px] ${
                      viewport === v
                        ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                        : 'text-[#77817F]'
                    }`}
                  >
                    <i className={STUDIO_VIEWPORTS[v].icon} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Rafraîchir"
                className="flex h-6 w-6 items-center justify-center rounded-full text-[9.5px] text-[#77817F] hover:text-[#078348]"
              >
                <i className="fa-solid fa-rotate-right" />
              </button>
            </div>
            <StudioPreviewFrame
              files={[]}
              previewHtml={previewHtml}
              viewport={viewport}
              refreshKey={refreshKey}
              title="Aperçu en direct du projet"
              className="min-h-0 flex-1"
            />
          </section>
        )}
      </div>

      {/* Édition IA contextualisée */}
      {iterateOpen && (
        <div className="shrink-0 border-t border-[#E8E6DE] bg-[#FFFDF8] px-4 py-3 dark:border-[#243337] dark:bg-[#152023]">
          <div className="mx-auto max-w-3xl">
            <StudioIterateBar
              onSubmit={(instruction) => void handleIterate(instruction)}
              isBusy={isIterating}
              compact
              placeholder={`Modifier le projet (fichier actif : ${activePath})…`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
