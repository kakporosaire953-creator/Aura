import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import { AuraProject } from '../shared/types';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    conversations,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    language,
  } = useAura();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AuraProject['category']>('web');
  const [systemContext, setSystemContext] = useState('');

  const categoryPresets: Record<
    AuraProject['category'],
    { label: string; color: string; icon: string }
  > = {
    web: {
      label: 'Développement Web & Tech',
      color: '#078348',
      icon: 'fa-solid fa-code',
    },
    study: {
      label: 'Études & Révisions',
      color: '#EACB37',
      icon: 'fa-solid fa-graduation-cap',
    },
    content: {
      label: 'Création de contenu',
      color: '#FF790D',
      icon: 'fa-solid fa-wand-magic-sparkles',
    },
    business: {
      label: 'Projet entrepreneurial',
      color: '#078348',
      icon: 'fa-solid fa-briefcase',
    },
    general: {
      label: 'Général',
      color: '#77817F',
      icon: 'fa-regular fa-folder-open',
    },
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const preset = categoryPresets[category];
    const created = await createProject({
      name: name.trim(),
      description:
        description.trim() ||
        'Espace de travail regroupant les conversations, livrables Aura Studio et instructions de ce projet.',
      category,
      color: preset.color,
      icon: preset.icon,
      systemContext: systemContext.trim() || undefined,
    });
    if (created) {
      setModalOpen(false);
      setName('');
      setDescription('');
      setSystemContext('');
    }
  };

  const handleStartChatInProject = (projId: string) => {
    setActiveProjectId(projId);
    navigate('/app');
  };

  return (
    <WorkspaceLayout headerTitle={language === 'en' ? 'Projects' : 'Projets'}>
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en' ? 'Projects & Workspaces' : 'Vos Projets Aura'}
            </h2>
            <p className="text-sm text-[#77817F] mt-1">
              {language === 'en'
                ? 'Group related conversations and Aura Studio deliverables around a shared goal.'
                : 'Regroupez vos conversations, livrables Aura Studio et instructions autour d’un même objectif.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="aura-btn-gradient px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 self-start sm:self-auto whitespace-nowrap cursor-pointer"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span>{language === 'en' ? 'New Project' : 'Nouveau projet'}</span>
          </button>
        </div>

        {/* Projects Grid or Clean Empty State */}
        {projects.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-dashed border-[#E8E6DE] dark:border-[#243337] p-10 text-center flex flex-col items-center justify-center space-y-4">
            <AuraLogo size="md" variant="symbol" animated glow="subtle" />
            <div className="max-w-md space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                {language === 'en'
                  ? 'No projects created yet'
                  : 'Aucun projet enregistré pour le moment'}
              </h3>
              <p className="text-xs sm:text-sm text-[#77817F] leading-relaxed">
                {language === 'en'
                  ? 'Create a project to organize your conversations, define custom AI instructions, and reopen your Aura Studio deliverables anytime.'
                  : 'Créez un projet pour organiser vos conversations, définir des instructions personnalisées et retrouver vos livrables Aura Studio à tout moment.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="aura-btn-gradient px-5 py-2.5 rounded-full text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[11px]" />
              <span>{language === 'en' ? 'Create my first project' : 'Créer mon premier projet'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((proj) => {
              const linkedConvs = conversations.filter((c) => c.projectId === proj.id);
              const isSelected = activeProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border p-6 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#078348] shadow-[0_6px_24px_rgba(7,131,72,0.08)]'
                      : 'border-[#E8E6DE] dark:border-[#243337]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]"
                          style={{ color: proj.color }}
                        >
                          <i className={proj.icon} />
                        </span>
                        <div>
                          <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                            {proj.name}
                          </h3>
                          <p className="text-xs text-[#77817F]">
                            {categoryPresets[proj.category]?.label || 'Projet'} ·{' '}
                            <span className="tabular-nums">{linkedConvs.length}</span>{' '}
                            conversation(s)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        className="text-[#77817F] hover:text-[#DC2626] p-1 cursor-pointer"
                        title="Supprimer ce projet"
                      >
                        <i className="fa-regular fa-trash-can text-xs" />
                      </button>
                    </div>

                    <p className="text-sm text-[#77817F] leading-relaxed mb-4">
                      {proj.description}
                    </p>

                    {proj.systemContext && (
                      <div className="p-3 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-xs text-[#77817F] mb-4">
                        <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                          Instructions du projet :{' '}
                        </span>
                        <span>{proj.systemContext}</span>
                      </div>
                    )}

                    {/* Linked Conversations & Deliverables Preview */}
                    {linkedConvs.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77817F]">
                          Conversations & Livrables Aura Studio :
                        </p>
                        {linkedConvs.slice(0, 4).map((c) => {
                          const hasCode = c.messages.some((m) => !!m.codeArtifact);
                          const hasCreative = c.messages.some((m) => !!m.creativeArtifact);
                          return (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE]/70 dark:border-[#243337] text-xs"
                            >
                              <Link
                                to={`/app/chat/${c.id}`}
                                className="flex items-center gap-2 min-w-0 flex-1 text-[#14282D] dark:text-[#F3F2EC] hover:text-[#078348] dark:hover:text-[#8CCB4A] font-medium truncate"
                              >
                                <i
                                  className={
                                    hasCode
                                      ? 'fa-solid fa-code text-[#078348]'
                                      : hasCreative
                                      ? 'fa-solid fa-wand-magic-sparkles text-[#FF790D]'
                                      : 'fa-regular fa-comment-dots text-[#77817F]'
                                  }
                                />
                                <span className="truncate">{c.title}</span>
                              </Link>

                              <Link
                                to={`/app/chat/${c.id}?studio=1`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-[10.5px] font-semibold shrink-0 hover:brightness-95 transition-all"
                              >
                                <i className="fa-solid fa-table-columns text-[9px]" />
                                <span>Aura Studio</span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E8E6DE]/60 dark:border-[#243337] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveProjectId(isSelected ? undefined : proj.id)
                      }
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EAF1E8] dark:bg-[#182E24] border-[#078348]/40 text-[#078348] dark:text-[#8CCB4A]'
                          : 'border-[#E8E6DE] dark:border-[#243337] text-[#77817F] hover:text-[#14282D]'
                      }`}
                    >
                      {isSelected ? 'Projet actif' : 'Définir comme actif'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartChatInProject(proj.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline cursor-pointer"
                    >
                      <span>Nouvelle conversation ici</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DE] dark:border-[#243337]">
              <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                Créer un nouveau projet Aura
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#F4F2EA] flex items-center justify-center text-[#77817F]"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                  Nom du projet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Application Fintech Mobile, Mémoire de Master..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as AuraProject['category'])
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                >
                  <option value="web">Projet de développement web</option>
                  <option value="study">Études et révisions</option>
                  <option value="content">Création de contenu</option>
                  <option value="business">Projet entrepreneurial</option>
                  <option value="general">Général</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                  Objectif & Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez brièvement l’objectif de ce projet..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                  Instructions personnalisées pour l’IA (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={systemContext}
                  onChange={(e) => setSystemContext(e.target.value)}
                  placeholder="Ex : Utilise TypeScript strict et privilégie des explications adaptées à un public débutant."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm focus:outline-none focus:border-[#078348]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#77817F] hover:bg-[#F4F2EA]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="aura-btn-gradient px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                Créer le projet
              </button>
            </div>
          </form>
        </div>
      )}
    </WorkspaceLayout>
  );
};
