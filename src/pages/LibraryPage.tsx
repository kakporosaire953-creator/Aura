import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import { AuraMode } from '../shared/types';
import { MODE_DEFINITIONS } from '../components/workspace/PromptComposer';

type LibraryTab = 'all' | 'conversations' | 'saved' | 'files';

export const LibraryPage: React.FC = () => {
  const {
    conversations,
    libraryItems,
    deleteConversation,
    deleteLibraryItem,
    language,
  } = useAura();

  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [modeFilter, setModeFilter] = useState<AuraMode | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    kind: 'conversation' | 'item';
    title: string;
  } | null>(null);

  const unifiedEntries = useMemo(() => {
    const convEntries = conversations.map((c) => ({
      id: c.id,
      kind: 'conversation' as const,
      subType: 'conversation' as const,
      title: c.title,
      excerpt:
        c.messages[c.messages.length - 1]?.content.slice(0, 180) ||
        'Conversation vide',
      mode: c.mode,
      date: c.updatedAt,
      link: `/app/chat/${c.id}`,
      messageCount: c.messages.length,
    }));

    const itemEntries = libraryItems.map((item) => ({
      id: item.id,
      kind: 'item' as const,
      subType: item.type,
      title: item.title,
      excerpt: item.excerpt,
      mode: item.mode,
      date: item.createdAt,
      link: item.conversationId ? `/app/chat/${item.conversationId}` : undefined,
      fileMeta: item.fileMeta,
    }));

    return [...convEntries, ...itemEntries]
      .filter((entry) => {
        if (activeTab === 'conversations' && entry.kind !== 'conversation') return false;
        if (activeTab === 'saved' && entry.subType !== 'saved_response') return false;
        if (activeTab === 'files' && entry.subType !== 'file') return false;
        if (modeFilter !== 'all' && entry.mode !== modeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            entry.title.toLowerCase().includes(q) ||
            entry.excerpt.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [conversations, libraryItems, activeTab, modeFilter, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === 'conversation') {
      await deleteConversation(confirmDelete.id);
    } else {
      await deleteLibraryItem(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  return (
    <WorkspaceLayout headerTitle={language === 'en' ? 'Library' : 'Bibliothèque'}>
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en'
                ? 'Your Knowledge Library'
                : 'Votre bibliothèque personnelle'}
            </h2>
            <p className="text-sm text-[#77817F] mt-1">
              {language === 'en'
                ? 'Find your past conversations, saved AI responses, and attached documents.'
                : 'Retrouvez vos conversations, réponses sauvegardées et fichiers joints.'}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#77817F]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en' ? 'Search library...' : 'Rechercher dans la bibliothèque...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] text-sm text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#77817F] focus:outline-none focus:border-[#078348]"
            />
          </div>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E8E6DE] dark:border-[#243337]">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EA] dark:bg-[#152023] overflow-x-auto">
            {(
              [
                { id: 'all', labelFr: 'Tout', labelEn: 'All' },
                { id: 'conversations', labelFr: 'Conversations', labelEn: 'Conversations' },
                { id: 'saved', labelFr: 'Réponses sauvegardées', labelEn: 'Saved Responses' },
                { id: 'files', labelFr: 'Fichiers', labelEn: 'Files' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#FFFDF8] dark:bg-[#1B292D] text-[#14282D] dark:text-white shadow-xs'
                    : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-white'
                }`}
              >
                {language === 'en' ? tab.labelEn : tab.labelFr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: language === 'en' ? 'All modes' : 'Tous les modes' },
                { id: 'chat', label: 'Chat' },
                { id: 'search', label: language === 'en' ? 'Search' : 'Recherche' },
                { id: 'code', label: 'Code' },
                { id: 'create', label: language === 'en' ? 'Create' : 'Créer' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModeFilter(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  modeFilter === m.id
                    ? 'bg-[#EAF1E8] dark:bg-[#182E24] border-[#078348]/30 text-[#078348] dark:text-[#8CCB4A]'
                    : 'bg-transparent border-[#E8E6DE] dark:border-[#243337] text-[#77817F] hover:text-[#14282D]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List or Empty State */}
        {unifiedEntries.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-12 text-center max-w-lg mx-auto my-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <AuraLogo size="lg" variant="symbol" glow="subtle" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
              {language === 'en' ? 'No items found' : 'Aucun élément trouvé'}
            </h3>
            <p className="text-xs sm:text-sm text-[#77817F] mt-1.5 mb-6">
              {language === 'en'
                ? 'Start a conversation or bookmark a helpful response to populate your library.'
                : 'Démarrez une conversation ou sauvegardez une réponse utile pour enrichir votre bibliothèque.'}
            </p>
            <Link
              to="/app"
              className="aura-btn-gradient px-5 py-2.5 rounded-full text-xs font-semibold text-white inline-flex items-center gap-2"
            >
              <i className="fa-solid fa-plus" />
              <span>
                {language === 'en' ? 'Start a new conversation' : 'Nouvelle conversation'}
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unifiedEntries.map((entry) => {
              const modeDef = MODE_DEFINITIONS[entry.mode || 'chat'];
              return (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between hover:border-[#078348]/40 transition-colors"
                >
                  <div>
                    {/* Quiet Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#77817F] mb-2">
                      <div className="flex items-center gap-2">
                        <i
                          className={modeDef.icon}
                          style={{ color: modeDef.accentColor }}
                        />
                        <span className="font-medium text-[#14282D] dark:text-[#F3F2EC]">
                          {language === 'en' ? modeDef.labelEn : modeDef.labelFr}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {entry.kind === 'conversation'
                            ? 'Conversation'
                            : entry.subType === 'file'
                            ? 'Fichier joint'
                            : 'Réponse sauvegardée'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            id: entry.id,
                            kind: entry.kind,
                            title: entry.title,
                          })
                        }
                        className="text-[#77817F] hover:text-[#DC2626] transition-colors p-1"
                        title="Supprimer"
                        aria-label={`Supprimer ${entry.title}`}
                      >
                        <i className="fa-regular fa-trash-can text-xs" />
                      </button>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC] line-clamp-1">
                      {entry.title}
                    </h3>

                    <p className="text-xs text-[#77817F] leading-relaxed mt-1.5 line-clamp-3">
                      {entry.excerpt.replace(/[#*`]/g, '')}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E6DE]/60 dark:border-[#243337] flex items-center justify-between text-xs">
                    {'messageCount' in entry ? (
                      <span className="text-[#77817F] tabular-nums">
                        {entry.messageCount} message(s)
                      </span>
                    ) : (
                      <span className="text-[#77817F]">Élément archivé</span>
                    )}

                    {entry.link && (
                      <Link
                        to={entry.link}
                        className="font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline inline-flex items-center gap-1.5"
                      >
                        <span>{language === 'en' ? 'Open' : 'Ouvrir'}</span>
                        <i className="fa-solid fa-arrow-right text-[10px]" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-[#77817F]">
              Voulez-vous vraiment supprimer «{' '}
              <strong className="text-[#14282D] dark:text-white">{confirmDelete.title}</strong> »
              de votre bibliothèque ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E6DE] dark:border-[#243337] text-xs font-medium text-[#14282D] dark:text-[#F3F2EC]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-semibold text-white"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
};
