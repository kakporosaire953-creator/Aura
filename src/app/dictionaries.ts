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
    chat: string;
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
    aConfigurer: string;
    lienDocs: string;
    sitePublic: string;
  };
  chat: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    accueil: string;
    suggestions: string[];
    placeholder: string;
    envoyer: string;
    envoi: string;
    reflexion: string;
    errEnvoi: string;
    setupNote: string;
    connexionSous: string;
    connexionBtn: string;
    note: string;
    connecte: string;
  };
  simulation: {
    banniere: string;
    quitter: string;
    reprendre: string;
    demoBtn: string;
    badge: string;
  };
  workspace: {
    accueil: string;
    espace: string;
    chat: string;
    nouveauChat: string;
    historique: string;
    explore: string;
    studio: string;
    missions: string;
    parametres: string;
    menu: string;
    fermer: string;
    replier: string;
    planGratuit: string;
    notifications: string;
    aucuneNotif: string;
    deconnexion: string;
    seConnecter: string;
    nonConnecte: string;
    plus: string;
    plusSous: string;
    plusBtn: string;
    modeClair: string;
    modeSombre: string;
  };
  modulesCartes: Array<{ nom: string; sous: string; icone: string }>;
  explore: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    placeholder: string;
    rechercher: string;
    filtreLabel: string;
    tous: string;
    filtres: string[];
    vide: string;
    ouvrir: string;
    note: string;
  };
  studio: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    consigneLabel: string;
    placeholder: string;
    styleLabel: string;
    styles: string[];
    formatLabel: string;
    formats: string[];
    generer: string;
    generation: string;
    apercuTitre: string;
    badge: string;
    note: string;
  };
  missions: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    nouvellePlaceholder: string;
    nouvelleEtiquette: string;
    ajouter: string;
    colonnes: string[];
    vide: string;
    note: string;
  };
  accueil: {
    bonjour: string;
    prenomDefaut: string;
    tagline1: string;
    taglineAccent1: string;
    tagline2: string;
    taglineAccent2: string;
    sousTitre: string;
    placeholder: string;
    envoyer: string;
    moteurTitre: string;
    moteurSim: string;
    moteurNon: string;
    chipRecherche: string;
    chipCode: string;
    chipMissions: string;
    actionsTitre: string;
    action1Titre: string;
    action1Desc: string;
    action1Prompt: string;
    action2Titre: string;
    action2Desc: string;
    action2Prompt: string;
    action3Titre: string;
    action3Desc: string;
    action3Prompt: string;
    action4Titre: string;
    action4Desc: string;
    action4Prompt: string;
    recentsTitre: string;
    voirTout: string;
    recentsVides: string;
    recentsNote: string;
    typeConversation: string;
    typeProjet: string;
    typeMission: string;
    mot1: string;
    mot2: string;
    mot3: string;
    erreurGenerique: string;
  };
  historique: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    recherchePlaceholder: string;
    sectionDemo: string;
    sectionLocal: string;
    vide: string;
    ouvrir: string;
    supprimer: string;
    messages: string;
    note: string;
  };
  parametres: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    compte: string;
    compteNom: string;
    compteEmail: string;
    apparence: string;
    themeLabel: string;
    themeClair: string;
    themeSombre: string;
    langue: string;
    simulation: string;
    simulationSous: string;
    simulationEtat: string;
    simActive: string;
    simInactive: string;
    session: string;
    deconnexion: string;
    aPropos: string;
    aProposTexte: string;
    docs: string;
    tarifs: string;
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
    chat: 'Chat',
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
    aConfigurer: 'À configurer',
    lienDocs: 'Documentation',
    sitePublic: 'Le site public',
  },
  chat: {
    kicker: 'Chat',
    titre1: 'Une conversation,',
    titre2: 'un vrai résultat',
    sous:
      "Discutez avec Aura — la conversation nourrit le fil qui mène au résultat. Réponses du moteur Gemini, côté serveur.",
    accueil: 'Par quoi commençons-nous ?',
    suggestions: [
      'Aide-moi à clarifier une idée de projet',
      'Résume-moi un texte long en 5 points',
      'Propose-moi un plan pour une présentation',
      'Quelles sont les étapes pour lancer un produit ?',
    ],
    placeholder: 'Écrivez votre message…',
    envoyer: 'Envoyer',
    envoi: 'Envoi…',
    reflexion: 'Aura réfléchit…',
    errEnvoi: "Le message n'est pas parti. Réessayez.",
    setupNote:
      'Chat non configuré sur cet environnement : la clé GEMINI_API_KEY doit être ajoutée côté serveur (elle ne sera jamais exposée au navigateur).',
    connexionSous: 'Connectez-vous pour ouvrir la conversation.',
    connexionBtn: 'Se connecter',
    note:
      'Les réponses sont générées par un modèle IA et peuvent contenir des erreurs — vérifiez ce qui compte.',
    connecte: 'Connecté :',
  },
  simulation: {
    banniere: 'Mode simulation — données locales, aucune donnée envoyée.',
    quitter: 'Quitter la simulation',
    reprendre: 'Reprendre la simulation',
    demoBtn: 'Voir la démonstration',
    badge: 'Simulé',
  },
  workspace: {
    accueil: 'Accueil',
    espace: 'Espace',
    chat: 'Chat',
    nouveauChat: 'Nouveau chat',
    historique: 'Historique',
    explore: 'Explore',
    studio: 'Studio',
    missions: 'Missions',
    parametres: 'Paramètres',
    menu: 'Menu',
    fermer: 'Fermer',
    replier: 'Réduire la barre latérale',
    planGratuit: 'Plan gratuit',
    notifications: 'Notifications',
    aucuneNotif: 'Aucune notification pour l’instant.',
    deconnexion: 'Se déconnecter',
    seConnecter: 'Se connecter',
    nonConnecte: 'Non connecté',
    plus: 'Passez à Aura Plus',
    plusSous: 'Plus de puissance, plus de possibilités.',
    plusBtn: 'Découvrir',
    modeClair: 'Mode clair',
    modeSombre: 'Mode sombre',
  },
  modulesCartes: [
    {
      nom: 'Chat',
      sous: 'Converser avec Aura, du fil au résultat',
      icone: 'fa-comments',
    },
    {
      nom: 'Explore',
      sous: 'Rechercher avec des sources vérifiables',
      icone: 'fa-magnifying-glass',
    },
    {
      nom: 'Studio',
      sous: 'Générer des créations à votre image',
      icone: 'fa-wand-magic-sparkles',
    },
    {
      nom: 'Missions',
      sous: 'Suivre vos projets de bout en bout',
      icone: 'fa-list-check',
    },
  ],
  explore: {
    kicker: 'Explore',
    titre1: 'Des réponses',
    titre2: 'qui montrent leurs sources',
    sous:
      "Posez une question, obtenez une recherche structurée avec les sources vérifiables derrière chaque affirmation.",
    placeholder: 'Rechercher un sujet, une question, un point à vérifier…',
    rechercher: 'Rechercher',
    filtreLabel: 'Filtrer par thème',
    tous: 'Tous',
    filtres: ['Cadrage', 'Produit', 'Design', 'Automatisation', 'Missions'],
    vide: 'Aucun résultat pour cette recherche.',
    ouvrir: 'Ouvrir la source',
    note:
      'Interface de démonstration : les résultats sont des contenus de démo badgés. La recherche sourcée réelle arrivera avec son API dédiée.',
  },
  studio: {
    kicker: 'Studio',
    titre1: 'Votre intention,',
    titre2: 'rendue visible',
    sous:
      "Décrivez ce que vous voulez créer — le Studio prépare les créations, avec des aperçus nets et des styles maîtrisés.",
    consigneLabel: 'Votre consigne',
    placeholder: 'Ex. : une affiche chaleureuse pour un atelier créatif à Cotonou…',
    styleLabel: 'Style',
    styles: ['Ruban', 'Éditorial', 'Sculpture', 'Naturel'],
    formatLabel: 'Format',
    formats: ['Carré', 'Paysage', 'Portrait'],
    generer: 'Générer',
    generation: 'Génération…',
    apercuTitre: 'Aperçus',
    badge: 'Démonstration',
    note:
      'Interface de démonstration : les aperçus sont des visuels de démo. La génération réelle arrivera avec son API dédiée.',
  },
  missions: {
    kicker: 'Missions',
    titre1: 'Vos projets,',
    titre2: 'toujours en mouvement',
    sous:
      'Un tableau clair : ce qui attend, ce qui avance, ce qui est livré. Le fil se voit d’un coup d’œil.',
    nouvellePlaceholder: 'Titre de la nouvelle mission…',
    nouvelleEtiquette: 'Nouveau',
    ajouter: 'Ajouter',
    colonnes: ['À faire', 'En cours', 'Livré'],
    vide: 'Rien pour l’instant.',
    note:
      'Interface de démonstration : le tableau est local à votre navigateur. La synchronisation réelle arrivera avec les missions du moteur.',
  },
  accueil: {
    bonjour: 'Bonjour',
    prenomDefaut: 'à vous',
    tagline1: 'De',
    taglineAccent1: 'l’idée',
    tagline2: 'au',
    taglineAccent2: 'résultat.',
    sousTitre:
      'Je suis Aura, ton assistant IA polyvalent. Je peux t’aider à réfléchir, rechercher, créer, coder et bien plus encore.',
    placeholder: 'Pose-moi une question, demande une création, ou lance une mission…',
    envoyer: 'Envoyer',
    moteurTitre: 'Moteur de conversation',
    moteurSim: 'Mode simulation',
    moteurNon: 'Moteur non configuré',
    chipRecherche: 'Recherche',
    chipCode: 'Code',
    chipMissions: 'Missions',
    actionsTitre: 'Actions rapides',
    action1Titre: 'Créer un site web',
    action1Desc: 'Un site moderne et responsive pour mon projet.',
    action1Prompt: 'Aide-moi à créer un site web moderne et responsive pour mon projet : ',
    action2Titre: 'Analyser un document',
    action2Desc: 'Résume et extrait les infos importantes.',
    action2Prompt: 'Analyse ce document et résume les informations importantes : ',
    action3Titre: 'M’aider à coder',
    action3Desc: 'Corrige, explique ou génère du code.',
    action3Prompt: 'Aide-moi à coder : ',
    action4Titre: 'M’aider à apprendre',
    action4Desc: 'Une explication claire sur un sujet.',
    action4Prompt: 'Explique-moi clairement ce sujet : ',
    recentsTitre: 'Vos récents',
    voirTout: 'Voir tout',
    recentsVides: 'Aucune activité pour l’instant — démarrez une conversation.',
    recentsNote:
      'Vos conversations réelles apparaîtront ici, conservées sur cet appareil.',
    typeConversation: 'Conversation',
    typeProjet: 'Projet',
    typeMission: 'Mission',
    mot1: 'PLUS D’IDÉES',
    mot2: 'PLUS D’ACTION',
    mot3: 'PLUS D’AURA',
    erreurGenerique: 'Une erreur est survenue. Réessayez.',
  },
  historique: {
    kicker: 'Historique',
    titre1: 'Le fil',
    titre2: 'de vos idées',
    sous:
      'Retrouvez vos conversations passées — conservées sur cet appareil, prêtes à être reprises.',
    recherchePlaceholder: 'Rechercher dans l’historique…',
    sectionDemo: 'Conversations de démonstration',
    sectionLocal: 'Sur cet appareil',
    vide: 'Aucune conversation pour l’instant.',
    ouvrir: 'Reprendre',
    supprimer: 'Supprimer',
    messages: 'messages',
    note:
      'Historique local : rien n’est envoyé sur un serveur. La synchronisation des comptes arrivera avec le stockage cloud.',
  },
  parametres: {
    kicker: 'Paramètres',
    titre1: 'À votre',
    titre2: 'mesure',
    sous: 'Langue, thème, simulation : tout ce qui règle vraiment l’application.',
    compte: 'Compte',
    compteNom: 'Nom',
    compteEmail: 'E-mail',
    apparence: 'Apparence',
    themeLabel: 'Thème',
    themeClair: 'Clair',
    themeSombre: 'Sombre',
    langue: 'Langue',
    simulation: 'Simulation',
    simulationSous:
      'Le mode simulation montre les interfaces avec des données locales. Rien de simulé n’est présenté comme réel.',
    simulationEtat: 'État',
    simActive: 'Simulation active',
    simInactive: 'Simulation désactivée',
    session: 'Session',
    deconnexion: 'Se déconnecter',
    aPropos: 'À propos',
    aProposTexte:
      'AURA — De l’idée au résultat. Les tarifs seront annoncés bientôt, sans engagement avant leur publication.',
    docs: 'Documentation',
    tarifs: 'Tarifs',
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
    chat: 'Chat',
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
    aConfigurer: 'Needs setup',
    lienDocs: 'Documentation',
    sitePublic: 'The public site',
  },
  chat: {
    kicker: 'Chat',
    titre1: 'One conversation,',
    titre2: 'a real result',
    sous:
      'Talk with Aura — the conversation feeds the thread that leads to the result. Answers from the Gemini engine, server-side.',
    accueil: 'Where shall we start?',
    suggestions: [
      'Help me clarify a project idea',
      'Summarize a long text in 5 points',
      'Draft a plan for a presentation',
      'What are the steps to launch a product?',
    ],
    placeholder: 'Write your message…',
    envoyer: 'Send',
    envoi: 'Sending…',
    reflexion: 'Aura is thinking…',
    errEnvoi: 'The message did not go through. Try again.',
    setupNote:
      'Chat is not configured on this environment: the GEMINI_API_KEY key must be added server-side (it will never be exposed to the browser).',
    connexionSous: 'Sign in to open the conversation.',
    connexionBtn: 'Sign in',
    note:
      'Answers are generated by an AI model and may contain errors — double-check what matters.',
    connecte: 'Signed in as:',
  },
  simulation: {
    banniere: 'Simulation mode — local data, nothing is sent.',
    quitter: 'Leave simulation',
    reprendre: 'Resume simulation',
    demoBtn: 'Open the demo',
    badge: 'Simulated',
  },
  workspace: {
    accueil: 'Home',
    espace: 'Space',
    chat: 'Chat',
    nouveauChat: 'New chat',
    historique: 'History',
    explore: 'Explore',
    studio: 'Studio',
    missions: 'Missions',
    parametres: 'Settings',
    menu: 'Menu',
    fermer: 'Close',
    replier: 'Collapse sidebar',
    planGratuit: 'Free plan',
    notifications: 'Notifications',
    aucuneNotif: 'No notifications yet.',
    deconnexion: 'Sign out',
    seConnecter: 'Sign in',
    nonConnecte: 'Not signed in',
    plus: 'Upgrade to Aura Plus',
    plusSous: 'More power, more possibilities.',
    plusBtn: 'Discover',
    modeClair: 'Light mode',
    modeSombre: 'Dark mode',
  },
  modulesCartes: [
    {
      nom: 'Chat',
      sous: 'Talk with Aura, from thread to result',
      icone: 'fa-comments',
    },
    {
      nom: 'Explore',
      sous: 'Research with verifiable sources',
      icone: 'fa-magnifying-glass',
    },
    {
      nom: 'Studio',
      sous: 'Generate creations in your image',
      icone: 'fa-wand-magic-sparkles',
    },
    {
      nom: 'Missions',
      sous: 'Track your projects end to end',
      icone: 'fa-list-check',
    },
  ],
  explore: {
    kicker: 'Explore',
    titre1: 'Answers',
    titre2: 'that show their sources',
    sous:
      'Ask a question, get structured research with the verifiable sources behind every claim.',
    placeholder: 'Search a topic, a question, a point to check…',
    rechercher: 'Search',
    filtreLabel: 'Filter by topic',
    tous: 'All',
    filtres: ['Framing', 'Product', 'Design', 'Automation', 'Missions'],
    vide: 'No results for this search.',
    ouvrir: 'Open the source',
    note:
      'Demo interface: results are badged demo content. Real sourced research will arrive with its dedicated API.',
  },
  studio: {
    kicker: 'Studio',
    titre1: 'Your intent,',
    titre2: 'made visible',
    sous:
      'Describe what you want to create — the Studio prepares creations, with sharp previews and mastered styles.',
    consigneLabel: 'Your prompt',
    placeholder: 'E.g. : a warm poster for a creative workshop in Cotonou…',
    styleLabel: 'Style',
    styles: ['Ribbon', 'Editorial', 'Sculpture', 'Natural'],
    formatLabel: 'Format',
    formats: ['Square', 'Landscape', 'Portrait'],
    generer: 'Generate',
    generation: 'Generating…',
    apercuTitre: 'Previews',
    badge: 'Demo',
    note:
      'Demo interface: previews are demo visuals. Real generation will arrive with its dedicated API.',
  },
  missions: {
    kicker: 'Missions',
    titre1: 'Your projects,',
    titre2: 'always moving',
    sous:
      'A clear board: what waits, what moves, what ships. The thread at a glance.',
    nouvellePlaceholder: 'Title of the new mission…',
    nouvelleEtiquette: 'New',
    ajouter: 'Add',
    colonnes: ['To do', 'In progress', 'Shipped'],
    vide: 'Nothing for now.',
    note:
      'Demo interface: the board is local to your browser. Real sync will arrive with the engine missions.',
  },
  accueil: {
    bonjour: 'Hello',
    prenomDefaut: 'there',
    tagline1: 'From',
    taglineAccent1: 'idea',
    tagline2: 'to',
    taglineAccent2: 'result.',
    sousTitre:
      'I’m Aura, your versatile AI assistant. I can help you think, research, create, code and much more.',
    placeholder: 'Ask me a question, request a creation, or start a mission…',
    envoyer: 'Send',
    moteurTitre: 'Conversation engine',
    moteurSim: 'Simulation mode',
    moteurNon: 'Engine not configured',
    chipRecherche: 'Research',
    chipCode: 'Code',
    chipMissions: 'Missions',
    actionsTitre: 'Quick actions',
    action1Titre: 'Create a website',
    action1Desc: 'A modern, responsive site for my project.',
    action1Prompt: 'Help me create a modern, responsive website for my project: ',
    action2Titre: 'Analyze a document',
    action2Desc: 'Summarize and extract key information.',
    action2Prompt: 'Analyze this document and summarize the key information: ',
    action3Titre: 'Help me code',
    action3Desc: 'Fix, explain or generate code.',
    action3Prompt: 'Help me code: ',
    action4Titre: 'Help me learn',
    action4Desc: 'A clear explanation of any topic.',
    action4Prompt: 'Explain this topic clearly: ',
    recentsTitre: 'Your recents',
    voirTout: 'See all',
    recentsVides: 'No activity yet — start a conversation.',
    recentsNote: 'Your real conversations will appear here, kept on this device.',
    typeConversation: 'Conversation',
    typeProjet: 'Project',
    typeMission: 'Mission',
    mot1: 'MORE IDEAS',
    mot2: 'MORE ACTION',
    mot3: 'MORE AURA',
    erreurGenerique: 'Something went wrong. Please try again.',
  },
  historique: {
    kicker: 'History',
    titre1: 'The thread',
    titre2: 'of your ideas',
    sous: 'Find your past conversations — kept on this device, ready to resume.',
    recherchePlaceholder: 'Search history…',
    sectionDemo: 'Demo conversations',
    sectionLocal: 'On this device',
    vide: 'No conversations yet.',
    ouvrir: 'Resume',
    supprimer: 'Delete',
    messages: 'messages',
    note:
      'Local history: nothing is sent to a server. Account sync will arrive with cloud storage.',
  },
  parametres: {
    kicker: 'Settings',
    titre1: 'Made',
    titre2: 'for you',
    sous: 'Language, theme, simulation: everything that truly configures the app.',
    compte: 'Account',
    compteNom: 'Name',
    compteEmail: 'Email',
    apparence: 'Appearance',
    themeLabel: 'Theme',
    themeClair: 'Light',
    themeSombre: 'Dark',
    langue: 'Language',
    simulation: 'Simulation',
    simulationSous:
      'Simulation mode shows the interfaces with local data. Nothing simulated is presented as real.',
    simulationEtat: 'State',
    simActive: 'Simulation on',
    simInactive: 'Simulation off',
    session: 'Session',
    deconnexion: 'Sign out',
    aPropos: 'About',
    aProposTexte:
      'AURA — From idea to result. Pricing will be announced soon, with no commitment before publication.',
    docs: 'Documentation',
    tarifs: 'Pricing',
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
