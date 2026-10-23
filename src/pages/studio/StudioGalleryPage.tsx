import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from '../../components/layout/WorkspaceLayout';
import { StudioProjectCard } from '../../components/studio/StudioProjectCard';
import { studioApi, StudioApiError } from '../../services/studioService';
import { useAura } from '../../context/AuraContext';
import type { StudioProjectSummary, StudioProjectType } from '../../shared/types.ts';
import { STUDIO_PROJECT_TYPE_LABELS } from '../../shared/types.ts';

type SortKey = 'recent' | 'oldest' | 'modified';
type ViewMode = 'grid' | 'list';

export const StudioGalleryPage: React.FC = () => {
  const { language } = useAura();
  const [projects, setProjects] = useState<StudioProjectSummary[]>([]);
  const [storage, setStorage] = useState<{ used: number; limit: number; planId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StudioProjectType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'generating' | 'failed' | 'draft'>('all');
  const [sort, setSort] = useState<SortKey>('modified');
  const [view, setView] = useState<ViewMode>('grid');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await studioApi.list();
      setProjects(res.projects);
      setStorage(res.storage);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : 'Impossible de charger vos projets Studio.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') list = list.filter((p) => p.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    list.sort((a, b) => {
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'recent') return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [projects, search, typeFilter, statusFilter, sort]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await studioApi.remove(confirmDelete.id);
      setNotice(`« ${confirmDelete.name} » a été supprimé.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    try {
      await studioApi.duplicate(id);
      setNotice('Projet dupliqué.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplication impossible.');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <WorkspaceLayout headerTitle="Aura Studio">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        {/* En-tête Studio */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#F0D9A8] bg-[#FBF3D9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A16207] dark:border-[#2A2614] dark:bg-[#2A2614] dark:text-[#EACB37]">
              <i className="fa-solid fa-wand-magic-sparkles" />
              Aura Studio
            </div>
            <h2 className="font-display text-[26px] font-bold leading-tight text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en' ? 'Your creations' : 'Vos créations'}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#77817F]">
              {language === 'en'
                ? 'Generate real websites and interfaces, preview them full-screen, edit every file in Developer Mode, and export the sources.'
                : 'Générez de vrais sites et interfaces, prévisualisez-les en plein écran, éditez chaque fichier en Developer Mode et exportez les sources.'}
            </p>
            {storage && (
              <p className="mt-2 text-[11px] text-[#9AA5A3]">
                {storage.used} / {storage.limit} projets enregistrés · offre{' '}
                <span className="font-semibold text-[#77817F]">{storage.planId.toUpperCase()}</span>
              </p>
            )}
          </div>
          <Link
            to="/app/studio/new"
            className="aura-btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
          >
            <i className="fa-solid fa-plus text-[11px]" />
            {language === 'en' ? 'New creation' : 'Nouvelle création'}
          </Link>
        </div>

        {/* Barre de filtres */}
        <div className="flex flex-col gap-3 border-y border-[#E8E6DE] py-3 dark:border-[#243337] lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#77817F]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'en' ? 'Search creations…' : 'Rechercher une création…'}
              className="w-full rounded-xl border border-[#E8E6DE] bg-[#FFFDF8] py-2 pl-9 pr-4 text-sm text-[#14282D] placeholder:text-[#B4BCBA] focus:border-[#078348] focus:outline-none dark:border-[#243337] dark:bg-[#152023] dark:text-[#F3F2EC]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as StudioProjectType | 'all')}
              className="rounded-xl border border-[#E8E6DE] bg-[#FFFDF8] px-3 py-2 text-xs text-[#14282D] focus:border-[#078348] focus:outline-none dark:border-[#243337] dark:bg-[#152023] dark:text-[#F3F2EC]"
              aria-label="Filtrer par type"
            >
              <option value="all">Tous les types</option>
              {(Object.keys(STUDIO_PROJECT_TYPE_LABELS) as StudioProjectType[]).map((t) => (
                <option key={t} value={t}>
                  {STUDIO_PROJECT_TYPE_LABELS[t].fr}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-xl border border-[#E8E6DE] bg-[#FFFDF8] px-3 py-2 text-xs text-[#14282D] focus:border-[#078348] focus:outline-none dark:border-[#243337] dark:bg-[#152023] dark:text-[#F3F2EC]"
              aria-label="Filtrer par statut"
            >
              <option value="all">Tous les statuts</option>
              <option value="ready">Prêts</option>
              <option value="generating">En génération</option>
              <option value="failed">Échecs</option>
              <option value="draft">Brouillons</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-[#E8E6DE] bg-[#FFFDF8] px-3 py-2 text-xs text-[#14282D] focus:border-[#078348] focus:outline-none dark:border-[#243337] dark:bg-[#152023] dark:text-[#F3F2EC]"
              aria-label="Trier"
            >
              <option value="modified">Récemment modifiés</option>
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
            </select>
            <div className="flex overflow-hidden rounded-xl border border-[#E8E6DE] dark:border-[#243337]">
              {(['grid', 'list'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  title={mode === 'grid' ? 'Vue grille' : 'Vue liste'}
                  className={`px-3 py-2 text-xs ${
                    view === mode
                      ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                      : 'bg-[#FFFDF8] text-[#77817F] dark:bg-[#152023]'
                  }`}
                >
                  <i className={`fa-solid ${mode === 'grid' ? 'fa-table-cells-large' : 'fa-list'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications honnêtes */}
        {notice && (
          <div className="rounded-xl border border-[#C9E2B6] bg-[#EEF5E4] px-4 py-2.5 text-[12px] text-[#078348] dark:border-[#24402C] dark:bg-[#182E24] dark:text-[#8CCB4A]">
            <i className="fa-solid fa-circle-info mr-1.5" />
            {notice}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F0C9A8] bg-[#FCEBDD] px-4 py-2.5 text-[12px] text-[#C2410C] dark:border-[#4A2B18] dark:bg-[#2B1B12] dark:text-[#FF790D]">
            <span>
              <i className="fa-solid fa-triangle-exclamation mr-1.5" />
              {error}
            </span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">
              Réessayer
            </button>
          </div>
        )}

        {/* États de chargement / vides / grille */}
        {isLoading ? (
          <div className={`grid gap-5 ${view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-1'}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[330px] animate-pulse rounded-[18px] border border-[#E8E6DE] bg-[#F4F2EA] dark:border-[#243337] dark:bg-[#1B292D]"
              />
            ))}
          </div>
        ) : filtered.length === 0 && projects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[22px] border border-dashed border-[#D9D4C5] bg-[#FFFDF8] px-6 py-16 text-center dark:border-[#2E4044] dark:bg-[#152023]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAF1E8] to-[#FBF3D9] dark:from-[#182E24] dark:to-[#2A2614]">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl text-[#078348]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
              Votre galerie Studio est vide
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-[#77817F]">
              Décrivez une idée, générez un site web ou une interface réelle, puis
              affinez-la itérativement. Chaque création devient un projet modifiable
              et exportable.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app/studio/new"
                className="aura-btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                <i className="fa-solid fa-plus text-[11px]" />
                Créer ma première création
              </Link>
              <Link
                to="/features/studio"
                className="inline-flex items-center gap-2 rounded-full border border-[#E8E6DE] px-5 py-2.5 text-[13px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
              >
                Découvrir Aura Studio
              </Link>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[18px] border border-[#E8E6DE] bg-[#FFFDF8] px-6 py-12 text-center text-sm text-[#77817F] dark:border-[#243337] dark:bg-[#152023]">
            Aucun projet ne correspond à ces filtres.
          </div>
        ) : (
          <div
            className={`grid gap-5 ${view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-1 lg:grid-cols-2'}`}
          >
            {filtered.map((p, idx) => (
              <StudioProjectCard
                key={p.id}
                project={p}
                index={idx}
                onDelete={(id, name) => setConfirmDelete({ id, name })}
                onDuplicate={(id) => void handleDuplicate(id)}
              />
            ))}
          </div>
        )}

        {/* Confirmation de suppression */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14282D]/45 p-4">
            <div className="w-full max-w-sm rounded-[18px] border border-[#E8E6DE] bg-[#FFFDF8] p-6 shadow-[0_30px_80px_rgba(20,40,45,0.25)] dark:border-[#243337] dark:bg-[#152023]">
              <h4 className="font-display text-base font-bold text-[#14282D] dark:text-[#F3F2EC]">
                Supprimer « {confirmDelete.name} » ?
              </h4>
              <p className="mt-2 text-[12px] leading-relaxed text-[#77817F]">
                Cette action supprime définitivement le projet, ses fichiers et son
                historique de versions. Elle est irréversible.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-full border border-[#E8E6DE] px-4 py-2 text-[12px] font-semibold text-[#14282D] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={busyId === confirmDelete.id}
                  className="rounded-full bg-[#C2410C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
                >
                  {busyId === confirmDelete.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
};
