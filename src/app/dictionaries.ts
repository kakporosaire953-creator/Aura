import type { ModeChat } from '../services/types';

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
    ariaLabel: string;
    menuOuvrir: string;
    menuFermer: string;
    contenu: string;
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
    paiementNote: string;
    inclusTitre: string;
    inclus: string[];
    plans: Plan[];
  };
  vision: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    axes: { icone: string; titre: string; texte: string; statut: string }[];
    note: string;
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
    sommaireLabel: string;
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
    indispoTitre: string;
    indispoStockage: string;
    indispoReseau: string;
    reessayer: string;
    sessionExpiree: string;
    confirmerTitre: string;
    confirmerSous: string;
    confirmerAide: string;
    confirmerEnvoye: string;
    confirmerIndisponible: string;
    confirmerRefus: string;
    confirmerLimite: string;
    confirmerRenvoyer: string;
    confirmerDeconnexion: string;
    googleBouton: string;
    googleOu: string;
    googleAnnule: string;
    googleExpire: string;
    googleEchec: string;
    googleIndisponible: string;
    googleConflit: string;
    googleStockage: string;
  };
  securite: {
    oubliTitre1: string;
    oubliTitre2: string;
    oubliSous: string;
    oubliSubmit: string;
    oubliEnvoi: string;
    oubliEnvoye: string;
    oubliNote: string;
    resetTitre1: string;
    resetTitre2: string;
    resetSous: string;
    resetNouveau: string;
    resetConfirmer: string;
    resetSubmit: string;
    resetEnvoi: string;
    resetFait: string;
    resetAllerConnexion: string;
    resetInvalide: string;
    resetExpire: string;
    resetCourt: string;
    resetDifferents: string;
    verifTitre: string;
    verifEnCours: string;
    verifOk: string;
    verifOkSous: string;
    verifEchec: string;
    verifEchecSous: string;
    verifContinuer: string;
    mdpTitre: string;
    mdpSous: string;
    mdpActuel: string;
    mdpNouveau: string;
    mdpConfirmer: string;
    mdpBouton: string;
    mdpEnvoi: string;
    mdpFait: string;
    mdpIncorrect: string;
    mdpCourt: string;
    mdpIdentique: string;
    mdpDifferents: string;
    sessionsTitre: string;
    sessionsSous: string;
    sessionsVide: string;
    sessionCourante: string;
    sessionDerniereActivite: string;
    sessionRevoquer: string;
    sessionsRevoquerAutres: string;
    sessionsFermees: string;
    emailVerifie: string;
    emailNonVerifie: string;
    connexionTitre: string;
    connexionSous: string;
    connexionGoogle: string;
    connexionLie: string;
    connexionNonLie: string;
    connexionMdpDefini: string;
    connexionMdpNon: string;
    mdpDefinirSous: string;
    mdpDefinirBouton: string;
    emailBandeau: string;
    emailRenvoyer: string;
    emailEnvoye: string;
    emailDejaVerifie: string;
    mailIndisponible: string;
    erreur: string;
    limite: string;
    chargement: string;
    retourConnexion: string;
    lienInvalide: string;
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
    sourceIndispo: string;
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
    deplacer: string;
    supprimer: string;
    progression: string;
    colonnes: string[];
    vide: string;
    note: string;
  };
  composeur: {
    joindre: string;
    retirer: string;
    maxImages: string;
    imageIllisible: string;
    mode: string;
    modeAide: string;
    modeImageAide: string;
    modes: Record<ModeChat, string>;
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
  ws: {
    navPrincipal: string;
    navPersonnel: string;
    vueEnsemble: string;
    assistant: string;
    projetsNav: string;
    explorerNav: string;
    missionsNav: string;
    studioNav: string;
    historiqueNav: string;
    memoireNav: string;
    parametresNav: string;
    nouvelleConv: string;
    nouveauProjet: string;
    bonjour: string;
    bonjourDefaut: string;
    introAide: string;
    continuTitre: string;
    continuVide: string;
    reprendre: string;
    enCoursTitre: string;
    actionsRapides: string;
    actionQuestion: string;
    actionProjet: string;
    actionMission: string;
    actionDocument: string;
    conversationsTitre: string;
    renommer: string;
    supprimerConfirme: string;
    convVide: string;
    arreter: string;
    regenerer: string;
    copier: string;
    copie: string;
    streamEnCours: string;
    interrompuNote: string;
    contexteUtilise: string;
    memoiresUtilisees: string;
    projetsTitre: string;
    projetNouveau: string;
    nomLabel: string;
    descriptionLabel: string;
    objectifLabel: string;
    categorieLabel: string;
    instructionsLabel: string;
    instructionsAide: string;
    archiver: string;
    desarchiver: string;
    confirmerSuppr: string;
    ongletApercu: string;
    ongletConvs: string;
    ongletMissions: string;
    ongletCreations: string;
    ongletMemoire: string;
    ongletRecherches: string;
    vueListe: string;
    vueKanban: string;
    vueEcheances: string;
    nouvelleMission: string;
    prioriteLabel: string;
    echeanceLabel: string;
    sousTachesLabel: string;
    ajouterSousTache: string;
    notesLabel: string;
    aideIa: string;
    aideIaPlaceholder: string;
    aideIaNote: string;
    propositionTitre: string;
    validerProposition: string;
    statutAFaire: string;
    statutEnCours: string;
    statutEnAttente: string;
    statutTerminee: string;
    statutArchivee: string;
    prioBasse: string;
    prioMoyenne: string;
    prioHaute: string;
    prioUrgente: string;
    memoireTitre: string;
    memoireSous: string;
    ajouterMemoire: string;
    typeMemoireLabel: string;
    memoireActive: string;
    memoireInactive: string;
    toutEffacer: string;
    confirmerVider: string;
    memoireVide: string;
    noteConfidentialite: string;
    recherchePlaceholder: string;
    lancer: string;
    sourcesTitre: string;
    aucuneSource: string;
    sansResultat: string;
    enregistrerProjet: string;
    devenirMission: string;
    devenirDocument: string;
    historiqueRecherches: string;
    typeCreationLabel: string;
    instructionLabel: string;
    generer: string;
    versionsTitre: string;
    versionNumero: string;
    exporter: string;
    reviser: string;
    revisionPlaceholder: string;
    aucuneCreation: string;
    profilContextuel: string;
    profilSous: string;
    paysLabel: string;
    villeLabel: string;
    deviseLabel: string;
    fuseauLabel: string;
    unitesLabel: string;
    metriques: string;
    imperiales: string;
    domaineLabel: string;
    languePrincipaleLabel: string;
    languesSecondairesLabel: string;
    preferencesTitre: string;
    tonLabel: string;
    tonConcis: string;
    tonDetaille: string;
    tonPedagogique: string;
    utiliserMemoireLabel: string;
    langueReponseLabel: string;
    langueAuto: string;
    enregistrer: string;
    enregistre: string;
    localNote: string;
    localNoteTitre: string;
    dicter: string;
    lireVoix: string;
    arreterLecture: string;
    confirmer: string;
    annuler: string;
    reessayer: string;
    retour: string;
    indisponible: string;
    configRequise: string;
    dangerZone: string;
    dangerSous: string;
    supprimerCompte: string;
    supprimerCompteAvertissement: string;
    supprimerCompteConfirmeLabel: string;
    supprimerCompteConfirmeValeur: string;
    motDePasseLabel: string;
    compteSupprime: string;
    exportPdf: string;
    exporterWord: string;
    exporterPptx: string;
    exporterXlsx: string;
    exporterCsv: string;
    exporterTxt: string;
    exporterHtml: string;
    exporterMarkdown: string;
    exporterChoisir: string;
  };
  admin: {
    titre: string;
    sous: string;
    accesRefuse: string;
    nonConfigure: string;
    statsTitre: string;
    comptes: string;
    verifies: string;
    google: string;
    bannis: string;
    sessionsActives: string;
    inscriptions7j: string;
    conversations: string;
    messages: string;
    creations: string;
    rechercheLabel: string;
    recherchePlaceholder: string;
    rechercher: string;
    colonnesUtilisateur: string;
    colonnesCree: string;
    colonnesEtat: string;
    colonnesSessions: string;
    colonnesActions: string;
    verifie: string;
    nonVerifie: string;
    googleLie: string;
    banni: string;
    voir: string;
    bannir: string;
    debannir: string;
    revoquer: string;
    supprimer: string;
    fermer: string;
    bannirTitre: string;
    motifLabel: string;
    motifPlaceholder: string;
    bannirConfirmer: string;
    supprimerTitre: string;
    supprimerAide: string;
    supprimerConfirmer: string;
    journalTitre: string;
    journalVide: string;
    chargement: string;
    aucunResultat: string;
    erreur: string;
    faitBanni: string;
    faitDebanni: string;
    faitSessions: string;
    faitSupprime: string;
    page: string;
    precedent: string;
    suivant: string;
    detailTitre: string;
    activite: string;
    sessionsTitre: string;
    derniereActivite: string;
    appareil: string;
    jamais: string;
  };
  pwa: {
    installer: string;
    installerTexte: string;
    installee: string;
    application: string;
    applicationSous: string;
    miseAJour: string;
    recharger: string;
    iosAide: string;
    androidAide: string;
    ordinateurAide: string;
    horsLigneTitre: string;
    horsLigneTexte: string;
  };
}

const etapesFr: Etape[] = [
  {
    num: '01',
    icone: 'lightbulb',
    titre: 'Réfléchir',
    texte:
      "Tout commence par une conversation. L'idée se clarifie, se découpe, se confronte — jusqu'à ce que le vrai projet apparaisse.",
    mots: ['Conversation', 'Clarification', 'Vision'],
  },
  {
    num: '02',
    icone: 'earth-africa',
    titre: 'Rechercher',
    texte:
      "Aura Explore interroge le web et ne renvoie que des réponses sourcées et traçables. La confiance naît de la preuve.",
    mots: ['Sourcé', 'Traçable', 'Web'],
  },
  {
    num: '03',
    icone: 'wand-magic-sparkles',
    titre: 'Créer',
    texte:
      "Du brief au projet structuré : designs, documents, code. Aura Studio construit, itère, versionne — sous vos yeux.",
    mots: ['Studio', 'Itération', 'Versions'],
  },
  {
    num: '04',
    icone: 'rocket',
    titre: 'Développer',
    texte:
      "Le résultat se livre : code exécutable, exports propres, mission close. De l'idée au résultat, sans rupture de fil.",
    mots: ['Exécution', 'Livrable', 'Résultat'],
  },
];

const etapesEn: Etape[] = [
  {
    num: '01',
    icone: 'lightbulb',
    titre: 'Think',
    texte:
      'It all starts with a conversation. The idea becomes clear, is broken down, is challenged — until the real project emerges.',
    mots: ['Conversation', 'Clarity', 'Vision'],
  },
  {
    num: '02',
    icone: 'earth-africa',
    titre: 'Research',
    texte:
      'Aura Explore searches the web and returns only sourced, traceable answers. Trust is born from evidence.',
    mots: ['Sourced', 'Traceable', 'Web'],
  },
  {
    num: '03',
    icone: 'wand-magic-sparkles',
    titre: 'Create',
    texte:
      'From brief to structured project: designs, documents, code. Aura Studio builds, iterates, versions — before your eyes.',
    mots: ['Studio', 'Iteration', 'Versions'],
  },
  {
    num: '04',
    icone: 'rocket',
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
    ariaLabel: 'Navigation principale',
    menuOuvrir: 'Ouvrir le menu',
    menuFermer: 'Fermer le menu',
    contenu: 'Aller au contenu principal',
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
        icone: 'comments',
        titre: 'Conversations',
        texte:
          "Un fil de pensée qui garde le contexte, explique ses choix et se souvient de vos projets. Pas un chatbot de plus : un partenaire de travail.",
        mots: ['Contexte long', 'Multimodal', 'Mémoire de projet'],
      },
      {
        idx: '02',
        icone: 'magnifying-glass-chart',
        titre: 'Recherche sourcée',
        texte:
          "Explore fouille le web et cite ses sources à chaque affirmation. Les réponses se vérifient, se comparent, se partagent.",
        mots: ['Citations', 'Veille', 'Comparaison'],
      },
      {
        idx: '03',
        icone: 'wand-magic-sparkles',
        titre: 'Studio de création',
        texte:
          "Générez des sites, documents et visuels qui deviennent de vrais projets : versions, aperçus multi-écrans, exports propres.",
        mots: ['Génération', 'Aperçus', 'Export'],
      },
      {
        idx: '04',
        icone: 'list-check',
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
      'Des tarifs simples en francs CFA, sans engagement caché. Choisissez le rythme qui vous convient.',
    note:
      'Les trois formules ouvrent aujourd’hui les mêmes fonctionnalités ; leurs droits respectifs seront précisés avant l’ouverture des abonnements.',
    paiementNote:
      'Le paiement en ligne n’est pas encore disponible : aucune transaction ne peut être effectuée pour le moment.',
    inclusTitre: 'Inclus dans chaque formule',
    inclus: [
      'Assistant conversationnel en continu',
      'Projets, missions et suivi',
      'Recherche sourcée avec références',
      'Studio de créations',
      'Historique et mémoire de projet',
    ],
    plans: [
      { nom: 'Mensuelle', prix: '500 FCFA', detail: 'par mois', vedette: false, cta: 'Créer un compte' },
      { nom: 'Mensuelle', prix: '1 500 FCFA', detail: 'par mois', vedette: false, cta: 'Créer un compte' },
      { nom: 'Annuelle', prix: '20 000 FCFA', detail: 'par an', vedette: false, cta: 'Créer un compte' },
    ],
  },
  vision: {
    kicker: 'Notre direction',
    titre1: 'Un assistant qui comprend',
    titre2: 'le Bénin et l’Afrique',
    sous:
      'AURA ne peut pas se contenter des usages des grandes plateformes internationales : il doit progressivement comprendre les réalités, les besoins et les contextes de ses utilisateurs, à commencer par le Bénin. Voici la direction — honnêtement présentée, avec ce qui existe et ce qui reste à construire.',
    axes: [
      {
        icone: 'map-location-dot',
        titre: 'Comprendre le contexte béninois',
        texte:
          'Culture et patrimoine, géographie, éducation, entrepreneuriat, services administratifs : AURA devra s’appuyer sur des sources fiables et actualisées — recherche documentaire, base de connaissances locale, sources officielles — et reconnaître ses incertitudes plutôt que d’inventer.',
        statut: 'En préparation',
      },
      {
        icone: 'language',
        titre: 'Les langues locales',
        texte:
          'Le Fon constitue une piste prioritaire à étudier ; les autres langues suivront selon les besoins des utilisateurs et les ressources disponibles. Compréhension, traduction, expressions locales : aucune langue ne sera annoncée comme prise en charge avant d’avoir été testée avec des locuteurs compétents.',
        statut: 'Phase d’étude',
      },
      {
        icone: 'microphone',
        titre: 'La voix, naturellement',
        texte:
          'Parler à AURA dans sa langue : dictée (parole → texte), compréhension, réponse, puis lecture vocale. Accents, bruit ambiant, confidentialité et consentement des enregistrements sont au cœur de cette évolution — aucun bouton microphone fantôme ne sera affiché avant que cela fonctionne réellement.',
        statut: 'À venir',
      },
    ],
    note:
      'Ces axes sont présentés comme une direction produit : ils ne sont pas encore des fonctionnalités disponibles dans AURA aujourd’hui.',
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
    sommaireLabel: 'Sommaire de la documentation',
    items: [
      {
        num: '01',
        icone: 'rocket',
        titre: 'Démarrage',
        texte:
          "Créer son espace, comprendre le fil et poser sa première intention. Les premiers gestes, pas à pas, sans jargon.",
        label: 'En rédaction',
      },
      {
        num: '02',
        icone: 'film',
        titre: 'Le fil Aura',
        texte:
          "Conversation, contexte, mémoire de projet : bien penser avec Aura, garder le fil du début à la fin.",
        label: 'En rédaction',
      },
      {
        num: '03',
        icone: 'magnifying-glass',
        titre: 'Recherche sourcée',
        texte:
          "Interroger le web, lire les citations, vérifier, comparer, citer. La confiance naît de la preuve.",
        label: 'À venir',
      },
      {
        num: '04',
        icone: 'wand-magic-sparkles',
        titre: 'Studio & créations',
        texte:
          "Générer, itérer, versionner, prévisualiser et exporter proprement — du prompt au livrable.",
        label: 'À venir',
      },
      {
        num: '05',
        icone: 'users',
        titre: 'Comptes & équipes',
        texte:
          "Profils, espaces partagés, rôles et tranquillité des données. Travailler ensemble, sereinement.",
        label: 'À venir',
      },
      {
        num: '06',
        icone: 'code',
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
    indispoTitre: 'Votre espace est momentanément indisponible',
    indispoStockage:
      "Le stockage des comptes ne répond pas. Votre session n'est pas perdue : rien n'a été supprimé, réessayez dans un instant.",
    indispoReseau:
      "Le service ne répond pas. Vérifiez votre connexion, puis réessayez : votre session est conservée.",
    reessayer: 'Réessayer',
    sessionExpiree: 'Votre session a expiré. Reconnectez-vous pour reprendre le fil.',
    confirmerTitre: 'Confirmez votre adresse',
    confirmerSous:
      'Votre espace s’ouvrira dès que vous aurez cliqué sur le lien envoyé par e-mail. C’est ce qui évite qu’une adresse soit utilisée sans l’accord de son propriétaire.',
    confirmerAide: 'Vous n’avez rien reçu ? Vérifiez les indésirables, puis demandez un nouveau lien.',
    confirmerEnvoye: 'Un nouvel e-mail vient de partir. Le lien précédent a été invalidé.',
    confirmerIndisponible:
      'L’envoi d’e-mails n’est pas configuré sur cet environnement : aucun lien ne peut partir pour le moment.',
    confirmerRefus:
      'L’envoi a échoué de notre côté : le service d’e-mails a refusé le message. Réessayez dans quelques minutes ; si cela persiste, signalez-le.',
    confirmerLimite:
      'Trop de demandes de renvoi en peu de temps. Réessayez dans une heure.',
    confirmerRenvoyer: 'Renvoyer le lien',
    confirmerDeconnexion: 'Se déconnecter',
    googleBouton: 'Continuer avec Google',
    googleOu: 'ou',
    googleAnnule:
      'Connexion Google annulée. Vous pouvez réessayer, ou vous connecter avec votre mot de passe.',
    googleExpire: 'La connexion Google a expiré. Réessayez.',
    googleEchec: 'Google n’a pas confirmé la connexion. Réessayez dans un instant.',
    googleIndisponible:
      'La connexion Google n’est pas configurée sur cet environnement : utilisez votre mot de passe.',
    googleConflit: 'Cette adresse est déjà liée à un autre compte Google.',
    googleStockage: 'Service momentanément indisponible. Réessayez dans un instant.',
  },
  securite: {
    oubliTitre1: 'Mot de passe',
    oubliTitre2: 'oublié',
    oubliSous:
      "Indiquez l'adresse de votre compte : si elle existe, un lien de réinitialisation vous parviendra dans les minutes qui suivent.",
    oubliSubmit: 'Recevoir le lien',
    oubliEnvoi: 'Envoi…',
    oubliEnvoye:
      "Si un compte est associé à cette adresse, un e-mail vient de partir. Le lien est valable 30 minutes et ne sert qu'une fois.",
    oubliNote:
      "Nous ne dirons jamais ici si une adresse possède un compte : cette page répond de la même façon dans tous les cas.",
    resetTitre1: 'Choisissez un',
    resetTitre2: 'nouveau mot de passe',
    resetSous:
      'Ce lien ne peut servir qu’une fois. Après le changement, toutes les sessions ouvertes sur votre compte seront fermées.',
    resetNouveau: 'Nouveau mot de passe',
    resetConfirmer: 'Confirmer le mot de passe',
    resetSubmit: 'Enregistrer le mot de passe',
    resetEnvoi: 'Enregistrement…',
    resetFait: 'Mot de passe modifié. Toutes les sessions ont été fermées.',
    resetAllerConnexion: 'Se connecter',
    resetInvalide: 'Ce lien n’est pas valide ou a déjà été utilisé. Demandez-en un nouveau.',
    resetExpire: 'Ce lien a expiré. Demandez-en un nouveau.',
    resetCourt: 'Choisissez au moins 8 caractères.',
    resetDifferents: 'Les deux mots de passe ne correspondent pas.',
    verifTitre: 'Confirmation de votre adresse',
    verifEnCours: 'Vérification du lien…',
    verifOk: 'Adresse confirmée',
    verifOkSous: 'Votre adresse est confirmée : vous pourrez récupérer votre compte si nécessaire.',
    verifEchec: 'Lien inutilisable',
    verifEchecSous: 'Ce lien a expiré ou a déjà servi. Demandez un nouvel envoi depuis vos paramètres.',
    verifContinuer: 'Ouvrir mon espace',
    mdpTitre: 'Mot de passe',
    mdpSous: 'Changer votre mot de passe ferme toutes les autres sessions, sans vous déconnecter.',
    mdpActuel: 'Mot de passe actuel',
    mdpNouveau: 'Nouveau mot de passe',
    mdpConfirmer: 'Confirmer le nouveau mot de passe',
    mdpBouton: 'Changer le mot de passe',
    mdpEnvoi: 'Changement…',
    mdpFait: 'Mot de passe changé.',
    mdpIncorrect: 'Mot de passe actuel incorrect.',
    mdpCourt: 'Choisissez au moins 8 caractères.',
    mdpIdentique: 'Choisissez un mot de passe différent de l’actuel.',
    mdpDifferents: 'Les deux mots de passe ne correspondent pas.',
    sessionsTitre: 'Sessions actives',
    sessionsSous: 'Appareils connectés à votre compte. Fermez ce que vous ne reconnaissez pas.',
    sessionsVide: 'Aucune autre session ouverte.',
    sessionCourante: 'Cet appareil',
    sessionDerniereActivite: 'Dernière activité',
    sessionRevoquer: 'Fermer',
    sessionsRevoquerAutres: 'Fermer toutes les autres sessions',
    sessionsFermees: 'session(s) fermée(s)',
    emailVerifie: 'Adresse confirmée',
    emailNonVerifie: 'Adresse non confirmée',
    connexionTitre: 'Mode de connexion',
    connexionSous:
      'Ce qui permet réellement d’ouvrir ce compte aujourd’hui. Rien n’est affiché par défaut : chaque ligne reflète l’état enregistré.',
    connexionGoogle: 'Connexion Google',
    connexionLie: 'Rattachée',
    connexionNonLie: 'Non rattachée',
    connexionMdpDefini: 'Défini',
    connexionMdpNon: 'Aucun mot de passe',
    mdpDefinirSous:
      'Ce compte a été ouvert avec Google : aucun mot de passe n’existe encore. Définissez-en un pour pouvoir aussi vous connecter sans Google. Vos autres sessions seront fermées.',
    mdpDefinirBouton: 'Définir un mot de passe',
    emailBandeau: 'Confirmez votre adresse pour pouvoir récupérer votre compte plus tard.',
    emailRenvoyer: 'Renvoyer le lien',
    emailEnvoye: 'Lien envoyé. Pensez à vérifier vos indésirables.',
    emailDejaVerifie: 'Cette adresse est déjà confirmée.',
    mailIndisponible:
      "L'envoi d'e-mails n'est pas configuré sur cet environnement : aucun message ne peut partir pour l'instant.",
    erreur: 'Le service ne répond pas. Réessayez.',
    limite: 'Trop de tentatives. Réessayez dans quelques minutes.',
    chargement: 'Chargement…',
    retourConnexion: 'Retour à la connexion',
    lienInvalide: 'Lien incomplet ou invalide.',
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
      'Discutez avec Aura — la conversation nourrit le fil qui mène au résultat. Réponses générées côté serveur par des moteurs IA externes.',
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
      'Chat non configuré sur cet environnement : un moteur IA doit être configuré côté serveur (les clés ne sont jamais exposées au navigateur).',
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
      icone: 'comments',
    },
    {
      nom: 'Explore',
      sous: 'Rechercher avec des sources vérifiables',
      icone: 'magnifying-glass',
    },
    {
      nom: 'Studio',
      sous: 'Générer des créations à votre image',
      icone: 'wand-magic-sparkles',
    },
    {
      nom: 'Missions',
      sous: 'Suivre vos projets de bout en bout',
      icone: 'list-check',
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
    sourceIndispo: 'Source de démonstration indisponible',
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
    styles: ['Ruban', 'Éditorial', 'Sculpture', 'Naturel', 'Publication', 'Présentation', 'Code', 'Plan', 'Créatif'],
    formatLabel: 'Format',
    formats: ['Carré', 'Paysage', 'Portrait'],
    generer: 'Générer',
    generation: 'Génération…',
    apercuTitre: 'Aperçus',
    badge: 'Démonstration',
    note:
      'Démonstration : aucun modèle de génération n’est encore connecté. L’affichage simule une génération avec des visuels prédéfinis, clairement badgés — aucune image n’est créée par une IA.',
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
    deplacer: 'Déplacer dans la colonne suivante',
    supprimer: 'Supprimer la mission',
    progression: 'Progression',
    colonnes: ['À faire', 'En cours', 'Livré'],
    vide: 'Rien pour l’instant.',
    note:
      'Vos missions sont conservées localement dans ce navigateur uniquement, sans compte ni serveur : elles ne suivent pas d’un appareil à l’autre et disparaissent si vous effacez les données du site.',
  },
  composeur: {
    joindre: 'Joindre une image',
    retirer: 'Retirer',
    maxImages: 'Trois images au maximum par message.',
    imageIllisible: 'Cette image n’a pas pu être lue.',
    mode: 'Mode de travail',
    modeAide: 'Change la façon dont AURA traite votre demande.',
    modeImageAide: 'Le mode vaut pour les messages sans image : une image est traitée par le moteur qui sait la lire.',
    modes: {
      conversation: 'Aura',
      raisonnement: 'Réflexion',
      code: 'Code',
      recherche: 'Recherche',
    },
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
  ws: {
    navPrincipal: 'Principal',
    navPersonnel: 'Personnel',
    vueEnsemble: 'Vue d’ensemble',
    assistant: 'Assistant',
    projetsNav: 'Projets',
    explorerNav: 'Explorer',
    missionsNav: 'Missions',
    studioNav: 'Studio',
    historiqueNav: 'Historique',
    memoireNav: 'Mémoire AURA',
    parametresNav: 'Paramètres',
    nouvelleConv: 'Nouvelle conversation',
    nouveauProjet: 'Nouveau projet',
    bonjour: 'Bonjour',
    bonjourDefaut: 'et bienvenue',
    introAide: 'Que puis-je accomplir pour vous aujourd’hui ?',
    continuTitre: 'Reprendre le travail',
    continuVide: 'Rien à reprendre pour l’instant — commencez par une conversation ou un projet.',
    reprendre: 'Reprendre',
    enCoursTitre: 'En cours',
    actionsRapides: 'Actions rapides',
    actionQuestion: 'Poser une question',
    actionProjet: 'Créer un projet',
    actionMission: 'Créer une mission',
    actionDocument: 'Générer un document',
    conversationsTitre: 'Conversations',
    renommer: 'Renommer',
    supprimerConfirme: 'Supprimer définitivement ? Cette action est irréversible.',
    convVide: 'Aucune conversation.',
    arreter: 'Arrêter la génération',
    regenerer: 'Régénérer',
    copier: 'Copier',
    copie: 'Copié',
    streamEnCours: 'Aura rédige…',
    interrompuNote: 'Réponse interrompue',
    contexteUtilise: 'Contexte utilisé',
    memoiresUtilisees: 'mémoires',
    projetsTitre: 'Projets',
    projetNouveau: 'Nouveau projet',
    nomLabel: 'Nom',
    descriptionLabel: 'Description',
    objectifLabel: 'Objectif',
    categorieLabel: 'Catégorie',
    instructionsLabel: 'Instructions du projet',
    instructionsAide:
      'Ces instructions sont transmises à l’assistant lorsque vous travaillez dans ce projet.',
    archiver: 'Archiver',
    desarchiver: 'Désarchiver',
    confirmerSuppr: 'Supprimer cet élément ? Cette action est irréversible.',
    ongletApercu: 'Aperçu',
    ongletConvs: 'Conversations',
    ongletMissions: 'Missions',
    ongletCreations: 'Créations',
    ongletMemoire: 'Mémoire',
    ongletRecherches: 'Recherches',
    vueListe: 'Liste',
    vueKanban: 'Tableau',
    vueEcheances: 'Échéances',
    nouvelleMission: 'Nouvelle mission',
    prioriteLabel: 'Priorité',
    echeanceLabel: 'Échéance',
    sousTachesLabel: 'Sous-tâches',
    ajouterSousTache: 'Ajouter une sous-tâche',
    notesLabel: 'Notes',
    aideIa: 'Décomposer avec AURA',
    aideIaPlaceholder: 'Décrivez votre objectif…',
    aideIaNote: 'AURA propose un plan — vous validez ou modifiez avant tout enregistrement.',
    propositionTitre: 'Proposition de missions',
    validerProposition: 'Valider et créer',
    statutAFaire: 'À faire',
    statutEnCours: 'En cours',
    statutEnAttente: 'En attente',
    statutTerminee: 'Terminée',
    statutArchivee: 'Archivée',
    prioBasse: 'Basse',
    prioMoyenne: 'Moyenne',
    prioHaute: 'Haute',
    prioUrgente: 'Urgente',
    memoireTitre: 'Mémoire AURA',
    memoireSous:
      'Les informations qu’AURA peut utiliser pour vous servir. Vous gardez le contrôle : ajoutez, modifiez, désactivez, effacez.',
    ajouterMemoire: 'Mémoriser une information',
    typeMemoireLabel: 'Type',
    memoireActive: 'Active',
    memoireInactive: 'Désactivée',
    toutEffacer: 'Tout effacer',
    confirmerVider: 'Effacer toute la mémoire ? Cette action est irréversible.',
    memoireVide: 'Aucune information mémorisée.',
    noteConfidentialite:
      'La mémoire ne contient jamais vos mots de passe. Elle est propre à votre compte et n’est jamais partagée.',
    recherchePlaceholder: 'Rechercher une information vérifiée…',
    lancer: 'Rechercher',
    sourcesTitre: 'Sources',
    aucuneSource: 'Aucune source vérifiable trouvée.',
    sansResultat: 'Aucun résultat exploitable pour cette recherche.',
    enregistrerProjet: 'Associer à un projet',
    devenirMission: 'Devenir une mission',
    devenirDocument: 'Devenir un document',
    historiqueRecherches: 'Recherches sauvegardées',
    typeCreationLabel: 'Type de création',
    instructionLabel: 'Instruction',
    generer: 'Générer',
    versionsTitre: 'Versions',
    versionNumero: 'Version',
    exporter: 'Exporter (Markdown)',
    reviser: 'Réviser',
    revisionPlaceholder: 'Décrivez la révision souhaitée…',
    aucuneCreation: 'Aucune création pour l’instant.',
    profilContextuel: 'Profil contextuel (AURA Local)',
    profilSous:
      'Ces informations aident AURA à adapter ses réponses (devise, unités, langue, contexte). Elles restent privées et modifiables à tout moment.',
    paysLabel: 'Pays',
    villeLabel: 'Région ou ville',
    deviseLabel: 'Devise préférée',
    fuseauLabel: 'Fuseau horaire',
    unitesLabel: 'Unités de mesure',
    metriques: 'Métriques',
    imperiales: 'Impériales',
    domaineLabel: 'Domaine d’activité',
    languePrincipaleLabel: 'Langue principale',
    languesSecondairesLabel: 'Langues secondaires',
    preferencesTitre: 'Préférences de réponse',
    tonLabel: 'Ton des réponses',
    tonConcis: 'Concis',
    tonDetaille: 'Détaillé',
    tonPedagogique: 'Pédagogique',
    utiliserMemoireLabel: 'Autoriser l’usage de la mémoire dans les réponses',
    langueReponseLabel: 'Langue des réponses',
    langueAuto: 'Suivre la conversation',
    enregistrer: 'Enregistrer',
    enregistre: 'Enregistré',
    localNoteTitre: 'AURA Local',
    localNote:
      'AURA n’invente pas de faits locaux : le contexte que vous renseignez sert uniquement à adapter les exemples, et les informations non vérifiées sont signalées comme telles.',
    dicter: 'Dicter',
    lireVoix: 'Lire à voix haute',
    arreterLecture: 'Arrêter la lecture',
    confirmer: 'Confirmer',
    annuler: 'Annuler',
    reessayer: 'Réessayer',
    retour: 'Retour',
    indisponible: 'Indisponible',
    configRequise: 'Configuration requise',
    dangerZone: 'Zone sensible',
    dangerSous: 'Ces actions affectent durablement votre compte.',
    supprimerCompte: 'Supprimer mon compte',
    supprimerCompteAvertissement:
      'Cette action est définitive : vos conversations, projets, missions, mémoires et créations seront supprimés, ainsi que toutes vos sessions. Aucune récupération ne sera possible.',
    supprimerCompteConfirmeLabel: 'Pour confirmer, saisissez :',
    supprimerCompteConfirmeValeur: 'SUPPRIMER',
    motDePasseLabel: 'Mot de passe',
    compteSupprime: 'Votre compte a été supprimé.',
    exportPdf: 'PDF',
    exporterWord: 'Word (.docx)',
    exporterPptx: 'PowerPoint (.pptx)',
    exporterXlsx: 'Excel (.xlsx)',
    exporterCsv: 'CSV (.csv)',
    exporterTxt: 'Texte (.txt)',
    exporterHtml: 'Page HTML (.html)',
    exporterMarkdown: 'Markdown (.md)',
    exporterChoisir: 'Choisir un format…',
  },
  admin: {
    titre: 'Administration',
    sous: 'Vue réelle des comptes et modération. Chaque action est journalisée.',
    accesRefuse: 'Cette page est réservée à l’administration.',
    nonConfigure:
      'L’administration n’est pas configurée sur cet environnement : ajoutez AURA_ADMIN_EMAILS côté serveur.',
    statsTitre: 'Vue d’ensemble',
    comptes: 'Comptes',
    verifies: 'Adresses confirmées',
    google: 'Comptes Google',
    bannis: 'Comptes suspendus',
    sessionsActives: 'Sessions actives',
    inscriptions7j: 'Inscriptions (7 j)',
    conversations: 'Conversations',
    messages: 'Messages',
    creations: 'Créations',
    rechercheLabel: 'Rechercher un compte',
    recherchePlaceholder: 'Adresse, nom ou identifiant',
    rechercher: 'Rechercher',
    colonnesUtilisateur: 'Compte',
    colonnesCree: 'Créé le',
    colonnesEtat: 'État',
    colonnesSessions: 'Sessions',
    colonnesActions: 'Actions',
    verifie: 'Confirmé',
    nonVerifie: 'Non confirmé',
    googleLie: 'Google',
    banni: 'Suspendu',
    voir: 'Détail',
    bannir: 'Suspendre',
    debannir: 'Rétablir',
    revoquer: 'Fermer les sessions',
    supprimer: 'Supprimer',
    fermer: 'Fermer',
    bannirTitre: 'Suspendre ce compte',
    motifLabel: 'Motif (facultatif, visible dans le journal)',
    motifPlaceholder: 'Ex. usage abusif, fraude…',
    bannirConfirmer: 'Confirmer la suspension',
    supprimerTitre: 'Supprimer définitivement ce compte',
    supprimerAide:
      'Les conversations, projets, missions et créations seront supprimés avec le compte. Saisissez l’adresse exacte pour confirmer.',
    supprimerConfirmer: 'Supprimer définitivement',
    journalTitre: 'Journal des actions',
    journalVide: 'Aucune action enregistrée pour le moment.',
    chargement: 'Chargement…',
    aucunResultat: 'Aucun compte ne correspond à cette recherche.',
    erreur: 'L’action n’a pas abouti. Réessayez.',
    faitBanni: 'Compte suspendu, sessions fermées.',
    faitDebanni: 'Compte rétabli.',
    faitSessions: 'Sessions fermées.',
    faitSupprime: 'Compte supprimé.',
    page: 'Page',
    precedent: 'Précédent',
    suivant: 'Suivant',
    detailTitre: 'Détail du compte',
    activite: 'Activité',
    sessionsTitre: 'Sessions',
    derniereActivite: 'Dernière activité',
    appareil: 'Appareil',
    jamais: 'jamais',
  },
  pwa: {
    installer: 'Installer Aura',
    installerTexte:
      'Aura s’ouvre alors comme une application : plein écran, sans barre d’adresse.',
    installee: 'Aura est installée sur cet appareil.',
    application: 'Application',
    applicationSous:
      'Aura peut s’installer sur cet appareil. Rien n’est téléchargé depuis une boutique : le navigateur ajoute l’application à votre écran d’accueil.',
    miseAJour: 'Une nouvelle version d’Aura est prête.',
    recharger: 'Recharger',
    iosAide:
      'Sur iPhone ou iPad : bouton Partager, puis « Sur l’écran d’accueil ».',
    androidAide:
      'Sur Android : menu ⋮ de Chrome, puis « Installer l’application » (ou « Ajouter à l’écran d’accueil »).',
    ordinateurAide:
      'Sur ordinateur : icône d’installation dans la barre d’adresse de Chrome ou Edge.',
    horsLigneTitre: 'Hors ligne',
    horsLigneTexte:
      'Sans réseau, Aura rouvre les pages déjà visitées. Les conversations, la recherche et les créations reprennent dès que la connexion revient — rien n’est perdu.',
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
    ariaLabel: 'Main navigation',
    menuOuvrir: 'Open menu',
    menuFermer: 'Close menu',
    contenu: 'Skip to main content',
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
        icone: 'comments',
        titre: 'Conversations',
        texte:
          'A train of thought that keeps context, explains its choices and remembers your projects. Not another chatbot: a working partner.',
        mots: ['Long context', 'Multimodal', 'Project memory'],
      },
      {
        idx: '02',
        icone: 'magnifying-glass-chart',
        titre: 'Sourced research',
        texte:
          'Explore searches the web and cites its sources for every claim. Answers you can verify, compare and share.',
        mots: ['Citations', 'Watch', 'Comparison'],
      },
      {
        idx: '03',
        icone: 'wand-magic-sparkles',
        titre: 'Creation studio',
        texte:
          'Generate sites, documents and visuals that become real projects: versions, multi-screen previews, clean exports.',
        mots: ['Generation', 'Previews', 'Export'],
      },
      {
        idx: '04',
        icone: 'list-check',
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
      'Simple prices in CFA francs, with no hidden commitment. Choose the pace that suits you.',
    note:
      'All three plans currently open the same features; their respective entitlements will be clarified before subscriptions open.',
    paiementNote:
      'Online payment is not available yet: no transaction can be made at the moment.',
    inclusTitre: 'Included in every plan',
    inclus: [
      'Continuous conversational assistant',
      'Projects, missions and tracking',
      'Sourced search with references',
      'Creation studio',
      'History and project memory',
    ],
    plans: [
      { nom: 'Monthly', prix: '500 FCFA', detail: 'per month', vedette: false, cta: 'Create an account' },
      { nom: 'Monthly', prix: '1,500 FCFA', detail: 'per month', vedette: false, cta: 'Create an account' },
      { nom: 'Annual', prix: '20,000 FCFA', detail: 'per year', vedette: false, cta: 'Create an account' },
    ],
  },
  vision: {
    kicker: 'Our direction',
    titre1: 'An assistant that understands',
    titre2: 'Benin and Africa',
    sous:
      'AURA cannot settle for the habits of large international platforms: it must gradually understand the realities, needs and contexts of its users, starting with Benin. Here is the direction — presented honestly, with what exists and what remains to be built.',
    axes: [
      {
        icone: 'map-location-dot',
        titre: 'Understanding the Beninese context',
        texte:
          'Culture and heritage, geography, education, entrepreneurship, public services: AURA will rely on reliable, up-to-date sources — documentary research, local knowledge bases, official sources — and will acknowledge its uncertainties rather than inventing.',
        statut: 'In preparation',
      },
      {
        icone: 'language',
        titre: 'Local languages',
        texte:
          'Fon is a priority language to study; others will follow based on user needs and available resources. Understanding, translation, local expressions: no language will be announced as supported before being tested with fluent speakers.',
        statut: 'Study phase',
      },
      {
        icone: 'microphone',
        titre: 'Voice, naturally',
        texte:
          'Talk to AURA in your language: dictation (speech to text), understanding, response, then spoken playback. Accents, ambient noise, privacy and consent for recordings are at the heart of this evolution — no phantom microphone button will be shown before it truly works.',
        statut: 'Coming later',
      },
    ],
    note:
      'These axes are presented as a product direction: they are not yet features available in AURA today.',
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
    sommaireLabel: 'Documentation summary',
    items: [
      {
        num: '01',
        icone: 'rocket',
        titre: 'Getting started',
        texte:
          'Create your space, understand the thread and set your first intention. The first steps, step by step, no jargon.',
        label: 'Being written',
      },
      {
        num: '02',
        icone: 'film',
        titre: 'The Aura thread',
        texte:
          'Conversation, context, project memory: think well with Aura, keep the thread from start to finish.',
        label: 'Being written',
      },
      {
        num: '03',
        icone: 'magnifying-glass',
        titre: 'Sourced research',
        texte:
          'Search the web, read citations, verify, compare, quote. Trust is born from evidence.',
        label: 'Coming soon',
      },
      {
        num: '04',
        icone: 'wand-magic-sparkles',
        titre: 'Studio & creations',
        texte:
          'Generate, iterate, version, preview and export cleanly — from prompt to deliverable.',
        label: 'Coming soon',
      },
      {
        num: '05',
        icone: 'users',
        titre: 'Accounts & teams',
        texte:
          'Profiles, shared spaces, roles and peaceful data. Work together, serenely.',
        label: 'Coming soon',
      },
      {
        num: '06',
        icone: 'code',
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
    indispoTitre: 'Your workspace is temporarily unavailable',
    indispoStockage:
      'Account storage is not responding. Your session is not lost: nothing was deleted, try again in a moment.',
    indispoReseau:
      'The service is not responding. Check your connection, then try again: your session is kept.',
    reessayer: 'Try again',
    sessionExpiree: 'Your session has expired. Sign in again to pick up the thread.',
    confirmerTitre: 'Confirm your address',
    confirmerSous:
      'Your workspace opens as soon as you click the link we emailed you. It is what prevents an address from being used without its owner’s consent.',
    confirmerAide: 'Nothing received? Check your spam folder, then ask for a new link.',
    confirmerEnvoye: 'A new e-mail has just been sent. The previous link is now invalid.',
    confirmerIndisponible:
      'E-mail delivery is not configured on this environment: no link can be sent for now.',
    confirmerRefus:
      'Sending failed on our side: the e-mail service refused the message. Try again in a few minutes; if it persists, let us know.',
    confirmerLimite:
      'Too many resend requests in a short time. Try again in an hour.',
    confirmerRenvoyer: 'Resend the link',
    confirmerDeconnexion: 'Sign out',
    googleBouton: 'Continue with Google',
    googleOu: 'or',
    googleAnnule: 'Google sign-in cancelled. Try again, or sign in with your password.',
    googleExpire: 'The Google sign-in expired. Try again.',
    googleEchec: 'Google did not confirm the sign-in. Try again in a moment.',
    googleIndisponible: 'Google sign-in is not configured on this environment: use your password.',
    googleConflit: 'This address is already linked to another Google account.',
    googleStockage: 'Service temporarily unavailable. Try again in a moment.',
  },
  securite: {
    oubliTitre1: 'Forgotten',
    oubliTitre2: 'password',
    oubliSous:
      'Enter your account address: if it exists, a reset link will reach you within minutes.',
    oubliSubmit: 'Send the link',
    oubliEnvoi: 'Sending…',
    oubliEnvoye:
      'If an account matches this address, an email has just been sent. The link is valid for 30 minutes and works only once.',
    oubliNote:
      'We never reveal whether an address has an account: this page answers the same way every time.',
    resetTitre1: 'Choose a',
    resetTitre2: 'new password',
    resetSous:
      'This link works only once. After the change, every session open on your account will be closed.',
    resetNouveau: 'New password',
    resetConfirmer: 'Confirm password',
    resetSubmit: 'Save password',
    resetEnvoi: 'Saving…',
    resetFait: 'Password changed. All sessions have been closed.',
    resetAllerConnexion: 'Sign in',
    resetInvalide: 'This link is not valid or has already been used. Request a new one.',
    resetExpire: 'This link has expired. Request a new one.',
    resetCourt: 'Choose at least 8 characters.',
    resetDifferents: 'The two passwords do not match.',
    verifTitre: 'Confirming your address',
    verifEnCours: 'Checking the link…',
    verifOk: 'Address confirmed',
    verifOkSous: 'Your address is confirmed: you will be able to recover your account if needed.',
    verifEchec: 'Unusable link',
    verifEchecSous: 'This link expired or was already used. Request a new one from your settings.',
    verifContinuer: 'Open my workspace',
    mdpTitre: 'Password',
    mdpSous: 'Changing your password closes every other session, without signing you out.',
    mdpActuel: 'Current password',
    mdpNouveau: 'New password',
    mdpConfirmer: 'Confirm new password',
    mdpBouton: 'Change password',
    mdpEnvoi: 'Changing…',
    mdpFait: 'Password changed.',
    mdpIncorrect: 'Current password is incorrect.',
    mdpCourt: 'Choose at least 8 characters.',
    mdpIdentique: 'Choose a password different from the current one.',
    mdpDifferents: 'The two passwords do not match.',
    sessionsTitre: 'Active sessions',
    sessionsSous: 'Devices signed in to your account. Close anything you do not recognise.',
    sessionsVide: 'No other open session.',
    sessionCourante: 'This device',
    sessionDerniereActivite: 'Last activity',
    sessionRevoquer: 'Close',
    sessionsRevoquerAutres: 'Close all other sessions',
    sessionsFermees: 'session(s) closed',
    emailVerifie: 'Address confirmed',
    emailNonVerifie: 'Address not confirmed',
    connexionTitre: 'Sign-in methods',
    connexionSous:
      'What can actually open this account today. Nothing is assumed: each line reflects the recorded state.',
    connexionGoogle: 'Google sign-in',
    connexionLie: 'Linked',
    connexionNonLie: 'Not linked',
    connexionMdpDefini: 'Set',
    connexionMdpNon: 'No password',
    mdpDefinirSous:
      'This account was opened with Google, so no password exists yet. Set one to be able to sign in without Google too. Your other sessions will be closed.',
    mdpDefinirBouton: 'Set a password',
    emailBandeau: 'Confirm your address so you can recover your account later.',
    emailRenvoyer: 'Resend the link',
    emailEnvoye: 'Link sent. Check your spam folder.',
    emailDejaVerifie: 'This address is already confirmed.',
    mailIndisponible:
      'Email delivery is not configured on this environment: no message can be sent right now.',
    erreur: 'The service is not responding. Try again.',
    limite: 'Too many attempts. Try again in a few minutes.',
    chargement: 'Loading…',
    retourConnexion: 'Back to sign in',
    lienInvalide: 'Incomplete or invalid link.',
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
      'Talk with Aura — the conversation feeds the thread that leads to the result. Answers generated server-side by external AI engines.',
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
      'Chat is not configured on this environment: an AI engine must be set up server-side (keys are never exposed to the browser).',
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
      icone: 'comments',
    },
    {
      nom: 'Explore',
      sous: 'Research with verifiable sources',
      icone: 'magnifying-glass',
    },
    {
      nom: 'Studio',
      sous: 'Generate creations in your image',
      icone: 'wand-magic-sparkles',
    },
    {
      nom: 'Missions',
      sous: 'Track your projects end to end',
      icone: 'list-check',
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
    sourceIndispo: 'Demo source unavailable',
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
    styles: ['Ribbon', 'Editorial', 'Sculpture', 'Natural', 'Publication', 'Presentation', 'Code', 'Plan', 'Creative'],
    formatLabel: 'Format',
    formats: ['Square', 'Landscape', 'Portrait'],
    generer: 'Generate',
    generation: 'Generating…',
    apercuTitre: 'Previews',
    badge: 'Demo',
    note:
      'Demo: no generation model is connected yet. The display simulates a generation with clearly badged predefined visuals — no image is created by AI.',
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
    deplacer: 'Move to the next column',
    supprimer: 'Delete the mission',
    progression: 'Progress',
    colonnes: ['To do', 'In progress', 'Shipped'],
    vide: 'Nothing for now.',
    note:
      'Your missions are kept locally in this browser only, with no account or server: they do not follow you across devices and disappear if you clear site data.',
  },
  composeur: {
    joindre: 'Attach an image',
    retirer: 'Remove',
    maxImages: 'Three images maximum per message.',
    imageIllisible: 'This image could not be read.',
    mode: 'Working mode',
    modeAide: 'Changes how AURA handles your request.',
    modeImageAide: 'The mode applies to messages without an image: an image is handled by an engine that can read it.',
    modes: {
      conversation: 'Aura',
      raisonnement: 'Reasoning',
      code: 'Code',
      recherche: 'Research',
    },
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
  ws: {
    navPrincipal: 'Main',
    navPersonnel: 'Personal',
    vueEnsemble: 'Overview',
    assistant: 'Assistant',
    projetsNav: 'Projects',
    explorerNav: 'Explorer',
    missionsNav: 'Missions',
    studioNav: 'Studio',
    historiqueNav: 'History',
    memoireNav: 'AURA Memory',
    parametresNav: 'Settings',
    nouvelleConv: 'New conversation',
    nouveauProjet: 'New project',
    bonjour: 'Hello',
    bonjourDefaut: 'and welcome',
    introAide: 'What can I accomplish for you today?',
    continuTitre: 'Continue your work',
    continuVide: 'Nothing to resume yet — start with a conversation or a project.',
    reprendre: 'Resume',
    enCoursTitre: 'In progress',
    actionsRapides: 'Quick actions',
    actionQuestion: 'Ask a question',
    actionProjet: 'Create a project',
    actionMission: 'Create a mission',
    actionDocument: 'Generate a document',
    conversationsTitre: 'Conversations',
    renommer: 'Rename',
    supprimerConfirme: 'Delete permanently? This cannot be undone.',
    convVide: 'No conversations.',
    arreter: 'Stop generation',
    regenerer: 'Regenerate',
    copier: 'Copy',
    copie: 'Copied',
    streamEnCours: 'Aura is writing…',
    interrompuNote: 'Answer interrupted',
    contexteUtilise: 'Context used',
    memoiresUtilisees: 'memories',
    projetsTitre: 'Projects',
    projetNouveau: 'New project',
    nomLabel: 'Name',
    descriptionLabel: 'Description',
    objectifLabel: 'Objective',
    categorieLabel: 'Category',
    instructionsLabel: 'Project instructions',
    instructionsAide:
      'These instructions are sent to the assistant when you work within this project.',
    archiver: 'Archive',
    desarchiver: 'Unarchive',
    confirmerSuppr: 'Delete this item? This cannot be undone.',
    ongletApercu: 'Overview',
    ongletConvs: 'Conversations',
    ongletMissions: 'Missions',
    ongletCreations: 'Creations',
    ongletMemoire: 'Memory',
    ongletRecherches: 'Searches',
    vueListe: 'List',
    vueKanban: 'Board',
    vueEcheances: 'Due dates',
    nouvelleMission: 'New mission',
    prioriteLabel: 'Priority',
    echeanceLabel: 'Due date',
    sousTachesLabel: 'Subtasks',
    ajouterSousTache: 'Add a subtask',
    notesLabel: 'Notes',
    aideIa: 'Break down with AURA',
    aideIaPlaceholder: 'Describe your goal…',
    aideIaNote: 'AURA suggests a plan — you validate or edit before anything is saved.',
    propositionTitre: 'Proposed missions',
    validerProposition: 'Validate and create',
    statutAFaire: 'To do',
    statutEnCours: 'In progress',
    statutEnAttente: 'On hold',
    statutTerminee: 'Done',
    statutArchivee: 'Archived',
    prioBasse: 'Low',
    prioMoyenne: 'Medium',
    prioHaute: 'High',
    prioUrgente: 'Urgent',
    memoireTitre: 'AURA Memory',
    memoireSous:
      'The information AURA may use to serve you. You stay in control: add, edit, disable, erase.',
    ajouterMemoire: 'Memorize a piece of information',
    typeMemoireLabel: 'Type',
    memoireActive: 'Active',
    memoireInactive: 'Disabled',
    toutEffacer: 'Erase everything',
    confirmerVider: 'Erase the whole memory? This cannot be undone.',
    memoireVide: 'Nothing memorized yet.',
    noteConfidentialite:
      'Memory never stores your passwords. It belongs to your account and is never shared.',
    recherchePlaceholder: 'Search for verified information…',
    lancer: 'Search',
    sourcesTitre: 'Sources',
    aucuneSource: 'No verifiable source found.',
    sansResultat: 'No usable result for this search.',
    enregistrerProjet: 'Link to a project',
    devenirMission: 'Become a mission',
    devenirDocument: 'Become a document',
    historiqueRecherches: 'Saved searches',
    typeCreationLabel: 'Creation type',
    instructionLabel: 'Instruction',
    generer: 'Generate',
    versionsTitre: 'Versions',
    versionNumero: 'Version',
    exporter: 'Export (Markdown)',
    reviser: 'Revise',
    revisionPlaceholder: 'Describe the desired revision…',
    aucuneCreation: 'No creations yet.',
    profilContextuel: 'Contextual profile (AURA Local)',
    profilSous:
      'This information helps AURA adapt its answers (currency, units, language, context). It stays private and editable at any time.',
    paysLabel: 'Country',
    villeLabel: 'Region or city',
    deviseLabel: 'Preferred currency',
    fuseauLabel: 'Time zone',
    unitesLabel: 'Measurement units',
    metriques: 'Metric',
    imperiales: 'Imperial',
    domaineLabel: 'Field of work',
    languePrincipaleLabel: 'Main language',
    languesSecondairesLabel: 'Secondary languages',
    preferencesTitre: 'Answer preferences',
    tonLabel: 'Answer tone',
    tonConcis: 'Concise',
    tonDetaille: 'Detailed',
    tonPedagogique: 'Pedagogical',
    utiliserMemoireLabel: 'Allow memory usage in answers',
    langueReponseLabel: 'Answer language',
    langueAuto: 'Follow the conversation',
    enregistrer: 'Save',
    enregistre: 'Saved',
    localNoteTitre: 'AURA Local',
    localNote:
      'AURA does not invent local facts: the context you provide only adapts examples, and unverified information is flagged as such.',
    dicter: 'Dictate',
    lireVoix: 'Read aloud',
    arreterLecture: 'Stop reading',
    confirmer: 'Confirm',
    annuler: 'Cancel',
    reessayer: 'Try again',
    retour: 'Back',
    indisponible: 'Unavailable',
    configRequise: 'Setup required',
    dangerZone: 'Danger zone',
    dangerSous: 'These actions permanently affect your account.',
    supprimerCompte: 'Delete my account',
    supprimerCompteAvertissement:
      'This action is permanent: your conversations, projects, missions, memories and creations will be deleted, along with all your sessions. No recovery will be possible.',
    supprimerCompteConfirmeLabel: 'To confirm, type:',
    supprimerCompteConfirmeValeur: 'DELETE',
    motDePasseLabel: 'Password',
    compteSupprime: 'Your account has been deleted.',
    exportPdf: 'PDF',
    exporterWord: 'Word (.docx)',
    exporterPptx: 'PowerPoint (.pptx)',
    exporterXlsx: 'Excel (.xlsx)',
    exporterCsv: 'CSV (.csv)',
    exporterTxt: 'Text (.txt)',
    exporterHtml: 'HTML page (.html)',
    exporterMarkdown: 'Markdown (.md)',
    exporterChoisir: 'Choose a format…',
  },
  admin: {
    titre: 'Administration',
    sous: 'Real view of accounts and moderation. Every action is logged.',
    accesRefuse: 'This page is restricted to administrators.',
    nonConfigure:
      'Administration is not configured on this environment: add AURA_ADMIN_EMAILS on the server.',
    statsTitre: 'Overview',
    comptes: 'Accounts',
    verifies: 'Confirmed addresses',
    google: 'Google accounts',
    bannis: 'Suspended accounts',
    sessionsActives: 'Active sessions',
    inscriptions7j: 'Sign-ups (7 d)',
    conversations: 'Conversations',
    messages: 'Messages',
    creations: 'Creations',
    rechercheLabel: 'Search an account',
    recherchePlaceholder: 'Address, name or identifier',
    rechercher: 'Search',
    colonnesUtilisateur: 'Account',
    colonnesCree: 'Created',
    colonnesEtat: 'State',
    colonnesSessions: 'Sessions',
    colonnesActions: 'Actions',
    verifie: 'Confirmed',
    nonVerifie: 'Not confirmed',
    googleLie: 'Google',
    banni: 'Suspended',
    voir: 'Details',
    bannir: 'Suspend',
    debannir: 'Restore',
    revoquer: 'Close sessions',
    supprimer: 'Delete',
    fermer: 'Close',
    bannirTitre: 'Suspend this account',
    motifLabel: 'Reason (optional, kept in the log)',
    motifPlaceholder: 'E.g. abuse, fraud…',
    bannirConfirmer: 'Confirm suspension',
    supprimerTitre: 'Permanently delete this account',
    supprimerAide:
      'Conversations, projects, missions and creations will be deleted with the account. Type the exact address to confirm.',
    supprimerConfirmer: 'Delete permanently',
    journalTitre: 'Action log',
    journalVide: 'No action recorded yet.',
    chargement: 'Loading…',
    aucunResultat: 'No account matches this search.',
    erreur: 'The action did not complete. Try again.',
    faitBanni: 'Account suspended, sessions closed.',
    faitDebanni: 'Account restored.',
    faitSessions: 'Sessions closed.',
    faitSupprime: 'Account deleted.',
    page: 'Page',
    precedent: 'Previous',
    suivant: 'Next',
    detailTitre: 'Account details',
    activite: 'Activity',
    sessionsTitre: 'Sessions',
    derniereActivite: 'Last activity',
    appareil: 'Device',
    jamais: 'never',
  },
  pwa: {
    installer: 'Install Aura',
    installerTexte: 'Aura then opens like an app: full screen, no address bar.',
    installee: 'Aura is installed on this device.',
    application: 'Application',
    applicationSous:
      'Aura can be installed on this device. Nothing comes from an app store: your browser adds the app to your home screen.',
    miseAJour: 'A new version of Aura is ready.',
    recharger: 'Reload',
    iosAide: 'On iPhone or iPad: Share button, then “Add to Home Screen”.',
    androidAide:
      'On Android: Chrome’s ⋮ menu, then “Install app” (or “Add to Home screen”).',
    ordinateurAide:
      'On desktop: the install icon in the address bar of Chrome or Edge.',
    horsLigneTitre: 'Offline',
    horsLigneTexte:
      'Without a network, Aura reopens pages you already visited. Conversations, search and creations resume as soon as you are back online — nothing is lost.',
  },
};

export const CONTENT: Record<Lang, Content> = { fr: contentFr, en: contentEn };
