import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../../components/layout/WorkspaceLayout';
import { studioApi, StudioApiError } from '../../services/studioService';
import { useAura } from '../../context/AuraContext';
import type { StudioProjectType } from '../../shared/types.ts';
import { STUDIO_PROJECT_TYPE_LABELS } from '../../shared/types.ts';

const TYPE_OPTIONS: { id: StudioProjectType; icon: string }[] = [
  { id: 'site-web', icon: 'fa-solid fa-globe' },
  { id: 'application-web', icon: 'fa-solid fa-window-maximize' },
  { id: 'dashboard', icon: 'fa-solid fa-chart-line' },
  { id: 'portfolio', icon: 'fa-solid fa-user-astronaut' },
  { id: 'landing-page', icon: 'fa-solid fa-rocket' },
  { id: 'design-ui', icon: 'fa-solid fa-pen-ruler' },
  { id: 'document', icon: 'fa-regular fa-file-lines' },
];

const IDEA_EXAMPLES = [
  'Un site e-commerce premium pour une marque de mode africaine, avec panier et page produit.',
  'Un dashboard de suivi des ventes hebdomadaires avec graphiques et tableau de commandes.',
  'Un portfolio élégant pour un photographe, avec galerie filtrable et page contact.',
];

type Phase = 'form' | 'generating' | 'error';

export const StudioNewPage: React.FC = () => {
  const { language } = useAura();
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<StudioProjectType>('site-web');
  const [sections, setSections] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [failedProjectId, setFailedProjectId] = useState<string | null>(null);

  const canSubmit = idea.trim().length >= 8 && phase !== 'generating';

  const submit = async () => {
    if (!canSubmit) return;
    setPhase('generating');
    setError(null);
    setFailedProjectId(null);
    try {
      const res = await studioApi.create({
        idea: idea.trim(),
        name: name.trim() || undefined,
        type,
        sections: sections.trim() || undefined,
        styleNotes: styleNotes.trim() || undefined,
        clientRequestId: `studio-new-${Date.now()}`,
      });
      navigate(`/app/studio/${res.project.id}/preview`, {
        state: { fresh: true },
      });
    } catch (err) {
      setPhase('error');
      setError(
        err instanceof StudioApiError
          ? err.message
          : 'La génération a échoué. Réessayez.'
      );
      if (err instanceof StudioApiError && err.code && err.code !== 'PROVIDER_NOT_CONFIGURED') {
        // projectId communiqué par le serveur si un projet est resté en échec
        const anyErr = err as StudioApiError & { projectId?: string };
        if (anyErr.projectId) setFailedProjectId(anyErr.projectId);
      }
    }
  };

  return (
    <WorkspaceLayout headerTitle="Nouvelle création">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
        <Link
          to="/app/studio"
          className="mb-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#77817F] transition-colors hover:text-[#078348]"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Retour à la galerie
        </Link>

        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#F0D9A8] bg-[#FBF3D9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A16207] dark:border-[#2A2614] dark:bg-[#2A2614] dark:text-[#EACB37]">
          <i className="fa-solid fa-wand-magic-sparkles" />
          Aura Studio · Étape 1
        </div>
        <h2 className="font-display text-[26px] font-bold leading-tight text-[#14282D] dark:text-[#F3F2EC]">
          {language === 'en' ? 'Describe your idea' : 'Décrivez votre idée'}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#77817F]">
          En quelques phrases, dites à Aura ce que vous voulez créer. Vous pourrez
          ensuite tout affiner — chaque fichier reste modifiable et exportable.
        </p>

        {/* Panneau principal */}
        <div className="mt-6 space-y-5 rounded-[20px] border border-[#E8E6DE] bg-[#FFFDF8] p-5 shadow-[0_14px_44px_rgba(20,40,45,0.05)] sm:p-7 dark:border-[#243337] dark:bg-[#152023]">
          <div>
            <label
              htmlFor="studio-idea"
              className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-[#77817F]"
            >
              Votre idée <span className="text-[#C2410C]">*</span>
            </label>
            <textarea
              id="studio-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={5}
              maxLength={8000}
              placeholder="Ex. : Un site vitrine premium pour un restaurant à Cotonou, avec menu, réservation et galerie photos…"
              className="w-full resize-y rounded-[14px] border border-[#E8E6DE] bg-[#FBFAF5] px-4 py-3 text-[13.5px] leading-relaxed text-[#14282D] outline-none transition-colors placeholder:text-[#B4BCBA] focus:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {IDEA_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIdea(ex)}
                  className="rounded-full border border-[#E8E6DE] bg-[#FBFAF5] px-2.5 py-[5px] text-[10px] text-[#77817F] transition-colors hover:border-[#8CCB4A] hover:text-[#078348] dark:border-[#243337] dark:bg-[#1B292D]"
                >
                  {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-[#77817F]">
              Type de création
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-semibold transition-all ${
                    type === opt.id
                      ? 'border-[#078348] bg-[#EAF1E8] text-[#078348] dark:border-[#39B969] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                      : 'border-[#E8E6DE] bg-[#FBFAF5] text-[#77817F] hover:border-[#D9D4C5] dark:border-[#243337] dark:bg-[#1B292D]'
                  }`}
                >
                  <i className={`${opt.icon} text-[12px]`} />
                  {STUDIO_PROJECT_TYPE_LABELS[opt.id].fr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#77817F] transition-colors hover:text-[#078348]"
            >
              <i className={`fa-solid fa-chevron-${advancedOpen ? 'down' : 'right'} text-[9px]`} />
              Options avancées (facultatif)
            </button>
            {advancedOpen && (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="studio-name" className="mb-1 block text-[11px] font-semibold text-[#77817F]">
                    Nom du projet
                  </label>
                  <input
                    id="studio-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Ex. : Restaurant Le Baobab"
                    className="w-full rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                  />
                </div>
                <div>
                  <label htmlFor="studio-sections" className="mb-1 block text-[11px] font-semibold text-[#77817F]">
                    Sections ou fonctionnalités souhaitées
                  </label>
                  <textarea
                    id="studio-sections"
                    value={sections}
                    onChange={(e) => setSections(e.target.value)}
                    rows={3}
                    placeholder="Ex. : hero, menu du jour, formulaire de réservation, galerie, contact…"
                    className="w-full resize-y rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                  />
                </div>
                <div>
                  <label htmlFor="studio-style" className="mb-1 block text-[11px] font-semibold text-[#77817F]">
                    Direction artistique
                  </label>
                  <textarea
                    id="studio-style"
                    value={styleNotes}
                    onChange={(e) => setStyleNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex. : ivoire chaud, accents orange, ambiance premium et chaleureuse…"
                    className="w-full resize-y rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* État de génération honnête */}
          {phase === 'generating' && (
            <div className="rounded-[14px] border border-[#C9E2B6] bg-[#EEF5E4] p-4 dark:border-[#24402C] dark:bg-[#182E24]">
              <div className="flex items-center gap-2.5 text-[12.5px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                <i className="fa-solid fa-spinner fa-spin" />
                Génération en cours — le projet n’apparaîtra comme prêt qu’une fois
                la génération réellement terminée.
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DCE8CF] dark:bg-[#24402C]">
                <div className="h-full w-1/3 animate-[studioProgress_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#078348] via-[#8CCB4A] to-[#FF790D]" />
              </div>
              <style>{`@keyframes studioProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }`}</style>
            </div>
          )}

          {phase === 'error' && error && (
            <div className="rounded-[14px] border border-[#F0C9A8] bg-[#FCEBDD] p-4 text-[12px] leading-relaxed text-[#C2410C] dark:border-[#4A2B18] dark:bg-[#2B1B12] dark:text-[#FF790D]">
              <i className="fa-solid fa-triangle-exclamation mr-1.5" />
              {error}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('form');
                  }}
                  className="rounded-full border border-[#F0C9A8] px-3 py-1.5 text-[11px] font-semibold"
                >
                  Modifier ma demande
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  className="rounded-full bg-[#C2410C] px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Relancer la génération
                </button>
                {failedProjectId && (
                  <Link
                    to={`/app/studio/${failedProjectId}/preview`}
                    className="rounded-full border border-[#F0C9A8] px-3 py-1.5 text-[11px] font-semibold"
                  >
                    Voir le projet en échec
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[10.5px] leading-relaxed text-[#9AA5A3]">
              La génération consomme des unités d’usage (offre gratuite : 3 créations
              par mois). Aucun résultat n’est inventé en cas d’échec du fournisseur IA.
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className="aura-btn-gradient inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {phase === 'generating' ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                  Génération…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles text-[11px]" />
                  Générer le projet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};
