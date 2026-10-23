import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  StudioPreviewFrame,
  StudioViewport,
  STUDIO_VIEWPORTS,
} from '../../components/studio/StudioPreviewFrame';
import { StudioIterateBar } from '../../components/studio/StudioIterateBar';
import { studioApi, StudioApiError } from '../../services/studioService';
import { useAura } from '../../context/AuraContext';
import type { StudioProject, StudioProjectVersion } from '../../shared/types.ts';
import { composePreviewHtml } from '../../shared/studio.ts';

export const StudioPreviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAura();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<StudioViewport>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [iterateOpen, setIterateOpen] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const iterateOpId = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await studioApi.get(projectId);
      setProject(res.project);
      setPreviewHtml(res.previewHtml || composePreviewHtml(res.project.files));
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
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleIterate = async (instruction: string) => {
    if (!projectId || isIterating) return;
    setIsIterating(true);
    setSaveState('saving');
    const opId = `iter-${Date.now()}`;
    iterateOpId.current = opId;
    try {
      const res = await studioApi.iterate(projectId, instruction, opId);
      setProject(res.project);
      setPreviewHtml(res.previewHtml);
      setRefreshKey((k) => k + 1);
      setSaveState('saved');
      setNotice(
        res.build.ok
          ? 'Modification appliquée et sauvegardée.'
          : `Modification sauvegardée, mais compilation : ${res.build.error}`
      );
    } catch (err) {
      setSaveState('error');
      setError(
        err instanceof StudioApiError
          ? err.message
          : 'La modification a échoué.'
      );
    } finally {
      setIsIterating(false);
      iterateOpId.current = null;
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!projectId) return;
    try {
      const res = await studioApi.restoreVersion(projectId, versionId);
      setProject(res.project);
      setPreviewHtml(res.previewHtml || composePreviewHtml(res.project.files));
      setRefreshKey((k) => k + 1);
      setVersionsOpen(false);
      setNotice('Version restaurée.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restauration impossible.');
    }
  };

  const handleExport = async () => {
    if (!project) return;
    try {
      await studioApi.exportZip(project.id, project.name);
      setNotice('Archive ZIP exportée (fichiers réels du projet).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export impossible.');
    }
  };

  const openInNewTab = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setNotice('Aperçu ouvert dans un nouvel onglet (fichier isolé).');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F6EF] dark:bg-[#0E1618]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E8E6DE] border-t-[#078348]" />
        <p className="text-[12px] text-[#77817F]">Chargement de l’aperçu…</p>
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
      {/* Barre d’outils flottante minimale */}
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[#E8E6DE] bg-[#FFFDF8]/95 px-3 py-2.5 backdrop-blur-md dark:border-[#243337] dark:bg-[#152023]/95">
        <Link
          to="/app/studio"
          className="flex h-8 items-center gap-1.5 rounded-full border border-[#E8E6DE] px-3 text-[11px] font-semibold text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#9AA5A3]"
        >
          <i className="fa-solid fa-arrow-left text-[9px]" />
          Galerie
        </Link>

        <div className="mx-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[12.5px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
            {project?.name}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[9.5px] font-bold ${
              saveState === 'saved'
                ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                : saveState === 'saving'
                  ? 'bg-[#FBF3D9] text-[#A16207] dark:bg-[#2A2614] dark:text-[#EACB37]'
                  : saveState === 'error'
                    ? 'bg-[#FCEBDD] text-[#C2410C] dark:bg-[#2B1B12] dark:text-[#FF790D]'
                    : 'bg-[#EFEEF6] text-[#5B6664] dark:bg-[#1B292D]'
            }`}
          >
            <i
              className={`fa-solid ${
                saveState === 'saved'
                  ? 'fa-circle-check'
                  : saveState === 'saving'
                    ? 'fa-spinner fa-spin'
                    : saveState === 'error'
                      ? 'fa-triangle-exclamation'
                      : 'fa-circle'
              } text-[8px]`}
            />
            {saveState === 'saved'
              ? 'Sauvegardé'
              : saveState === 'saving'
                ? 'Génération…'
                : saveState === 'error'
                  ? 'Échec'
                  : 'Non sauvegardé'}
          </span>
        </div>

        {/* Viewports réels */}
        <div className="flex overflow-hidden rounded-full border border-[#E8E6DE] dark:border-[#243337]">
          {(Object.keys(STUDIO_VIEWPORTS) as StudioViewport[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewport(v)}
              title={`${STUDIO_VIEWPORTS[v].label} (${STUDIO_VIEWPORTS[v].width}×${STUDIO_VIEWPORTS[v].height})`}
              className={`flex h-8 w-9 items-center justify-center text-[11px] transition-colors ${
                viewport === v
                  ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                  : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
              }`}
            >
              <i className={STUDIO_VIEWPORTS[v].icon} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Rafraîchir l’aperçu"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
          >
            <i className="fa-solid fa-rotate-right" />
          </button>
          <button
            type="button"
            onClick={openInNewTab}
            title="Ouvrir dans un nouvel onglet (fichier isolé)"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" />
          </button>
          <button
            type="button"
            onClick={() => setVersionsOpen(true)}
            title="Historique des versions"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
          >
            <i className="fa-solid fa-clock-rotate-left" />
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            title="Exporter le projet (ZIP)"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
          >
            <i className="fa-solid fa-file-arrow-down" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title="Changer de thème"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E6DE] text-[11px] text-[#77817F] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337]"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/app/studio/${projectId}/develop`)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#14282D] px-3.5 text-[11px] font-semibold text-[#F3F2EC] transition-colors hover:bg-[#1F3A41] dark:bg-[#F3F2EC] dark:text-[#14282D]"
          >
            <i className="fa-solid fa-code text-[9px]" />
            Developer Mode
          </button>
          <button
            type="button"
            onClick={() => setIterateOpen((v) => !v)}
            title="Modifier avec l’IA"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#078348] via-[#8CCB4A] to-[#FF790D] text-[11px] text-white shadow-[0_6px_18px_rgba(7,131,72,0.28)]"
          >
            <i className="fa-solid fa-wand-magic-sparkles" />
          </button>
        </div>
      </header>

      {/* Bandeaux d’état */}
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
      {project && project.status === 'failed' && (
        <div className="border-b border-[#F0C9A8] bg-[#FCEBDD] px-4 py-2 text-[11.5px] text-[#C2410C] dark:border-[#4A2B18] dark:bg-[#2B1B12] dark:text-[#FF790D]">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          La dernière génération de ce projet a échoué. L’aperçu affiche la dernière
          version sauvegardée — utilisez « Modifier avec l’IA » pour relancer une
          génération.
        </div>
      )}
      {project && project.lastBuildStatus === 'failed' && project.lastBuildError && (
        <div className="border-b border-[#E8E6DE] bg-[#FBF3D9] px-4 py-2 text-[11px] text-[#A16207] dark:border-[#243337] dark:bg-[#2A2614] dark:text-[#EACB37]">
          <i className="fa-solid fa-screwdriver-wrench mr-1.5" />
          Dernière compilation : {project.lastBuildError}
        </div>
      )}

      {/* Zone d’aperçu immersive */}
      <main className="relative min-h-0 flex-1">
        <StudioPreviewFrame
          files={project?.files || []}
          previewHtml={previewHtml}
          viewport={viewport}
          refreshKey={refreshKey}
          title={`Aperçu — ${project?.name || 'Projet'}`}
          className="h-full"
        />
      </main>

      {/* Barre d’édition IA */}
      {iterateOpen && (
        <div className="shrink-0 border-t border-[#E8E6DE] bg-[#FFFDF8] px-4 py-3 dark:border-[#243337] dark:bg-[#152023]">
          <div className="mx-auto max-w-3xl">
            <StudioIterateBar onSubmit={(instruction) => void handleIterate(instruction)} isBusy={isIterating} />
          </div>
        </div>
      )}

      {/* Panneau versions */}
      {versionsOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#14282D]/40">
          <div className="flex h-full w-full max-w-md flex-col border-l border-[#E8E6DE] bg-[#FFFDF8] shadow-2xl dark:border-[#243337] dark:bg-[#152023]">
            <div className="flex items-center justify-between border-b border-[#E8E6DE] px-5 py-4 dark:border-[#243337]">
              <h4 className="font-display text-[15px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
                Historique des versions
              </h4>
              <button
                type="button"
                onClick={() => setVersionsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#77817F] hover:bg-[#F1EFE6] dark:hover:bg-[#1B292D]"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {!project || project.versions.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#77817F]">
                  Aucune version enregistrée pour l’instant. L’historique reflète
                  uniquement les vraies sauvegardes.
                </p>
              ) : (
                project.versions.map((v: StudioProjectVersion) => (
                  <div
                    key={v.id}
                    className="rounded-[12px] border border-[#E8E6DE] bg-[#FBFAF5] p-3 dark:border-[#243337] dark:bg-[#1B292D]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                          {v.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#9AA5A3]">
                          {new Date(v.createdAt).toLocaleString('fr-FR')} ·{' '}
                          {v.fileCount} fichier{v.fileCount > 1 ? 's' : ''} ·{' '}
                          {v.origin === 'generation'
                            ? 'Génération'
                            : v.origin === 'iteration'
                              ? 'Modification IA'
                              : v.origin === 'restore'
                                ? 'Restauration'
                                : 'Sauvegarde manuelle'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestore(v.id)}
                        className="shrink-0 rounded-full border border-[#E8E6DE] px-2.5 py-1 text-[10px] font-semibold text-[#078348] transition-colors hover:border-[#078348] dark:border-[#243337]"
                      >
                        Restaurer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
