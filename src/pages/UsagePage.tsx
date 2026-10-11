import React, { useState } from 'react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';

export const UsagePage: React.FC = () => {
  const { usage, providers, persistenceInfo, resetQuota, language } = useAura();
  const [customLimit, setCustomLimit] = useState<number>(usage?.dailyLimit || 50);
  const [feedback, setFeedback] = useState<string | null>(null);

  const used = usage?.requestsUsed || 0;
  const limit = usage?.dailyLimit || 50;
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const totalTokens =
    (usage?.estimatedInputTokens || 0) + (usage?.estimatedOutputTokens || 0);

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetQuota(customLimit);
    setFeedback(
      'Le compteur quotidien a été réinitialisé et le plafond serveur a été mis à jour.'
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <WorkspaceLayout
      headerTitle={language === 'en' ? 'Usage & Quotas' : 'Utilisation & Limites'}
    >
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
            {language === 'en'
              ? 'Server-Controlled Usage & Providers'
              : 'Suivi de consommation & Fournisseurs IA'}
          </h2>
          <p className="text-sm text-[#77817F] mt-1">
            {language === 'en'
              ? 'Real-time request quotas, token estimates, and multi-provider adapter status.'
              : 'Contrôle des quotas côté serveur, estimation des tokens et état réel des adaptateurs multi-fournisseurs.'}
          </p>
        </div>

        {feedback && (
          <div className="px-4 py-3 rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] border border-[#078348]/30 text-xs font-medium text-[#078348] dark:text-[#8CCB4A] flex items-center gap-2">
            <i className="fa-solid fa-circle-check" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5">
            <div className="flex items-center justify-between text-xs text-[#77817F] mb-2">
              <span>Requêtes utilisées aujourd’hui</span>
              <i className="fa-solid fa-gauge-high text-[#078348]" />
            </div>
            <div className="font-display font-extrabold text-3xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
              {used} <span className="text-base font-normal text-[#77817F]">/ {limit}</span>
            </div>
            <div className="mt-3 w-full h-2 rounded-full bg-[#F4F2EA] dark:bg-[#1B292D] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  background:
                    percentage >= 90
                      ? '#DC2626'
                      : 'linear-gradient(90deg, #078348, #8CCB4A, #FF790D)',
                }}
              />
            </div>
            <p className="text-[11px] text-[#77817F] mt-2 tabular-nums">
              {Math.max(0, limit - used)} requête(s) restante(s) sur votre quota serveur.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5">
            <div className="flex items-center justify-between text-xs text-[#77817F] mb-2">
              <span>Consommation estimée (Tokens)</span>
              <i className="fa-solid fa-coins text-[#EACB37]" />
            </div>
            <div className="font-display font-extrabold text-3xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
              {totalTokens.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#77817F] tabular-nums">
              <span>Entrée : {(usage?.estimatedInputTokens || 0).toLocaleString()}</span>
              <span aria-hidden="true">·</span>
              <span>Sortie : {(usage?.estimatedOutputTokens || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5">
            <div className="flex items-center justify-between text-xs text-[#77817F] mb-2">
              <span>Répartition par mode</span>
              <i className="fa-solid fa-layer-group text-[#FF790D]" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs tabular-nums">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FBFAF5] dark:bg-[#111B1E]">
                <span className="text-[#77817F]">Chat</span>
                <span className="font-semibold">{usage?.byMode.chat || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FBFAF5] dark:bg-[#111B1E]">
                <span className="text-[#77817F]">Recherche</span>
                <span className="font-semibold">{usage?.byMode.search || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FBFAF5] dark:bg-[#111B1E]">
                <span className="text-[#77817F]">Code</span>
                <span className="font-semibold">{usage?.byMode.code || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FBFAF5] dark:bg-[#111B1E]">
                <span className="text-[#77817F]">Créer</span>
                <span className="font-semibold">{usage?.byMode.create || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Provider AI Architecture Status Table */}
        <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E6DE] dark:border-[#243337] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                État des adaptateurs Multi-Fournisseurs IA (Côté Serveur)
              </h3>
              <p className="text-xs text-[#77817F]">
                Aucune clé API n’est exposée au navigateur. La sélection s’effectue sur le serveur.
              </p>
            </div>
            <span className="text-xs font-mono text-[#078348] dark:text-[#8CCB4A]">
              Persistance : {persistenceInfo.engine}
            </span>
          </div>

          <div className="divide-y divide-[#E8E6DE]/70 dark:divide-[#243337]">
            {providers.map((p) => (
              <div
                key={p.id}
                className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                      {p.name}
                    </span>
                    <span className="text-xs text-[#77817F]">·</span>
                    <span className="font-mono text-xs text-[#77817F]">{p.envVarName}</span>
                  </div>
                  <p className="text-xs text-[#77817F]">{p.statusMessage}</p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#77817F]">
                    {p.models.map((m) => (
                      <span key={m.id} className="font-mono">
                        {m.label} ({m.id})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.configured ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                      <i className="fa-solid fa-circle-check" />
                      <span>Connecté & Actif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D97706]">
                      <i className="fa-solid fa-plug-circle-exclamation" />
                      <span>Configuration externe requise ({p.envVarName})</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server-Side Quota Control Form */}
        <form
          onSubmit={handleUpdateLimit}
          className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div className="space-y-1.5 flex-1">
            <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
              Contrôle du plafond quotidien (Simulation & Administration Serveur)
            </h3>
            <p className="text-xs text-[#77817F]">
              Vous pouvez ajuster la limite quotidienne (ex: mettre 1 ou 2 pour tester l’état de
              dépassement de quota HTTP 429) ou réinitialiser votre compteur.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <label className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                Limite quotidienne :
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={customLimit}
                onChange={(e) => setCustomLimit(Number(e.target.value))}
                className="w-28 px-3 py-1.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm font-mono tabular-nums"
              />
              <span className="text-xs text-[#77817F]">requêtes / jour</span>
            </div>
          </div>

          <button
            type="submit"
            className="aura-btn-gradient px-5 py-2.5 rounded-full text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
          >
            Appliquer & Réinitialiser le compteur
          </button>
        </form>
      </div>
    </WorkspaceLayout>
  );
};
