import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';
import { AuraMission, AuraMode } from '../shared/types';

export const MissionsPage: React.FC = () => {
  const { missions, createMission, deleteMission, setActiveMode, sendMessage, language } =
    useAura();
  const navigate = useNavigate();

  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Produit & Création');
  const [customMode, setCustomMode] = useState<AuraMode>('create');
  const [customObjective, setCustomObjective] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLaunchMission = async (mission: AuraMission) => {
    setActiveMode(mission.mode);
    await sendMessage({
      message: mission.prompt,
      mode: mission.mode,
      onConversationReady: (readyId) => {
        navigate(`/app/chat/${readyId}`);
      },
    });
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customObjective.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createMission({
        title: customTitle.trim(),
        category: customCategory.trim() || 'Mission Aura',
        description: customObjective.trim(),
        mode: customMode,
        steps: [
          { label: 'Cadrage de l’objectif & plan d’action', done: true },
          { label: 'Exécution assistée par Aura', done: false },
          { label: 'Livrable final & validation', done: false },
        ],
        prompt: customObjective.trim(),
      });
      setCustomTitle('');
      setCustomObjective('');
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout headerTitle="Missions">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en' ? 'Aura Missions' : 'Missions Aura'}
            </h2>
            <p className="text-sm text-[#77817F] mt-1">
              {language === 'en'
                ? 'Orchestrate multi-step goals from initial idea to final deliverable.'
                : 'Orchestrez vos objectifs en plusieurs étapes, de l’idée initiale jusqu’au livrable final.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="aura-btn-gradient px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span>{language === 'en' ? 'New Mission' : 'Nouvelle mission'}</span>
          </button>
        </div>

        {missions.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0D9] dark:bg-[#2E2314] text-[#FF790D] flex items-center justify-center mx-auto">
              <i className="fa-solid fa-bullseye text-lg" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en'
                ? 'No missions created yet'
                : 'Aucune mission enregistrée pour le moment'}
            </h3>
            <p className="text-xs sm:text-sm text-[#77817F] max-w-md mx-auto leading-relaxed">
              {language === 'en'
                ? 'Transform your ideas into structured step-by-step missions and launch them directly in Aura.'
                : 'Transformez vos objectifs en missions structurées étape par étape et lancez leur exécution assistée dans Aura.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="aura-btn-gradient px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-plus text-xs" />
                <span>
                  {language === 'en' ? 'Create my first mission' : 'Créer ma première mission'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 sm:p-6 flex flex-col justify-between shadow-[0_6px_24px_rgba(20,40,45,0.03)] hover:border-[#078348]/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          mission.status === 'in_progress'
                            ? 'bg-[#FFF0D9] text-[#FF790D]'
                            : 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]'
                        }`}
                      >
                        <i className="fa-solid fa-bullseye text-base" />
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#14282D] dark:text-[#F3F2EC]">
                          {mission.title}
                        </h3>
                        <p className="text-xs text-[#77817F]">{mission.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                          mission.status === 'in_progress'
                            ? 'bg-[#FFF0D9] text-[#EA6B05]'
                            : mission.status === 'completed'
                            ? 'bg-[#EAF2E2] text-[#078348]'
                            : 'bg-[#F4F2EA] text-[#77817F]'
                        }`}
                      >
                        {mission.statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteMission(mission.id)}
                        className="w-7 h-7 rounded-lg text-[#77817F] hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                        title="Supprimer cette mission"
                      >
                        <i className="fa-regular fa-trash-can text-xs" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6E7775] dark:text-[#94A09E] leading-relaxed mb-4">
                    {mission.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] text-[#77817F] mb-1.5">
                      <span>Progression</span>
                      <span className="font-mono font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                        {mission.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#F2EFE6] dark:bg-[#1B292D] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(8, mission.progress)}%`,
                          background:
                            'linear-gradient(90deg, #078348 0%, #8CCB4A 50%, #FF790D 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Mission Steps */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/80 dark:border-[#243337]">
                    {mission.steps.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs">
                        <i
                          className={`fa-solid ${
                            st.done
                              ? 'fa-circle-check text-[#078348] dark:text-[#8CCB4A]'
                              : 'fa-circle-dot text-[#FF790D]'
                          } text-xs shrink-0`}
                        />
                        <span
                          className={
                            st.done
                              ? 'text-[#14282D] dark:text-[#F3F2EC] font-medium'
                              : 'text-[#77817F]'
                          }
                        >
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#EAE6DC]/70 dark:border-[#243337] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#77817F]">
                    Mode : <strong className="uppercase">{mission.mode}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleLaunchMission(mission)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF2E2] hover:bg-[#DCE9D0] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Continuer avec Aura</span>
                    <i className="fa-solid fa-arrow-right text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Mission Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Créer une nouvelle mission"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                Nouvelle Mission Aura
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] flex items-center justify-center text-[#77817F]"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Titre de la mission
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ex : Lancement d’une application mobile"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Catégorie</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Produit & Architecture"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Mode principal
                  </label>
                  <select
                    value={customMode}
                    onChange={(e) => setCustomMode(e.target.value as AuraMode)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                  >
                    <option value="create">Aura Studio (Création)</option>
                    <option value="code">Code & Aperçu Web</option>
                    <option value="search">Recherche Web Sourcée</option>
                    <option value="chat">Conversation & Stratégie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Objectif & livrable attendu
                </label>
                <textarea
                  rows={3}
                  required
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  placeholder="Décrivez ce que vous souhaitez accomplir étape par étape..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#EAE6DC] dark:border-[#243337] text-xs font-medium text-[#77817F]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="aura-btn-gradient px-5 py-2 rounded-full text-xs font-semibold text-white cursor-pointer"
                >
                  {submitting ? 'Création...' : 'Créer la mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
};
