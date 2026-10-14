export type PlanId = 'free' | 'plus' | 'pro';

export type UsageCategory =
  | 'chat'
  | 'search'
  | 'studio_creation'
  | 'studio_modification'
  | 'slides'
  | 'media';

export interface PlanLimits {
  /** Nombre total d'unités d'usage IA par mois */
  monthlyAIUnits: number;
  /** Nombre de recherches web sourcées par mois (Aura Explore) */
  monthlyWebSearches: number;
  /** Nombre de nouvelles créations complètes de sites web/apps par mois (Aura Studio) */
  monthlySiteCreations: number;
  /** Nombre d'itérations et modifications de sites par mois */
  monthlySiteModifications: number;
  /** Nombre maximal de projets simultanés enregistrés */
  maxProjects: number;
  /** Durée de rétention de l'historique en jours */
  historyRetentionDays: number;
  /** Taille maximale des pièces jointes en Mo */
  maxAttachmentSizeMb: number;
  /** Nombre de requêtes IA simultanées autorisées */
  maxConcurrentRequests: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  badgeFr: string;
  badgeEn: string;
  priceDisplayFr: string;
  priceDisplayEn: string;
  pricePeriodFr: string;
  pricePeriodEn: string;
  limits: PlanLimits;
  featuresFr: string[];
  featuresEn: string[];
  isPopular?: boolean;
  status: 'active' | 'waitlist' | 'coming_soon';
  statusNoteFr: string;
  statusNoteEn: string;
}

/**
 * Coût en unités d'usage IA par opération.
 * Une génération complexe consomme plus d'unités qu'un simple message de chat.
 */
export const CATEGORY_UNIT_COSTS: Record<UsageCategory, number> = {
  chat: 1,
  search: 1,
  studio_modification: 1,
  slides: 2,
  media: 2,
  studio_creation: 3,
};

/**
 * Classifies an incoming AI request into the appropriate usage category
 * to apply the right quota and unit cost.
 */
export function classifyUsageCategory(params: {
  mode: string;
  hasActiveCode?: boolean;
}): UsageCategory {
  if (params.mode === 'search') return 'search';
  if (params.mode === 'slides') return 'slides';
  if (params.mode === 'image' || params.mode === 'video') return 'media';
  if (params.mode === 'code' || params.mode === 'create') {
    return params.hasActiveCode ? 'studio_modification' : 'studio_creation';
  }
  return 'chat';
}

export const AURA_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Aura Free',
    tagline: 'Découvrez Aura et réalisez vos premiers projets avec des quotas maîtrisés.',
    badgeFr: '100% Gratuit',
    badgeEn: '100% Free',
    priceDisplayFr: '0 F CFA',
    priceDisplayEn: '$0',
    pricePeriodFr: 'pour toujours',
    pricePeriodEn: 'forever',
    limits: {
      monthlyAIUnits: 30,
      monthlyWebSearches: 10,
      monthlySiteCreations: 3,
      monthlySiteModifications: 10,
      maxProjects: 3,
      historyRetentionDays: 30,
      maxAttachmentSizeMb: 10,
      maxConcurrentRequests: 1,
    },
    featuresFr: [
      '30 unités d’usage IA par mois',
      '10 recherches web sourcées avec Aura Explore',
      '3 créations de sites web dans Aura Studio',
      '10 modifications & itérations de code',
      '3 projets enregistrés dans votre espace',
      'Historique conservé 30 jours',
      'Accès aux modèles natifs Gemini 3.8 Flash',
      'Export de code HTML/CSS/JS et archives .ZIP',
    ],
    featuresEn: [
      '30 AI usage units per month',
      '10 sourced web searches with Aura Explore',
      '3 full website creations in Aura Studio',
      '10 code iterations & modifications',
      '3 saved projects in your workspace',
      '30-day history retention',
      'Access to native Gemini 3.8 Flash engine',
      'HTML/CSS/JS code export and .ZIP downloads',
    ],
    status: 'active',
    statusNoteFr: 'Offre active par défaut pour chaque membre.',
    statusNoteEn: 'Active default tier for all members.',
  },
  plus: {
    id: 'plus',
    name: 'Aura Plus',
    tagline: 'Pour les créateurs, freelances et professionnels réguliers.',
    badgeFr: 'Abonnement Individuel',
    badgeEn: 'Individual Subscription',
    priceDisplayFr: 'Tarif en évaluation',
    priceDisplayEn: 'Pricing under review',
    pricePeriodFr: 'par mois',
    pricePeriodEn: 'per month',
    isPopular: true,
    limits: {
      monthlyAIUnits: 250,
      monthlyWebSearches: 50,
      monthlySiteCreations: 25,
      monthlySiteModifications: 100,
      maxProjects: 20,
      historyRetentionDays: 180,
      maxAttachmentSizeMb: 25,
      maxConcurrentRequests: 2,
    },
    featuresFr: [
      '250 unités d’usage IA par mois (x8 par rapport au Free)',
      '50 recherches web approfondies multi-sources',
      '25 créations complètes de sites web & apps',
      '100 modifications et itérations avancées',
      'Jusqu’à 20 projets organisés',
      'Historique conservé 6 mois (180 jours)',
      'Génération de présentations Slides 16:9 et exports PDF HD',
      'Accès prioritaire aux modèles haute intensité',
      'Support prioritaire par e-mail',
    ],
    featuresEn: [
      '250 AI usage units per month (8x increase)',
      '50 in-depth multi-source web investigations',
      '25 full website & application creations',
      '100 advanced iterations and modifications',
      'Up to 20 organized projects',
      '6-month history retention (180 days)',
      '16:9 Slide Deck generation & HD PDF exports',
      'Priority access to high-intensity engines',
      'Priority email assistance',
    ],
    status: 'waitlist',
    statusNoteFr: 'Tarification en cours de finalisation selon les coûts réels d’inférence.',
    statusNoteEn: 'Pricing under review based on real infrastructure and inference costs.',
  },
  pro: {
    id: 'pro',
    name: 'Aura Pro',
    tagline: 'Puissance maximale pour équipes et créateurs intensifs.',
    badgeFr: 'Offre Future',
    badgeEn: 'Future Tier',
    priceDisplayFr: 'Prochainement',
    priceDisplayEn: 'Coming soon',
    pricePeriodFr: 'sur devis / par mois',
    pricePeriodEn: 'per month',
    limits: {
      monthlyAIUnits: 1000,
      monthlyWebSearches: 200,
      monthlySiteCreations: 100,
      monthlySiteModifications: 500,
      maxProjects: 100,
      historyRetentionDays: 365,
      maxAttachmentSizeMb: 50,
      maxConcurrentRequests: 4,
    },
    featuresFr: [
      '1 000 unités d’usage IA par mois',
      'Recherches web et synthèses documentaires illimitées en pratique',
      '100 créations de sites web et prototypes complets',
      '500 itérations et versions de code',
      'Projets et bibliothèques étendus (jusqu’à 100)',
      'Historique conservé 1 an complet',
      'Support technique dédié et intégrations personnalisées',
    ],
    featuresEn: [
      '1,000 AI usage units per month',
      'Extensive web research and document synthesis',
      '100 full web apps and prototypes created',
      '500 code versions and iterations',
      'Up to 100 active projects and libraries',
      '1 full year history retention',
      'Dedicated technical support & custom integrations',
    ],
    status: 'coming_soon',
    statusNoteFr: 'Architecture prévue pour l’échelle équipe et usage intensif.',
    statusNoteEn: 'Planned architecture for team scale and heavy workloads.',
  },
};

export interface UserSubscriptionState {
  userId: string;
  planId: PlanId;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider?: 'stripe' | 'fedapay' | 'kkiapay' | 'none';
  externalSubscriptionId?: string;
  updatedAt: string;
}

export interface DetailedUsageRecord {
  periodMonth: string; // YYYY-MM
  periodStart: string;
  periodEnd: string;
  planId: PlanId;
  totalUnitsUsed: number;
  totalUnitsLimit: number;
  webSearchesUsed: number;
  webSearchesLimit: number;
  siteCreationsUsed: number;
  siteCreationsLimit: number;
  siteModificationsUsed: number;
  siteModificationsLimit: number;
  activeProjectsCount: number;
  maxProjectsLimit: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  byCategory: Record<UsageCategory, number>;
  byModel: Record<string, number>;
}

export interface UsageLedgerEntry {
  id: string;
  userId: string;
  operationId: string;
  category: UsageCategory;
  unitsDeducted: number;
  modelId: string;
  providerId: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: string;
  status: 'reserved' | 'committed' | 'released' | 'quota_exceeded';
  note?: string;
}
