import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';

export interface HelpArticle {
  id: string;
  category: 'chat' | 'studio' | 'projects' | 'account' | 'quotas' | 'privacy';
  title: string;
  summary: string;
  content: string[];
  keywords: string[];
  relatedLink?: { url: string; label: string };
}

const HELP_CATEGORIES = [
  { id: 'all', label: 'Tous les thèmes', icon: 'fa-solid fa-layer-group' },
  { id: 'chat', label: 'Aura Chat & Explore', icon: 'fa-regular fa-comment-dots' },
  { id: 'studio', label: 'Aura Studio', icon: 'fa-solid fa-table-cells-large' },
  { id: 'projects', label: 'Projets & Missions', icon: 'fa-regular fa-folder' },
  { id: 'account', label: 'Compte & Connexion', icon: 'fa-regular fa-user' },
  { id: 'quotas', label: 'Quotas & Abonnements', icon: 'fa-solid fa-gauge-high' },
  { id: 'privacy', label: 'Confidentialité & Données', icon: 'fa-solid fa-shield-halved' },
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  // 1. AURA CHAT
  {
    id: 'chat-basics',
    category: 'chat',
    title: 'Comment utiliser Aura Chat et formuler des requêtes efficaces ?',
    summary: 'Principes de base du dialogue avec Aura, choix du ton, et organisation des conversations.',
    content: [
      'Aura Chat vous permet d’échanger en langage naturel avec des modèles d’intelligence artificielle configurés pour le raisonnement, la rédaction, l’analyse et la synthèse.',
      'Pour obtenir les meilleurs résultats : décrivez votre objectif précis, fournissez le contexte ou les contraintes (ex. longueur, public cible, format), et donnez des exemples concrets si nécessaire.',
      'Chaque discussion peut être renommée, épinglée ou supprimée à tout moment depuis le volet latéral ou la bibliothèque Aura.',
    ],
    keywords: ['chat', 'prompt', 'discussion', 'conversation', 'formulation', 'ia'],
    relatedLink: { url: '/app', label: 'Accéder à Aura Chat' },
  },
  {
    id: 'chat-explore',
    category: 'chat',
    title: 'Qu’est-ce qu’Aura Explore et comment sont vérifiées les sources ?',
    summary: 'Recherche web sourcée en direct connectée à Google Grounding pour des informations actuelles et vérifiables.',
    content: [
      'Aura Explore enrichit la conversation en interrogeant le Web en temps réel lorsque votre requête porte sur des événements récents, des données chiffrées ou des faits précis.',
      'Chaque réponse d’Aura Explore comporte des repères de citation cliquables renvoyant directement aux pages sources primaires répertoriées par le moteur Google.',
      'Dans l’offre gratuite Aura Free, chaque compte bénéficie de 10 recherches approfondies sourcées par mois calendaire.',
    ],
    keywords: ['explore', 'recherche', 'sources', 'web', 'actualité', 'vérification', 'grounding'],
    relatedLink: { url: '/app/explore', label: 'Ouvrir Aura Explore' },
  },
  {
    id: 'chat-memory',
    category: 'chat',
    title: 'Comment personnaliser la mémoire et les directives d’Aura ?',
    summary: 'Définissez vos préférences de réponse, votre profession et vos directives permanentes.',
    content: [
      'Vous pouvez définir des directives contextuelles permanentes dans Paramètres > Personnalisation & Mémoire.',
      'Indiquez par exemple : « Réponds toujours en français professionnel concis », « Adapte le code en TypeScript moderne », ou « Ne reformule pas inutilement mes questions ».',
      'Ces instructions sont injectées dans le contexte système de chaque nouvelle session et peuvent être modifiées ou effacées à tout moment.',
    ],
    keywords: ['mémoire', 'directives', 'instructions', 'personnalisation', 'ton', 'contexte'],
    relatedLink: { url: '/app/settings', label: 'Gérer la personnalisation' },
  },

  // 2. AURA STUDIO
  {
    id: 'studio-creation',
    category: 'studio',
    title: 'Comment créer un site web interactif dans Aura Studio ?',
    summary: 'Génération instantanée de pages HTML, Tailwind CSS et JavaScript prévisualisées en temps réel.',
    content: [
      'Dans l’espace de travail, activez le mode Aura Studio (ou saisissez une requête de type « Crée une landing page pour un atelier artisanal »).',
      'Le panneau droit d’Aura Studio compile automatiquement le code source et affiche un aperçu responsive interactif immédiat.',
      'Vous pouvez tester les boutons, formulaires et interactions directement dans la fenêtre de visualisation.',
    ],
    keywords: ['studio', 'site', 'création', 'html', 'tailwind', 'code', 'prototype'],
    relatedLink: { url: '/app?studio=1', label: 'Lancer Aura Studio' },
  },
  {
    id: 'studio-iterations',
    category: 'studio',
    title: 'Comment modifier ou itérer sur un site existant dans Aura Studio ?',
    summary: 'Affinez votre design étape par étape sans réécrire l’ensemble du code.',
    content: [
      'Utilisez la barre d’itération au bas du panneau Aura Studio pour demander des ajustements ciblés (ex. « Passe le bouton en orange », « Ajoute une section témoignages »).',
      'Aura applique les modifications chirurgicales en préservant la structure déjà validée de votre page.',
      'Vous pouvez basculer à tout moment entre la vue Aperçu (Preview) et la vue Code Source pour inspecter ou copier le balisage.',
    ],
    keywords: ['itérations', 'modifier', 'retouche', 'code', 'ajustement', 'css'],
    relatedLink: { url: '/legal/ip-policy', label: 'Droits sur le code produit' },
  },
  {
    id: 'studio-export',
    category: 'studio',
    title: 'Comment exporter ou déployer le code créé avec Aura Studio ?',
    summary: 'Téléchargez votre code autonome en un clic et déployez-le sur n’importe quel hébergeur.',
    content: [
      'Cliquez sur le bouton « Exporter » ou « Télécharger » dans la barre d’outils d’Aura Studio pour récupérer votre fichier index.html prêt pour la production.',
      'Le code est 100 % autonome et standard : vous pouvez l’héberger sur Vercel, Netlify, GitHub Pages ou vos propres serveurs.',
      'Conformément à notre politique de propriété intellectuelle, vous êtes l’unique propriétaire du code que vous concevez.',
    ],
    keywords: ['export', 'téléchargement', 'déploiement', 'hébergement', 'vercel', 'github'],
    relatedLink: { url: '/legal/ip-policy', label: 'Consulter la politique de propriété' },
  },

  // 3. PROJETS ET MISSIONS
  {
    id: 'projects-management',
    category: 'projects',
    title: 'Comment organiser mes travaux dans Aura Projects ?',
    summary: 'Regroupez vos discussions, documents et prototypes web par projet thématique.',
    content: [
      'La section Projets vous permet de compartimenter vos travaux par client, matière ou initiative d’entreprise.',
      'Chaque projet dispose de son propre contexte, d’une description opérationnelle et d’un filtre rapide dans la barre latérale.',
      'L’offre Aura Free permet de conserver simultanément jusqu’à 3 projets complets actifs.',
    ],
    keywords: ['projets', 'organisation', 'dossier', 'gestion', 'classement'],
    relatedLink: { url: '/app/projects', label: 'Accéder aux Projets' },
  },
  {
    id: 'missions-autonomous',
    category: 'projects',
    title: 'À quoi servent les Missions Aura et comment les suivre ?',
    summary: 'Découpez des objectifs complexes en étapes claires et suivez leur progression.',
    content: [
      'Les Missions Aura permettent de structurer des livrables ambitieux (ex. audit SEO complet, rédaction d’un business plan, refonte d’interface).',
      'Une mission se compose d’étapes séquentielles cochables (« To-Do ») et conserve l’historique des échanges associés.',
      'Vous pouvez créer des missions personnalisées ou choisir parmi les modèles types proposés dans la galerie de missions.',
    ],
    keywords: ['missions', 'tâches', 'objectifs', 'étapes', 'roadmap', 'suivi'],
    relatedLink: { url: '/app/missions', label: 'Ouvrir les Missions' },
  },

  // 4. COMPTE ET CONNEXION
  {
    id: 'account-auth',
    category: 'account',
    title: 'Quels sont les modes de connexion pris en charge ?',
    summary: 'Connexion par e-mail / mot de passe ou via vos comptes Google / GitHub réels.',
    content: [
      'Aura supporte la connexion traditionnelle par e-mail et mot de passe sécurisé (haché par scrypt), ainsi que l’authentification OAuth via Google et GitHub.',
      'Aucun mot de passe en clair n’est conservé sur nos serveurs. En cas d’oubli de mot de passe, un lien temporaire de réinitialisation vous est expédié par e-mail.',
      'Vous pouvez vérifier votre fournisseur de connexion actif et vos informations personnelles dans Paramètres > Compte.',
    ],
    keywords: ['connexion', 'login', 'google', 'github', 'mot de passe', 'sécurité'],
    relatedLink: { url: '/app/settings', label: 'Voir mes identifiants' },
  },
  {
    id: 'account-profile-edit',
    category: 'account',
    title: 'Comment mettre à jour mon profil ou modifier mes préférences ?',
    summary: 'Changez votre nom, organisation, langue d’affichage et mode de rendu en quelques clics.',
    content: [
      'Rendez-vous dans la rubrique Paramètres de votre espace de travail.',
      'L’onglet « Compte » permet d’ajuster votre nom d’usage, organisation, lieu et rôle affichés.',
      'L’onglet « Préférences » vous permet d’alterner entre le français et l’anglais, d’activer le thème clair ou sombre, et de choisir votre mode par défaut au lancement.',
    ],
    keywords: ['profil', 'nom', 'langue', 'thème', 'mode', 'paramètres'],
    relatedLink: { url: '/app/settings', label: 'Paramètres du compte' },
  },

  // 5. QUOTAS ET ABONNEMENTS
  {
    id: 'quotas-free-tier',
    category: 'quotas',
    title: 'Quels sont les quotas inclus dans l’offre Aura Free ?',
    summary: 'Détail des 30 unités d’usage, 10 recherches web, 3 créations web et renouvellement mensuel.',
    content: [
      'L’offre Aura Free est 100 % gratuite et sans engagement bancaire. Elle comprend chaque mois calendaire :',
      '• 30 unités d’usage IA pour le chat et la génération.',
      '• 10 recherches web sourcées avec Aura Explore.',
      '• 3 créations complètes de sites web dans Aura Studio.',
      '• 10 modifications et itérations de code.',
      '• 3 projets sauvegardés dans Aura Projects.',
      '• 30 jours de conservation pour votre historique.',
      'Vos compteurs se renouvellent automatiquement le 1er de chaque mois à 00:00 UTC.',
    ],
    keywords: ['quotas', 'gratuit', 'free', 'unités', 'limites', 'renouvellement', 'mois'],
    relatedLink: { url: '/settings/usage', label: 'Consulter ma consommation' },
  },
  {
    id: 'quotas-future-plans',
    category: 'quotas',
    title: 'Comment fonctionnent les futures offres Aura Plus et Pro ?',
    summary: 'Évaluation des offres payantes, liste d’attente prioritaire et transparence tarifaire.',
    content: [
      'Les offres Aura Plus et Aura Pro sont actuellement en phase d’évaluation d’infrastructure.',
      'Pour respecter nos principes de transparence, aucun faux paiement ni fausse tarification n’est activé tant que les passerelles bancaires et Mobile Money (FedaPay, Kkiapay) ne sont pas définitivement déployées.',
      'Vous pouvez manifester votre intérêt sur la page Tarifs pour rejoindre la liste d’accès prioritaire sans frais.',
    ],
    keywords: ['plus', 'pro', 'tarifs', 'abonnement', 'prix', 'fedapay', 'kkiapay'],
    relatedLink: { url: '/pricing', label: 'Découvrir la grille tarifaire' },
  },

  // 6. CONFIDENTIALITÉ ET SÉCURITÉ
  {
    id: 'privacy-export-delete',
    category: 'privacy',
    title: 'Comment exporter mes données ou supprimer définitivement mon compte ?',
    summary: 'Export complet JSON de vos discussions et droit à l’oubli autonome avec confirmation stricte.',
    content: [
      'Dans Paramètres > Confidentialité & Données, vous disposez de deux commandes directes :',
      '1. « Exporter mes données » : télécharge immédiatement l’intégralité de vos conversations, projets, missions et bibliothèque sous forme d’un fichier JSON structuré et réutilisable.',
      '2. « Supprimer l’historique » ou « Supprimer mon compte » : ces actions destructrices sont sécurisées et exigent une confirmation explicite (saisie exacte de votre e-mail).',
      'La suppression est exécutée côté serveur et efface définitivement toutes vos données associées.',
    ],
    keywords: ['export', 'données', 'suppression', 'rgpd', 'oubli', 'effacement', 'json'],
    relatedLink: { url: '/app/settings', label: 'Accéder aux commandes de confidentialité' },
  },
  {
    id: 'privacy-model-training',
    category: 'privacy',
    title: 'Aura utilise-t-il mes données privées pour entraîner des modèles d’IA ?',
    summary: 'Engagement formel de non-réutilisation de vos conversations à des fins d’entraînement public.',
    content: [
      'Non. Vos données privées (prompts, conversations, documents de bibliothèque, code généré) ne sont pas exploitées pour entraîner ou améliorer les modèles d’intelligence artificielle publics.',
      'Les appels aux API d’inférence sont exécutés exclusivement côté serveur selon des accords de traitement garantissant la stricte confidentialité de vos échanges.',
      'Pour plus de détails, consultez notre Politique de Confidentialité officielle.',
    ],
    keywords: ['entraînement', 'confidentialité', 'sécurité', 'données', 'rgpd', 'modèles'],
    relatedLink: { url: '/legal/privacy', label: 'Lire la politique de confidentialité' },
  },
];

export const HelpPage: React.FC = () => {
  const { isAuthenticated, language } = useAura();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Real search filtering across title, summary, keywords, and content
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HELP_ARTICLES.filter((article) => {
      const matchesCat = activeCategory === 'all' || article.category === activeCategory;
      if (!matchesCat) return false;

      if (!q) return true;

      const inTitle = article.title.toLowerCase().includes(q);
      const inSummary = article.summary.toLowerCase().includes(q);
      const inKeywords = article.keywords.some((k) => k.toLowerCase().includes(q));
      const inContent = article.content.some((c) => c.toLowerCase().includes(q));

      return inTitle || inSummary || inKeywords || inContent;
    });
  }, [activeCategory, searchQuery]);

  const toggleArticle = (id: string) => {
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] flex flex-col font-sans transition-colors selection:bg-[#8CCB4A]/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF8F2]/90 dark:bg-[#0E1618]/90 border-b border-[#EAE6DC] dark:border-[#243337]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <AuraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
                Aura
              </span>
              <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] uppercase tracking-wider">
                Centre d’aide
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <Link
              to="/pricing"
              className="font-medium text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors"
            >
              Tarifs
            </Link>
            <Link
              to="/legal/terms"
              className="font-medium text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors hidden sm:inline"
            >
              Conditions
            </Link>
            <Link
              to="/legal/privacy"
              className="font-medium text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors hidden sm:inline"
            >
              Confidentialité
            </Link>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#078348] hover:bg-[#066f3d] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Mon Espace Aura</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14282D] dark:bg-[#F3F2EC] text-white dark:text-[#14282D] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Connexion</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Banner with Integrated Search */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE6DC] dark:border-[#243337] bg-gradient-to-b from-[#F4F1E6]/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold border border-[#078348]/20">
            <i className="fa-solid fa-circle-question text-xs" />
            <span>Documentation & Assistance officielle</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-[#14282D] dark:text-[#F3F2EC] tracking-tight">
            Comment pouvons-nous vous aider aujourd’hui ?
          </h1>

          <p className="text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E] max-w-2xl mx-auto leading-relaxed">
            Consultez nos guides détaillés sur Aura Chat, Aura Studio, la gestion des quotas freemium, et l’exercice de vos droits de confidentialité.
          </p>

          {/* Search Input Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#77817F] text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un mot-clé (ex. Studio, export, quotas, mémoire, mot de passe)..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FFFDF9] dark:bg-[#152023] text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] placeholder-[#8B9390] focus:outline-none focus:border-[#078348] focus:ring-2 focus:ring-[#078348]/20 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-[#77817F] hover:text-[#14282D] dark:hover:text-white flex items-center justify-center text-xs"
                  aria-label="Effacer la recherche"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[11px] text-[#77817F] text-left mt-2 px-1">
                {filteredArticles.length}{' '}
                {filteredArticles.length > 1 ? 'articles trouvés' : 'article trouvé'} pour «{' '}
                <strong className="text-[#14282D] dark:text-[#F3F2EC]">{searchQuery}</strong> »
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {HELP_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setExpandedArticleId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D] shadow-xs'
                    : 'bg-[#FFFDF9] dark:bg-[#152023] text-[#5A6562] dark:text-[#94A09E] border border-[#EAE6DC] dark:border-[#243337] hover:bg-[#F4F1E6] dark:hover:bg-[#1C282C] hover:text-[#14282D]'
                }`}
              >
                <i className={`${cat.icon} text-xs`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Articles List / Accordion */}
        <div className="mt-6 space-y-3.5">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-[#FFFDF9] dark:bg-[#152023] rounded-3xl border border-[#EAE6DC] dark:border-[#243337] p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F1] dark:bg-[#182427] text-[#77817F] flex items-center justify-center mx-auto text-lg">
                <i className="fa-regular fa-folder-open" />
              </div>
              <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                Aucun article ne correspond à votre recherche
              </h3>
              <p className="text-xs text-[#77817F] max-w-md mx-auto">
                Essayez d’élargir vos termes de recherche ou de réinitialiser le filtre de thème.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAE6DC] dark:bg-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] hover:opacity-90 transition-opacity"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isExpanded = expandedArticleId === article.id;
              const catMeta = HELP_CATEGORIES.find((c) => c.id === article.category);

              return (
                <article
                  key={article.id}
                  className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                    isExpanded
                      ? 'bg-[#FFFDF9] dark:bg-[#152023] border-[#078348]/40 shadow-sm'
                      : 'bg-[#FFFDF9] dark:bg-[#152023] border-[#EAE6DC] dark:border-[#243337] hover:border-[#D1CBBF] dark:hover:border-[#32454A]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleArticle(article.id)}
                    className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F2] dark:bg-[#10181A] border border-[#EAE6DC] dark:border-[#243337] text-[10px] font-semibold text-[#77817F] uppercase tracking-wider">
                          <i className={`${catMeta?.icon || 'fa-regular fa-file'} text-[9px]`} />
                          <span>{catMeta?.label || article.category}</span>
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-sm sm:text-base text-[#14282D] dark:text-[#F3F2EC] leading-snug">
                        {article.title}
                      </h2>
                      <p className="text-xs text-[#5A6562] dark:text-[#94A09E] line-clamp-2">
                        {article.summary}
                      </p>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform ${
                        isExpanded
                          ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] border-[#078348]/30 rotate-180'
                          : 'bg-[#FAF8F2] dark:bg-[#182427] text-[#77817F] border-[#EAE6DC] dark:border-[#243337]'
                      }`}
                    >
                      <i className="fa-solid fa-chevron-down text-xs" />
                    </div>
                  </button>

                  {/* Expanded Content View */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-[#EAE6DC]/60 dark:border-[#243337]/60 space-y-3.5 text-xs sm:text-sm text-[#3D4A47] dark:text-[#C5CECB] leading-relaxed">
                      {article.content.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}

                      {article.relatedLink && (
                        <div className="pt-2">
                          <Link
                            to={article.relatedLink.url}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold text-xs hover:opacity-90 transition-opacity"
                          >
                            <span>{article.relatedLink.label}</span>
                            <i className="fa-solid fa-arrow-right text-[10px]" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Support & Real Contact Channels Section */}
        <section className="mt-12 rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF790D]">
                <i className="fa-solid fa-envelope-open-text" />
                <span>Canaux d’assistance surveillés</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#14282D] dark:text-[#F3F2EC]">
                Vous n’avez pas trouvé la réponse à votre question ?
              </h3>
              <p className="text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
                Notre équipe répond aux questions techniques, aux demandes liées aux quotas et aux signalements. Aucun système automatique d’illusion de support n’est utilisé.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/legal/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14282D] dark:bg-[#F3F2EC] text-white dark:text-[#14282D] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <i className="fa-solid fa-headset text-xs" />
                <span>Contacter l’équipe Aura</span>
              </Link>
              <a
                href="mailto:support@aura.ai"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FAF8F2] dark:bg-[#10181A] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F1E6] transition-colors"
              >
                <i className="fa-regular fa-envelope text-xs" />
                <span>support@aura.ai</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#EAE6DC] dark:border-[#243337] bg-[#FAF8F2] dark:bg-[#0E1618] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77817F]">
          <div className="flex items-center gap-2">
            <AuraLogo className="w-5 h-5" />
            <span>© 2026 Aura Platform. Tous droits réservés.</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <Link to="/legal/terms" className="hover:underline">Conditions d’utilisation</Link>
            <Link to="/legal/privacy" className="hover:underline">Politique de confidentialité</Link>
            <Link to="/legal/cookies" className="hover:underline">Cookies</Link>
            <Link to="/legal/notice" className="hover:underline">Mentions légales</Link>
            <Link to="/legal/contact" className="hover:underline">Contact juridique</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
