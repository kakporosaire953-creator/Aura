export type Lang = 'fr' | 'en';
export type Theme = 'light' | 'dark';

export interface Etape {
  num: string;
  icone: string;
  titre: string;
  texte: string;
  mots: string[];
}

export interface Creation {
  titre: string;
  brief: string;
}

export interface Plan {
  nom: string;
  prix: string;
  detail: string;
  vedette: boolean;
  features: string[];
  cta: string;
}

export interface Doc {
  num: string;
  icone: string;
  titre: string;
  texte: string;
  label: string;
}

export interface Content {
  title: string;
  nav: {
    galerie: string;
    documentation: string;
    tarifs: string;
    connexion: string;
    commencer: string;
    themeClair: string;
    themeSombre: string;
  };
  intro: {
    tagline: string;
    skip: string;
  };
  hero: {
    kicker: string;
    ligne1: string;
    ligne2avant: string;
    ligne2italique: string;
    sous: string;
    cta1: string;
    cta2: string;
    energie: string;
    legende: string;
    scroll: string;
  };
  logos: { titre: string };
  bandeau: { mots: string[] };
  fil: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    etapes: Etape[];
  };
  decl: { kicker: string; texte: string; signature: string };
  capacites: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    lignes: { idx: string; icone: string; titre: string; texte: string; mots: string[] }[];
  };
  galerie: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    badge: string;
    note: string;
    creations: Creation[];
  };
  tarifs: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    note: string;
    plans: Plan[];
  };
  cta: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    b1: string;
    b2: string;
    note: string;
  };
  pied: { droits: string; credits: string };
  docs: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    items: Doc[];
    appel: { titre: string; texte: string; btn: string };
  };
  auth: {
    mots: string[];
    film: string;
    cartes: string[];
    titre1: string;
    titre2: string;
    sous: string;
    titreLogin1: string;
    titreLogin2: string;
    sousLogin: string;
    nom: string;
    nomPlaceholder: string;
    email: string;
    mdp: string;
    submit: string;
    submitLogin: string;
    submitEnvoi: string;
    note: string;
    basculeLogin: string;
    basculeRegister: string;
    lienLogin: string;
    lienRegister: string;
    errMdp: string;
    errSaisie: string;
    errExiste: string;
    errIdentifiants: string;
    errStockage: string;
    errLimite: string;
    errServeur: string;
    retour: string;
  };
  espace: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    chargement: string;
    carteCompte: string;
    membre: string;
    deconnecter: string;
    onbTitre: string;
    onbFaitTitre: string;
    onbSous: string;
    onbObjectif: string;
    onbModifier: string;
    onbEnregistrer: string;
    onbEnvoi: string;
    onbEnregistre: string;
    objectifLabel: string;
    objectifs: string[];
    modulesTitre: string;
    dispo: string;
    attente: string;
    lienDocs: string;
    sitePublic: string;
  };
  oops: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    btn: string;
  };
}

const etapesFr: Etape[] = [
  {
    num: '01',
    icone: 'fa-lightbulb',
    titre: 'Réfléchir',
    texte:
      "Tout commence par une conversation. L'idée se clarifie, se découpe, se confronte — jusqu'à ce que le vrai projet apparaisse.",
    mots: ['Conversation', 'Clarification', 'Vision'],
  },
  {
    num: '02',
    icone: 'fa-earth-africa',
    titre: 'Rechercher',
    texte:
      "Aura Explore interroge le web et ne renvoie que des réponses sourcées et traçables. La confiance naît de la preuve.",
    mots: ['Sourcé', 'Traçable', 'Web'],
  },
  {
    num: '03',
    icone: 'fa-wand-magic-sparkles',
    titre: 'Créer',
    texte:
      "Du brief au projet structuré : designs, documents, code. Aura Studio construit, itère, versionne — sous vos yeux.",
    mots: ['Studio', 'Itération', 'Versions'],
  },
  {
    num: '04',
    icone: 'fa-rocket',
    titre: 'Développer',
    texte:
      "Le résultat se livre : code exécutable, exports propres, mission close. De l'idée au résultat, sans rupture de fil.",
    mots: ['Exécution', 'Livrable', 'Résultat'],
  },
];

const etapesEn: Etape[] = [
  {
    num: '01',
    icone: 'fa-lightbulb',
    titre: 'Think',
    texte:
      'It all starts with a conversation. The idea becomes clear, is broken down, is challenged — until the real project emerges.',
    mots: ['Conversation', 'Clarity', 'Vision'],
  },
  {
    num: '02',
    icone: 'fa-earth-africa',
    titre: 'Research',
    texte:
      'Aura Explore searches the web and returns only sourced, traceable answers. Trust is born from evidence.',
    mots: ['Sourced', 'Traceable', 'Web'],
  },
  {
    num: '03',
    icone: 'fa-wand-magic-sparkles',
    titre: 'Create',
    texte:
      'From brief to structured project: designs, documents, code. Aura Studio builds, iterates, versions — before your eyes.',
    mots: ['Studio', 'Iteration', 'Versions'],
  },
  {
    num: '04',
    icone: 'fa-rocket',
    titre: 'Deliver',
    texte:
      'The result ships: clean code, clean exports, mission closed. From idea to result, without losing the thread.',
    mots: ['Execution', 'Deliverable', 'Result'],
  },
];

const contentFr: Content = {
  title: "AURA — De l'idée au résultat.",
  nav: {
    galerie: 'Galerie',
    documentation: 'Documentation',
    tarifs: 'Tarifs',
    connexion: 'Connexion',
    commencer: 'Commencer',
    themeClair: 'Passer en thème clair',
    themeSombre: 'Passer en thème sombre',
  },
  intro: {
    tagline: "DE L'IDÉE AU RÉSULTAT",
    skip: 'Passer',
  },
  hero: {
    kicker: "Plateforme d'intelligence artificielle",
    ligne1: "De l'idée",
    ligne2avant: 'au',
    ligne2italique: 'résultat',
    sous:
      "Conversation, recherche sourcée, création et exécution — un seul fil de pensée qui mène du prompt au livrable. L'IA qui travaille vraiment avec vous.",
    cta1: "Commencer l'expérience",
    cta2: 'Voir la galerie',
    energie:
      "Vert pour l'idée qui pousse. Or pour la valeur créée. Orange pour l'énergie qui livre.",
    legende: "La sculpture vivante d'Aura",
    scroll: 'Défiler',
  },
  logos: { titre: "L'écosystème IA mondial" },
  bandeau: {
    mots: ['Réfléchir', 'Rechercher', 'Créer', 'Développer', 'Livrer'],
  },
  fil: {
    kicker: 'Le fil Aura',
    titre1: 'Un seul fil,',
    titre2: 'quatre gestes',
    sous:
      "Là où d'autres empilent des outils, Aura tient une seule ligne — de la première phrase au résultat final.",
    etapes: etapesFr,
  },
  decl: {
    kicker: 'Manifeste',
    texte:
      "Aura tient le fil : votre première phrase devient un plan, le plan devient une création, la création devient un résultat.",
    signature: 'Une seule ligne, de bout en bout',
  },
  capacites: {
    kicker: 'Capacités',
    titre1: 'Quatre forces,',
    titre2: 'une lumière',
    sous:
      'Chaque capacité pousse dans la continuité des autres. Rien à ré-exporter, rien à re-saisir.',
    lignes: [
      {
        idx: '01',
        icone: 'fa-comments',
        titre: 'Conversations',
        texte:
          "Un fil de pensée qui garde le contexte, explique ses choix et se souvient de vos projets. Pas un chatbot de plus : un partenaire de travail.",
        mots: ['Contexte long', 'Multimodal', 'Mémoire de projet'],
      },
      {
        idx: '02',
        icone: 'fa-magnifying-glass-chart',
        titre: 'Recherche sourcée',
        texte:
          "Explore fouille le web et cite ses sources à chaque affirmation. Les réponses se vérifient, se comparent, se partagent.",
        mots: ['Citations', 'Veille', 'Comparaison'],
      },
      {
        idx: '03',
        icone: 'fa-wand-magic-sparkles',
        titre: 'Studio de création',
        texte:
          "Générez des sites, documents et visuels qui deviennent de vrais projets : versions, aperçus multi-écrans, exports propres.",
        mots: ['Génération', 'Aperçus', 'Export'],
      },
      {
        idx: '04',
        icone: 'fa-list-check',
        titre: 'Missions & projets',
        texte:
          "Découpez un objectif en missions suivies, avec étapes, livrables et quotas clairs. L'ambition devient un plan exécutable.",
        mots: ['Planification', 'Suivi', 'Quotas clairs'],
      },
    ],
  },
  galerie: {
    kicker: 'Galerie Studio',
    titre1: 'Des créations qui',
    titre2: 'respirent',
    sous:
      'Une vitrine de rendus de démonstration — la vitrine du Studio qui ouvre bientôt. Faites défiler pour traverser la galerie.',
    badge: 'Démonstration',
    note:
      'Rendus de démonstration illustratifs — aucune création client réelle n\'est présentée. Le Studio ouvre bientôt.',
    creations: [
      {
        titre: 'Boutique de téléphones — Cotonou',
        brief: 'Brief : e-commerce premium, prix en FCFA, mobile d’abord.',
      },
      {
        titre: 'Studio photo — lumière douce',
        brief: 'Brief : portfolio éditorial, galerie immersive, contact direct.',
      },
      {
        titre: 'Chef cuisinier — table du jour',
        brief: 'Brief : site vitrine gourmand, menu illustré, réservation.',
      },
      {
        titre: 'Fintech — épargne mobile',
        brief: 'Brief : landing rassurante, parcours simple, chiffres clairs.',
      },
      {
        titre: 'Voyage — carnet du Bénin',
        brief: 'Brief : récit de voyage illustré, carte, carnet photo.',
      },
      {
        titre: 'Festival — nuit d’ouverture',
        brief: 'Brief : page événementielle vibrante, programme, billetterie.',
      },
    ],
  },
  tarifs: {
    kicker: 'Tarifs',
    titre1: 'Clair,',
    titre2: 'sans surprise',
    sous:
      'Les contours sont posés — les prix finaux seront annoncés avant l\'ouverture, en toute transparence.',
    note:
      'Aucun prix n\'est figé tant qu\'il n\'est pas définitivement annoncé — pas de mauvaise surprise, jamais.',
    plans: [
      {
        nom: 'Découverte',
        prix: 'Gratuit',
        detail: 'Pour commencer le fil, dès l’ouverture.',
        vedette: false,
        features: [
          '30 unités IA par mois',
          '10 recherches sourcées',
          '3 créations Studio',
          '3 projets actifs',
        ],
        cta: 'Commencer',
      },
      {
        nom: 'Créateur',
        prix: 'Bientôt annoncé',
        detail: 'Pour ceux qui créent tous les jours.',
        vedette: true,
        features: [
          'Unités IA étendues',
          'Créations Studio accrues',
          'Versions illimitées',
          'Exports complets',
        ],
        cta: 'Être prévenu',
      },
      {
        nom: 'Équipe',
        prix: 'Bientôt annoncé',
        detail: 'Pour les collectifs qui avancent ensemble.',
        vedette: false,
        features: [
          'Espace partagé',
          'Rôles & permissions',
          'Quotas mutualisés',
          'Accompagnement dédié',
        ],
        cta: 'Être prévenu',
      },
    ],
  },
  cta: {
    kicker: 'Le chantier est vivant',
    titre1: 'Votre prochaine idée mérite un',
    titre2: 'résultat',
    sous:
      'AURA se construit au grand jour. Le site et l\'identité sont là — les comptes et le moteur IA ouvrent aux prochaines étapes.',
    b1: 'Entrer dans Aura',
    b2: 'Lire la documentation',
    note:
      'Fonctionnement annoncé à l\'état réel uniquement — aucune fonctionnalité simulée.',
  },
  pied: {
    droits: 'tous droits réservés.',
    credits: 'Conçu autour d\'une sculpture : trois rubans, une flamme.',
  },
  docs: {
    kicker: 'Documentation',
    titre1: 'Tout au même endroit,',
    titre2: 'écrit au fil du chantier',
    sous:
      "Guides, réflexes, références : la documentation d'Aura grandit en même temps que le produit — avec la même honnêteté. Les chapitres s'ouvrent au fur et à mesure de leur rédaction.",
    items: [
      {
        num: '01',
        icone: 'fa-rocket',
        titre: 'Démarrage',
        texte:
          "Créer son espace, comprendre le fil et poser sa première intention. Les premiers gestes, pas à pas, sans jargon.",
        label: 'En rédaction',
      },
      {
        num: '02',
        icone: 'fa-film',
        titre: 'Le fil Aura',
        texte:
          "Conversation, contexte, mémoire de projet : bien penser avec Aura, garder le fil du début à la fin.",
        label: 'En rédaction',
      },
      {
        num: '03',
        icone: 'fa-magnifying-glass',
        titre: 'Recherche sourcée',
        texte:
          "Interroger le web, lire les citations, vérifier, comparer, citer. La confiance naît de la preuve.",
        label: 'À venir',
      },
      {
        num: '04',
        icone: 'fa-wand-magic-sparkles',
        titre: 'Studio & créations',
        texte:
          "Générer, itérer, versionner, prévisualiser et exporter proprement — du prompt au livrable.",
        label: 'À venir',
      },
      {
        num: '05',
        icone: 'fa-users',
        titre: 'Comptes & équipes',
        texte:
          "Profils, espaces partagés, rôles et tranquillité des données. Travailler ensemble, sereinement.",
        label: 'À venir',
      },
      {
        num: '06',
        icone: 'fa-code',
        titre: 'API & développeurs',
        texte:
          "Brancher Aura dans vos outils — avec des limites claires et une documentation honnête.",
        label: 'À venir',
      },
    ],
    appel: {
      titre: 'Un chapitre manque ?',
      texte:
        'La documentation se construit avec les vraies questions du chantier. Le fil continue — les réponses suivront ici.',
      btn: "Revenir à l'accueil",
    },
  },
  auth: {
    mots: ['Réfléchir.', 'Rechercher.', 'Créer.', 'Développer.'],
    film:
      'Le fil qui relie votre première phrase au résultat final — avec la lumière du logo, sans jamais rompre le geste.',
    cartes: ['Idée reçue', 'Valeur créée', 'Livré'],
    titre1: 'Bienvenue',
    titre2: 'dans Aura',
    sous: "L'espace de travail où l'idée devient résultat.",
    titreLogin1: 'Content',
    titreLogin2: 'de vous revoir',
    sousLogin: 'Reprenez le fil exactement où vous l\'aviez laissé.',
    nom: 'Nom',
    nomPlaceholder: 'Votre nom',
    email: 'Adresse e-mail',
    mdp: 'Mot de passe',
    submit: 'Créer mon compte',
    submitLogin: 'Se connecter',
    submitEnvoi: 'Un instant…',
    note:
      "Authentification par sessions côté serveur, mots de passe chiffrés (scrypt). Aucun traceur publicitaire.",
    basculeLogin: 'Vous avez déjà un compte ?',
    basculeRegister: 'Pas encore de compte ?',
    lienLogin: 'Se connecter',
    lienRegister: 'Créer un compte',
    errMdp: 'Le mot de passe doit faire au moins 8 caractères.',
    errSaisie: 'Saisie invalide.',
    errExiste: 'Un compte existe déjà avec cette adresse.',
    errIdentifiants: 'Identifiants incorrects.',
    errStockage:
      "Les comptes attendent la configuration du stockage sur cet environnement — l'équipe doit connecter une base (voir la documentation de déploiement).",
    errLimite: 'Trop de tentatives. Réessayez plus tard.',
    errServeur: 'Le service ne répond pas. Réessayez.',
    retour: "Retour à l'accueil",
  },
  espace: {
    kicker: 'Votre espace',
    titre1: 'Le fil',
    titre2: 'vous appartient',
    sous: 'Votre compte, votre premier lancement, et ce qui est réellement disponible.',
    chargement: 'Ouverture de votre espace…',
    carteCompte: 'Votre compte',
    membre: 'Membre depuis',
    deconnecter: 'Se déconnecter',
    onbTitre: 'Votre premier lancement',
    onbFaitTitre: 'Votre profil est prêt',
    onbSous:
      "En quelques secondes : dites-nous ce que vous comptez faire avec Aura. Ce choix est enregistré sur votre compte.",
    onbObjectif: 'Votre objectif',
    onbModifier: 'Modifier',
    onbEnregistrer: 'Enregistrer',
    onbEnvoi: 'Enregistrement…',
    onbEnregistre: 'Profil enregistré. Bienvenue dans Aura.',
    objectifLabel: 'Votre principal objectif',
    objectifs: [
      'Créer des visuels',
      'Rédiger et résumer',
      'Développer des projets',
      'Explorer des sujets',
      'Organiser des missions',
    ],
    modulesTitre: 'État des modules',
    dispo: 'Disponible',
    attente: 'En reconstruction',
    lienDocs: 'Documentation',
    sitePublic: 'Le site public',
  },
  oops: {
    kicker: 'Perdu dans les rubans',
    titre1: "Cette page s'est",
    titre2: 'évaporée',
    sous: 'Le fil se rompt ici — reprenons-le au commencement.',
    btn: "Revenir à l'accueil",
  },
};

const contentEn: Content = {
  title: 'AURA — From idea to result.',
  nav: {
    galerie: 'Gallery',
    documentation: 'Documentation',
    tarifs: 'Pricing',
    connexion: 'Sign in',
    commencer: 'Get started',
    themeClair: 'Switch to light theme',
    themeSombre: 'Switch to dark theme',
  },
  intro: {
    tagline: 'FROM IDEA TO RESULT',
    skip: 'Skip',
  },
  hero: {
    kicker: 'Artificial intelligence platform',
    ligne1: 'From idea',
    ligne2avant: 'to',
    ligne2italique: 'result',
    sous:
      'Conversation, sourced research, creation and execution — a single train of thought from prompt to deliverable. AI that truly works with you.',
    cta1: 'Start the experience',
    cta2: 'See the gallery',
    energie:
      'Green for the idea that grows. Gold for the value created. Orange for the energy that delivers.',
    legende: "Aura's living sculpture",
    scroll: 'Scroll',
  },
  logos: { titre: 'The global AI ecosystem' },
  bandeau: {
    mots: ['Think', 'Research', 'Create', 'Develop', 'Deliver'],
  },
  fil: {
    kicker: 'The Aura thread',
    titre1: 'One thread,',
    titre2: 'four gestures',
    sous:
      'Where others pile up tools, Aura keeps a single line — from the first sentence to the final result.',
    etapes: etapesEn,
  },
  decl: {
    kicker: 'Manifesto',
    texte:
      'Aura keeps the thread: your first sentence becomes a plan, the plan becomes a creation, the creation becomes a result.',
    signature: 'One line, end to end',
  },
  capacites: {
    kicker: 'Capabilities',
    titre1: 'Four strengths,',
    titre2: 'one light',
    sous:
      'Each capability grows in continuity with the others. Nothing to re-export, nothing to re-enter.',
    lignes: [
      {
        idx: '01',
        icone: 'fa-comments',
        titre: 'Conversations',
        texte:
          'A train of thought that keeps context, explains its choices and remembers your projects. Not another chatbot: a working partner.',
        mots: ['Long context', 'Multimodal', 'Project memory'],
      },
      {
        idx: '02',
        icone: 'fa-magnifying-glass-chart',
        titre: 'Sourced research',
        texte:
          'Explore searches the web and cites its sources for every claim. Answers you can verify, compare and share.',
        mots: ['Citations', 'Watch', 'Comparison'],
      },
      {
        idx: '03',
        icone: 'fa-wand-magic-sparkles',
        titre: 'Creation studio',
        texte:
          'Generate sites, documents and visuals that become real projects: versions, multi-screen previews, clean exports.',
        mots: ['Generation', 'Previews', 'Export'],
      },
      {
        idx: '04',
        icone: 'fa-list-check',
        titre: 'Missions & projects',
        texte:
          'Break a goal into tracked missions, with steps, deliverables and clear quotas. Ambition becomes an executable plan.',
        mots: ['Planning', 'Tracking', 'Clear quotas'],
      },
    ],
  },
  galerie: {
    kicker: 'Studio Gallery',
    titre1: 'Creations that',
    titre2: 'breathe',
    sous:
      'A showcase of demonstration renders — the Studio showcase opening soon. Scroll to travel through the gallery.',
    badge: 'Demonstration',
    note:
      'Illustrative demonstration renders — no real client creation is shown. The Studio opens soon.',
    creations: [
      {
        titre: 'Phone shop — Cotonou',
        brief: 'Brief: premium e-commerce, XOF prices, mobile first.',
      },
      {
        titre: 'Photo studio — soft light',
        brief: 'Brief: editorial portfolio, immersive gallery, direct contact.',
      },
      {
        titre: 'Chef — today’s table',
        brief: 'Brief: gourmet showcase site, illustrated menu, booking.',
      },
      {
        titre: 'Fintech — mobile savings',
        brief: 'Brief: reassuring landing, simple journey, clear figures.',
      },
      {
        titre: 'Travel — Benin journal',
        brief: 'Brief: illustrated travel story, map, photo journal.',
      },
      {
        titre: 'Festival — opening night',
        brief: 'Brief: vibrant event page, line-up, ticketing.',
      },
    ],
  },
  tarifs: {
    kicker: 'Pricing',
    titre1: 'Clear,',
    titre2: 'no surprises',
    sous:
      'The outlines are set — final prices will be announced before launch, fully transparent.',
    note:
      'No price is ever set until it is definitively announced — no bad surprises, ever.',
    plans: [
      {
        nom: 'Discovery',
        prix: 'Free',
        detail: 'To start the thread, at launch.',
        vedette: false,
        features: [
          '30 AI units per month',
          '10 sourced searches',
          '3 Studio creations',
          '3 active projects',
        ],
        cta: 'Get started',
      },
      {
        nom: 'Creator',
        prix: 'Announced soon',
        detail: 'For those who create every day.',
        vedette: true,
        features: [
          'Extended AI units',
          'Higher Studio creation quotas',
          'Unlimited versions',
          'Full exports',
        ],
        cta: 'Keep me posted',
      },
      {
        nom: 'Team',
        prix: 'Announced soon',
        detail: 'For teams moving forward together.',
        vedette: false,
        features: [
          'Shared workspace',
          'Roles & permissions',
          'Pooled quotas',
          'Dedicated support',
        ],
        cta: 'Keep me posted',
      },
    ],
  },
  cta: {
    kicker: 'The workshop is alive',
    titre1: 'Your next idea deserves a',
    titre2: 'result',
    sous:
      'AURA is being built in the open. The site and identity are here — accounts and the AI engine open at the next steps.',
    b1: 'Enter Aura',
    b2: 'Read the documentation',
    note: 'Everything is reported at its real status — no simulated feature.',
  },
  pied: {
    droits: 'all rights reserved.',
    credits: 'Designed around a sculpture: three ribbons, one flame.',
  },
  docs: {
    kicker: 'Documentation',
    titre1: 'All in one place,',
    titre2: 'written as the work progresses',
    sous:
      'Guides, habits, references: Aura’s documentation grows alongside the product — with the same honesty. Chapters open as they are written.',
    items: [
      {
        num: '01',
        icone: 'fa-rocket',
        titre: 'Getting started',
        texte:
          'Create your space, understand the thread and set your first intention. The first steps, step by step, no jargon.',
        label: 'Being written',
      },
      {
        num: '02',
        icone: 'fa-film',
        titre: 'The Aura thread',
        texte:
          'Conversation, context, project memory: think well with Aura, keep the thread from start to finish.',
        label: 'Being written',
      },
      {
        num: '03',
        icone: 'fa-magnifying-glass',
        titre: 'Sourced research',
        texte:
          'Search the web, read citations, verify, compare, quote. Trust is born from evidence.',
        label: 'Coming soon',
      },
      {
        num: '04',
        icone: 'fa-wand-magic-sparkles',
        titre: 'Studio & creations',
        texte:
          'Generate, iterate, version, preview and export cleanly — from prompt to deliverable.',
        label: 'Coming soon',
      },
      {
        num: '05',
        icone: 'fa-users',
        titre: 'Accounts & teams',
        texte:
          'Profiles, shared spaces, roles and peaceful data. Work together, serenely.',
        label: 'Coming soon',
      },
      {
        num: '06',
        icone: 'fa-code',
        titre: 'API & developers',
        texte:
          'Plug Aura into your tools — with clear limits and honest documentation.',
        label: 'Coming soon',
      },
    ],
    appel: {
      titre: 'Missing a chapter?',
      texte:
        'The documentation is built from the workshop’s real questions. The thread continues — the answers will follow here.',
      btn: 'Back to home',
    },
  },
  auth: {
    mots: ['Think.', 'Research.', 'Create.', 'Develop.'],
    film:
      'The thread linking your first sentence to the final result — with the light of the logo, never breaking the gesture.',
    cartes: ['Idea received', 'Value created', 'Delivered'],
    titre1: 'Welcome',
    titre2: 'to Aura',
    sous: 'The workspace where ideas become results.',
    titreLogin1: 'Good',
    titreLogin2: 'to see you back',
    sousLogin: 'Pick the thread up exactly where you left it.',
    nom: 'Name',
    nomPlaceholder: 'Your name',
    email: 'Email address',
    mdp: 'Password',
    submit: 'Create my account',
    submitLogin: 'Sign in',
    submitEnvoi: 'One moment…',
    note:
      'Server-side sessions, scrypt-hashed passwords. No advertising trackers.',
    basculeLogin: 'Already have an account?',
    basculeRegister: 'No account yet?',
    lienLogin: 'Sign in',
    lienRegister: 'Create an account',
    errMdp: 'Password must be at least 8 characters.',
    errSaisie: 'Invalid input.',
    errExiste: 'An account already exists with this email.',
    errIdentifiants: 'Incorrect credentials.',
    errStockage:
      'Accounts are waiting for storage configuration on this environment — the team must connect a database (see the deployment documentation).',
    errLimite: 'Too many attempts. Try again later.',
    errServeur: 'The service is not responding. Try again.',
    retour: 'Back to home',
  },
  espace: {
    kicker: 'Your space',
    titre1: 'The thread',
    titre2: 'is yours',
    sous: 'Your account, your first launch, and what is actually available.',
    chargement: 'Opening your space…',
    carteCompte: 'Your account',
    membre: 'Member since',
    deconnecter: 'Sign out',
    onbTitre: 'Your first launch',
    onbFaitTitre: 'Your profile is ready',
    onbSous:
      'In a few seconds: tell us what you plan to do with Aura. This choice is saved to your account.',
    onbObjectif: 'Your goal',
    onbModifier: 'Edit',
    onbEnregistrer: 'Save',
    onbEnvoi: 'Saving…',
    onbEnregistre: 'Profile saved. Welcome to Aura.',
    objectifLabel: 'Your main goal',
    objectifs: [
      'Create visuals',
      'Write and summarize',
      'Build projects',
      'Explore topics',
      'Organize missions',
    ],
    modulesTitre: 'Module status',
    dispo: 'Available',
    attente: 'Being rebuilt',
    lienDocs: 'Documentation',
    sitePublic: 'The public site',
  },
  oops: {
    kicker: 'Lost in the ribbons',
    titre1: 'This page has',
    titre2: 'evaporated',
    sous: 'The thread breaks here — let’s pick it up at the beginning.',
    btn: 'Back to home',
  },
};

export const CONTENT: Record<Lang, Content> = { fr: contentFr, en: contentEn };
