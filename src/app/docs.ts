/**
 * Documentation d'AURA — contenu rédigé, bilingue, ancré dans l'interface
 * réelle. Chaque article décrit uniquement des fonctions effectivement
 * présentes dans l'application ; les capacités non disponibles sont
 * signalées explicitement comme telles (jamais masquées).
 */

export type BlocDoc =
  | { type: 'para'; texte: string }
  | { type: 'liste'; items: string[] }
  | { type: 'etapes'; items: string[] }
  | { type: 'code'; langage: string; code: string }
  | { type: 'note'; ton: 'info' | 'limite'; texte: string }
  | { type: 'tableau'; entetes: string[]; lignes: string[][] };

export type SectionDoc = { id: string; titre: string; blocs: BlocDoc[] };

export type ArticleDoc = {
  slug: string;
  icone: string;
  titre: string;
  resume: string;
  duree: string;
  sections: SectionDoc[];
  associes: string[];
};

export type DocsLangue = {
  hub: {
    kicker: string;
    titre1: string;
    titre2: string;
    sous: string;
    sommaireLabel: string;
    lire: string;
    note: string;
  };
  article: {
    retour: string;
    sommaire: string;
    associes: string;
    precedent: string;
    suivant: string;
    duree: string;
    surCettePage: string;
  };
  articles: ArticleDoc[];
};

const fr: DocsLangue = {
  hub: {
    kicker: 'Documentation',
    titre1: 'Des guides qui décrivent',
    titre2: 'exactement ce qui existe',
    sous:
      'Chaque page est rédigée à partir de l’interface réelle d’AURA : les étapes fonctionnent, les exemples sont vérifiés, et ce qui n’est pas encore disponible est signalé sans détour.',
    sommaireLabel: 'Sommaire de la documentation',
    lire: 'Lire le guide',
    note:
      'Cette documentation évolue avec le produit. Une fonction absente de ces pages n’est pas encore disponible dans AURA.',
  },
  article: {
    retour: 'Toute la documentation',
    sommaire: 'Sur cette page',
    associes: 'À lire ensuite',
    precedent: 'Précédent',
    suivant: 'Suivant',
    duree: 'Lecture',
    surCettePage: 'Sommaire de l’article',
  },
  articles: [
    {
      slug: 'demarrage',
      icone: 'rocket',
      titre: 'Démarrage',
      resume: 'Créer son compte, comprendre l’espace de travail et lancer sa première conversation.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'Ce que vous obtenez',
          blocs: [
            {
              type: 'para',
              texte:
                'À la fin de ce guide, vous disposez d’un compte, vous savez où se trouvent vos conversations et vous avez obtenu une première réponse de l’assistant.',
            },
          ],
        },
        {
          id: 'prerequis',
          titre: 'Prérequis',
          blocs: [
            {
              type: 'liste',
              items: [
                'Une adresse e-mail valide.',
                'Un mot de passe d’au moins 8 caractères.',
                'Un navigateur récent (Chrome, Firefox, Safari ou Edge).',
              ],
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Pas à pas',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez la page « Commencer » depuis la navigation.',
                'Renseignez votre nom, votre adresse e-mail et un mot de passe, puis validez.',
                'Vous arrivez dans l’espace de travail, sur la vue d’ensemble.',
                'Sélectionnez « Assistant » dans la navigation latérale.',
                'Écrivez votre demande dans le champ de saisie, puis envoyez-la.',
                'La réponse s’affiche progressivement ; le bouton d’arrêt reste disponible pendant la génération.',
              ],
            },
          ],
        },
        {
          id: 'exemple',
          titre: 'Exemple concret',
          blocs: [
            {
              type: 'para',
              texte:
                'Pour une première prise en main, demandez quelque chose de vérifiable et de court :',
            },
            {
              type: 'code',
              langage: 'texte',
              code: 'Explique en cinq lignes ce qu’est un projet dans AURA, puis propose un nom pour mon premier projet.',
            },
            {
              type: 'para',
              texte:
                'Résultat attendu : une réponse structurée, affichée progressivement, conservée dans l’historique de la conversation.',
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites connues',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'L’assistant nécessite qu’un moteur IA soit configuré sur l’environnement. S’il ne l’est pas, l’application l’indique clairement au lieu de produire une réponse simulée.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Les langues locales (Fon et autres) ainsi que les fonctions vocales ne sont pas encore disponibles : elles font l’objet d’une étude, présentée sur la page d’accueil.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  '« Adresse déjà utilisée »',
                  'Un compte existe avec cet e-mail.',
                  'Connectez-vous ou utilisez une autre adresse.',
                ],
                [
                  'Le bouton d’envoi reste inactif',
                  'Le champ est vide ou la génération précédente est en cours.',
                  'Saisissez un texte ; attendez la fin ou arrêtez la génération.',
                ],
                [
                  'Message d’indisponibilité de l’assistant',
                  'Aucun moteur IA configuré sur cet environnement.',
                  'Contactez l’administrateur de l’instance.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'projets-missions'],
    },
    {
      slug: 'conversation',
      icone: 'comments',
      titre: 'L’assistant et le fil',
      resume: 'Conversations, contexte, arrêt de génération, régénération et historique.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'À quoi sert le fil',
          blocs: [
            {
              type: 'para',
              texte:
                'Le fil est l’espace de conversation d’AURA. Chaque échange garde le contexte : vous pouvez poser une question, puis affiner sans répéter ce qui précède. Les conversations sont enregistrées et reprises là où vous les avez laissées.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Utiliser le fil',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Assistant » pour démarrer une nouvelle conversation ou choisir une conversation existante dans la liste.',
                'Saisissez votre message. La touche Entrée envoie ; Maj+Entrée ajoute un retour à la ligne.',
                'Pendant la génération, le bouton « Arrêter » interrompt la réponse : le texte déjà reçu est conservé et marqué comme interrompu.',
                'Sur la dernière réponse, l’action « Régénérer » relance une génération à partir du même historique.',
                'L’action « Copier » place la réponse dans le presse-papiers.',
                'Rechargez la page : la conversation et son contenu sont restaurés.',
              ],
            },
          ],
        },
        {
          id: 'contexte',
          titre: 'Contexte et mémoire',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA transmet l’historique de la conversation au moteur IA, ainsi que les mémoires de projet que vous avez enregistrées et rattachées au projet concerné. Le nombre de mémoires utilisées est indiqué sous la réponse.',
            },
            {
              type: 'liste',
              items: [
                'Une conversation peut être renommée ou supprimée depuis la liste.',
                'Une conversation peut être rattachée à un projet, ce qui active son contexte.',
                'La page « Mémoire » permet de créer, modifier et supprimer les éléments de contexte durables.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites connues',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Si la génération échoue après l’envoi des premiers fragments, AURA s’arrête et signale l’erreur : le service ne bascule jamais silencieusement vers un autre moteur en cours de réponse.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Le contenu des conversations appartient au compte qui les a créées : aucun autre compte ne peut y accéder.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  'La réponse s’arrête au milieu',
                  'Génération interrompue (bouton Arrêter ou coupure réseau).',
                  'Utilisez « Régénérer » sur la dernière réponse.',
                ],
                [
                  'Message « Trop de requêtes »',
                  'Limite d’usage atteinte sur une courte période.',
                  'Patientez quelques instants avant de réessayer.',
                ],
                [
                  'La réponse n’apparaît pas',
                  'Moteur IA non configuré ou service momentanément indisponible.',
                  'L’interface affiche un message explicite ; réessayez plus tard.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['demarrage', 'projets-missions'],
    },
    {
      slug: 'projets-missions',
      icone: 'diagram-project',
      titre: 'Projets et missions',
      resume: 'Organiser son travail : projets, propositions de missions, validation et mémoire.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'À quoi servent les projets',
          blocs: [
            {
              type: 'para',
              texte:
                'Un projet regroupe un objectif et tout le travail qui s’y rapporte : conversations, missions, créations et mémoires. C’est le fil conducteur qui évite de repartir de zéro à chaque session.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Créer un projet et le faire avancer',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Projets », puis créez un projet en indiquant un nom (obligatoire) et un objectif.',
                'Dans l’espace du projet, lancez l’analyse IA : elle propose des missions découpées à partir de votre objectif.',
                'Les propositions restent à l’état de brouillon tant que vous ne les validez pas.',
                'Validez les missions pertinentes : elles sont alors enregistrées et suivies.',
                'Faites évoluer le statut d’une mission au fil de son avancement.',
                'Ajoutez une mémoire de projet pour conserver les informations durables.',
              ],
            },
          ],
        },
        {
          id: 'exemple',
          titre: 'Exemple concret',
          blocs: [
            {
              type: 'code',
              langage: 'texte',
              code: 'Objectif du projet : préparer l’ouverture d’une boutique de téléphones à Cotonou.',
            },
            {
              type: 'para',
              texte:
                'Résultat attendu : une liste de missions proposées (étude de marché locale, choix du fournisseur, plan de trésorerie, communication de lancement). Vous validez celles qui vous concernent ; les autres restent non enregistrées.',
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites connues',
          blocs: [
            {
              type: 'note',
              ton: 'info',
              texte:
                'Les propositions de missions sont des suggestions à valider : rien n’est enregistré automatiquement. Les statuts d’avancement sont saisis par vous, AURA n’invente pas de pourcentage de progression.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Le partage de projets entre plusieurs personnes (espaces d’équipe) n’est pas encore disponible.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  'Aucune mission proposée',
                  'Objectif trop vague ou moteur IA indisponible.',
                  'Précisez le contexte et le résultat attendu ; réessayez.',
                ],
                [
                  'Les missions ont disparu',
                  'Elles n’avaient pas été validées.',
                  'Relancez l’analyse et validez les missions souhaitées.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'studio'],
    },
    {
      slug: 'explorer',
      icone: 'magnifying-glass',
      titre: 'Explorer et recherche sourcée',
      resume: 'Interroger le web, lire les sources citées et vérifier l’information.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'À quoi sert Explorer',
          blocs: [
            {
              type: 'para',
              texte:
                'Explorer répond à une question en s’appuyant sur des sources web, et présente les références utilisées. L’objectif est de pouvoir vérifier : chaque affirmation importante renvoie à une source consultable.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Poser une recherche',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Explorer » dans la navigation.',
                'Posez une question précise, si possible datée (« cette année », « en 2025 »).',
                'Lisez la synthèse, puis ouvrez les sources citées pour vérifier les points sensibles.',
                'Consultez la liste des recherches enregistrées pour reprendre un travail antérieur.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites connues',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'La recherche sourcée dépend d’un moteur configuré avec accès à la recherche web. Si ce n’est pas le cas, la recherche est déclarée indisponible — jamais remplacée par une réponse sans sources.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Les sources peuvent contenir des erreurs ou être obsolètes : vérifiez les informations administratives, juridiques ou financières auprès de l’organisme officiel concerné.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  '« Recherche indisponible »',
                  'Aucun moteur de recherche configuré.',
                  'Utilisez l’assistant pour une question générale ou contactez l’administrateur.',
                ],
                [
                  'Sources peu pertinentes',
                  'Question trop large.',
                  'Restreignez le sujet, la zone géographique et la période.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'demarrage'],
    },
    {
      slug: 'studio',
      icone: 'wand-magic-sparkles',
      titre: 'Studio et créations',
      resume: 'Produire des contenus structurés à partir d’un brief.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'À quoi sert le Studio',
          blocs: [
            {
              type: 'para',
              texte:
                'Le Studio transforme un brief en création textuelle structurée (page, document, plan de contenu). Chaque création est enregistrée et peut être reprise.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Créer un contenu',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Studio ».',
                'Choisissez le type de contenu proposé, puis décrivez votre brief.',
                'Lancez la génération et suivez son état dans la liste des créations.',
                'Ouvrez la création terminée pour la relire ou la copier.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites connues',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'La génération d’images n’est pas disponible : le Studio produit du texte structuré. Les visuels de la galerie du site sont des rendus de démonstration, identifiés comme tels.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'L’ajout de pièces jointes (fichiers) dépend d’un stockage objet configuré ; sans lui, la fonction reste désactivée et l’interface l’indique.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  'Création bloquée à l’état « en cours »',
                  'Génération interrompue.',
                  'Relancez la création ; si le problème persiste, vérifiez la configuration du moteur.',
                ],
                [
                  'Contenu trop générique',
                  'Brief trop court.',
                  'Précisez le public, le ton, la longueur et le contexte local.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['projets-missions', 'compte-securite'],
    },
    {
      slug: 'compte-securite',
      icone: 'shield-halved',
      titre: 'Compte, données et sécurité',
      resume: 'Paramètres, préférences, export PDF, suppression de compte et traitement des données.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'Ce que vous contrôlez',
          blocs: [
            {
              type: 'para',
              texte:
                'Vos préférences (langue, thème), vos données de travail et votre compte sont gérés depuis « Paramètres ». Vous pouvez exporter une conversation en PDF et supprimer définitivement votre compte.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Gérer son compte',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Paramètres » pour changer la langue (français ou anglais) et le thème clair/sombre.',
                'Depuis une conversation, utilisez l’export PDF pour en obtenir une copie.',
                'La suppression de compte demande votre mot de passe et une confirmation : elle efface le compte et ses données de travail.',
              ],
            },
          ],
        },
        {
          id: 'donnees',
          titre: 'Traitement des données',
          blocs: [
            {
              type: 'liste',
              items: [
                'Les clés des moteurs IA restent côté serveur : elles ne sont jamais transmises au navigateur.',
                'Les messages sont transmis au moteur IA configuré uniquement pour produire la réponse.',
                'Les journaux techniques enregistrent le fournisseur, la durée et le type d’erreur — jamais le contenu de vos messages ni vos mots de passe.',
                'Les conversations ne sont accessibles qu’au compte qui les a créées.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Ces éléments décrivent le fonctionnement actuel du produit. Les mentions contractuelles (conditions générales, politique de confidentialité) doivent être validées juridiquement avant publication.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Problèmes fréquents',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptôme', 'Cause probable', 'Solution'],
              lignes: [
                [
                  'Impossible de se connecter',
                  'Mot de passe incorrect ou session expirée.',
                  'Vérifiez le mot de passe ; reconnectez-vous.',
                ],
                [
                  'Export PDF vide',
                  'Conversation sans réponse enregistrée.',
                  'Attendez la fin de la génération avant d’exporter.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'studio'],
    },
    {
      slug: 'api',
      icone: 'code',
      titre: 'API pour développeurs',
      resume: 'Points d’entrée v1, authentification par session et exemples vérifiables.',
      duree: '7 min',
      sections: [
        {
          id: 'objectif',
          titre: 'Ce que propose l’API',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA expose une API HTTP v1 utilisée par sa propre interface. Elle permet de gérer comptes, conversations, projets, missions, mémoires, recherches et créations Studio.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Il n’existe pas encore de clés d’API publiques ni de jetons dédiés : l’authentification repose sur la session (cookie). Une API à clés est un chantier séparé, non disponible aujourd’hui.',
            },
          ],
        },
        {
          id: 'auth',
          titre: 'Authentification',
          blocs: [
            {
              type: 'para',
              texte:
                'Authentifiez-vous une fois, puis conservez le cookie de session transmis par le serveur.',
            },
            {
              type: 'code',
              langage: 'bash',
              code: `curl -c cookies.txt -X POST https://votre-instance/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"vous@exemple.com","password":"motdepasse123","nom":"Votre nom"}'`,
            },
            {
              type: 'para',
              texte: 'Puis réutilisez le cookie sur les appels suivants :',
            },
            {
              type: 'code',
              langage: 'bash',
              code: 'curl -b cookies.txt https://votre-instance/api/v1/me',
            },
          ],
        },
        {
          id: 'routes',
          titre: 'Points d’entrée principaux',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Méthode', 'Chemin', 'Rôle'],
              lignes: [
                ['GET', '/api/v1/capabilities', 'Capacités réellement disponibles (public)'],
                ['GET', '/api/v1/me', 'Profil du compte connecté'],
                ['GET', '/api/v1/conversations', 'Lister les conversations'],
                ['POST', '/api/v1/conversations', 'Créer une conversation'],
                ['POST', '/api/v1/conversations/:id/messages', 'Envoyer un message (réponse JSON ou flux)'],
                ['GET', '/api/v1/projets', 'Lister les projets'],
                ['POST', '/api/v1/projets', 'Créer un projet'],
                ['POST', '/api/v1/missions/batch', 'Enregistrer des missions validées'],
                ['GET', '/api/v1/memoires', 'Lister les mémoires'],
                ['POST', '/api/v1/search', 'Lancer une recherche sourcée'],
                ['POST', '/api/v1/studio/jobs', 'Lancer une création Studio'],
                ['GET', '/api/v1/ai/usage', 'Consommation IA du compte, par moteur'],
              ],
            },
          ],
        },
        {
          id: 'exemple',
          titre: 'Exemple : envoyer un message',
          blocs: [
            {
              type: 'code',
              langage: 'bash',
              code: `# 1. Créer une conversation
curl -b cookies.txt -X POST https://votre-instance/api/v1/conversations \\
  -H "Content-Type: application/json" -d '{"titre":"Test"}'

# 2. Envoyer un message (réponse complète)
curl -b cookies.txt -X POST https://votre-instance/api/v1/conversations/CONV_ID/messages \\
  -H "Content-Type: application/json" \\
  -d '{"contenu":"Bonjour","stream":false}'`,
            },
            {
              type: 'para',
              texte:
                'Avec "stream": true, la réponse est diffusée en événements ; le client lit les fragments au fur et à mesure. En cas d’indisponibilité du moteur, l’API renvoie une erreur structurée (code et message) au lieu d’une réponse simulée.',
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limites et bonnes pratiques',
          blocs: [
            {
              type: 'liste',
              items: [
                'Des limites d’usage s’appliquent par compte ; respectez les réponses d’erreur indiquant une limite atteinte.',
                'Ne partagez jamais le cookie de session : il vaut authentification complète.',
                'Le format des réponses peut évoluer ; vérifiez la version des points d’entrée.',
              ],
            },
          ],
        },
      ],
      associes: ['compte-securite', 'conversation'],
    },
  ],
};

const en: DocsLangue = {
  hub: {
    kicker: 'Documentation',
    titre1: 'Guides that describe',
    titre2: 'exactly what exists',
    sous:
      'Every page is written from AURA’s actual interface: the steps work, the examples are verified, and anything not yet available is stated plainly.',
    sommaireLabel: 'Documentation contents',
    lire: 'Read the guide',
    note:
      'This documentation grows with the product. A feature missing from these pages is not yet available in AURA.',
  },
  article: {
    retour: 'All documentation',
    sommaire: 'On this page',
    associes: 'Read next',
    precedent: 'Previous',
    suivant: 'Next',
    duree: 'Read',
    surCettePage: 'Article contents',
  },
  articles: [
    {
      slug: 'demarrage',
      icone: 'rocket',
      titre: 'Getting started',
      resume: 'Create your account, understand the workspace and start your first conversation.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What you get',
          blocs: [
            {
              type: 'para',
              texte:
                'By the end of this guide you have an account, you know where your conversations live, and you have received a first answer from the assistant.',
            },
          ],
        },
        {
          id: 'prerequis',
          titre: 'Prerequisites',
          blocs: [
            {
              type: 'liste',
              items: [
                'A valid email address.',
                'A password of at least 8 characters.',
                'A recent browser (Chrome, Firefox, Safari or Edge).',
              ],
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Step by step',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open the “Get started” page from the navigation.',
                'Enter your name, email and a password, then submit.',
                'You land in the workspace, on the overview.',
                'Select “Assistant” in the side navigation.',
                'Write your request in the input and send it.',
                'The answer appears progressively; the stop button stays available while generating.',
              ],
            },
          ],
        },
        {
          id: 'exemple',
          titre: 'Concrete example',
          blocs: [
            {
              type: 'code',
              langage: 'text',
              code: 'Explain in five lines what a project is in AURA, then suggest a name for my first project.',
            },
            {
              type: 'para',
              texte:
                'Expected result: a structured answer, displayed progressively and kept in the conversation history.',
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Known limits',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'The assistant requires an AI engine configured on the environment. If none is configured, the app says so plainly instead of producing a simulated answer.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Local languages (Fon and others) and voice features are not available yet: they are under study and presented as such on the home page.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                ['“Email already in use”', 'An account exists for this address.', 'Sign in or use another address.'],
                [
                  'The send button stays disabled',
                  'The field is empty or a generation is running.',
                  'Type some text; wait for completion or stop the generation.',
                ],
                [
                  'Assistant unavailable message',
                  'No AI engine configured on this environment.',
                  'Contact the instance administrator.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'projets-missions'],
    },
    {
      slug: 'conversation',
      icone: 'comments',
      titre: 'Assistant and thread',
      resume: 'Conversations, context, stopping a generation, regenerating and history.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What the thread is for',
          blocs: [
            {
              type: 'para',
              texte:
                'The thread is AURA’s conversation space. Each exchange keeps its context: ask a question, then refine without repeating what came before. Conversations are saved and resumed where you left them.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Using the thread',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Assistant” to start a new conversation or pick an existing one from the list.',
                'Type your message. Enter sends; Shift+Enter adds a line break.',
                'While generating, “Stop” interrupts the answer: text already received is kept and marked as interrupted.',
                'On the last answer, “Regenerate” runs a new generation from the same history.',
                '“Copy” places the answer on the clipboard.',
                'Reload the page: the conversation and its content are restored.',
              ],
            },
          ],
        },
        {
          id: 'contexte',
          titre: 'Context and memory',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA sends the conversation history to the AI engine, plus the project memories you saved and attached to that project. The number of memories used is shown under the answer.',
            },
            {
              type: 'liste',
              items: [
                'A conversation can be renamed or deleted from the list.',
                'A conversation can be attached to a project, enabling its context.',
                'The “Memory” page lets you create, edit and delete durable context items.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Known limits',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'If generation fails after the first fragments were sent, AURA stops and reports the error: the service never silently switches to another engine mid-answer.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Conversation content belongs to the account that created it: no other account can access it.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                [
                  'The answer stops midway',
                  'Generation interrupted (Stop button or network drop).',
                  'Use “Regenerate” on the last answer.',
                ],
                [
                  '“Too many requests” message',
                  'Usage limit reached in a short window.',
                  'Wait a moment before retrying.',
                ],
                [
                  'No answer appears',
                  'AI engine not configured or service temporarily down.',
                  'The interface shows a clear message; retry later.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['demarrage', 'projets-missions'],
    },
    {
      slug: 'projets-missions',
      icone: 'diagram-project',
      titre: 'Projects and missions',
      resume: 'Organise your work: projects, mission suggestions, validation and memory.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What projects are for',
          blocs: [
            {
              type: 'para',
              texte:
                'A project groups one objective and everything related to it: conversations, missions, creations and memories. It is the thread that keeps you from starting over every session.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Create and move a project forward',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Projects”, then create one with a name (required) and an objective.',
                'Inside the project, run the AI analysis: it suggests missions broken down from your objective.',
                'Suggestions stay as drafts until you validate them.',
                'Validate the relevant missions: they are then saved and tracked.',
                'Update a mission’s status as it progresses.',
                'Add a project memory to keep durable information.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Known limits',
          blocs: [
            {
              type: 'note',
              ton: 'info',
              texte:
                'Mission suggestions are proposals to validate: nothing is saved automatically. Progress statuses are entered by you; AURA never invents a completion percentage.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte: 'Sharing projects between several people (team spaces) is not available yet.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                [
                  'No mission suggested',
                  'Objective too vague or AI engine unavailable.',
                  'Add context and expected outcome; retry.',
                ],
                ['Missions disappeared', 'They were never validated.', 'Run the analysis again and validate them.'],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'studio'],
    },
    {
      slug: 'explorer',
      icone: 'magnifying-glass',
      titre: 'Explorer and sourced search',
      resume: 'Query the web, read cited sources and verify information.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What Explorer is for',
          blocs: [
            {
              type: 'para',
              texte:
                'Explorer answers a question using web sources and shows the references used. The goal is verification: important claims link back to a source you can open.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Run a search',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Explorer” in the navigation.',
                'Ask a precise question, with a date or place where relevant.',
                'Read the summary, then open the cited sources to check sensitive points.',
                'Browse saved searches to resume earlier work.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Known limits',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Sourced search depends on an engine configured with web search access. Without it, search is declared unavailable — never replaced by an unsourced answer.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Sources can be wrong or outdated: check administrative, legal or financial information with the relevant official body.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                [
                  '“Search unavailable”',
                  'No search engine configured.',
                  'Use the assistant for a general question or contact the administrator.',
                ],
                ['Irrelevant sources', 'Question too broad.', 'Narrow the topic, place and period.'],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'demarrage'],
    },
    {
      slug: 'studio',
      icone: 'wand-magic-sparkles',
      titre: 'Studio and creations',
      resume: 'Produce structured content from a brief.',
      duree: '4 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What the Studio is for',
          blocs: [
            {
              type: 'para',
              texte:
                'The Studio turns a brief into structured text content (page, document, content plan). Every creation is saved and can be reopened.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Create content',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Studio”.',
                'Choose the proposed content type, then describe your brief.',
                'Start generation and follow its status in the creations list.',
                'Open the finished creation to read or copy it.',
              ],
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Known limits',
          blocs: [
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Image generation is not available: the Studio produces structured text. The visuals in the site gallery are demonstration renders, labelled as such.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'File attachments depend on object storage being configured; without it the feature stays disabled and the interface says so.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                [
                  'Creation stuck in progress',
                  'Generation interrupted.',
                  'Relaunch the creation; if it persists, check the engine configuration.',
                ],
                ['Content too generic', 'Brief too short.', 'Specify audience, tone, length and local context.'],
              ],
            },
          ],
        },
      ],
      associes: ['projets-missions', 'compte-securite'],
    },
    {
      slug: 'compte-securite',
      icone: 'shield-halved',
      titre: 'Account, data and security',
      resume: 'Settings, preferences, PDF export, account deletion and data processing.',
      duree: '5 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What you control',
          blocs: [
            {
              type: 'para',
              texte:
                'Your preferences (language, theme), your work data and your account are managed from “Settings”. You can export a conversation as a PDF and permanently delete your account.',
            },
          ],
        },
        {
          id: 'etapes',
          titre: 'Managing your account',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Settings” to change the language (French or English) and the light/dark theme.',
                'From a conversation, use the PDF export to get a copy.',
                'Account deletion asks for your password and a confirmation: it erases the account and its work data.',
              ],
            },
          ],
        },
        {
          id: 'donnees',
          titre: 'Data processing',
          blocs: [
            {
              type: 'liste',
              items: [
                'AI engine keys stay on the server: they are never sent to the browser.',
                'Messages are sent to the configured AI engine only to produce the answer.',
                'Technical logs record the provider, duration and error type — never the content of your messages or your passwords.',
                'Conversations are only accessible to the account that created them.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'These points describe how the product works today. Contractual texts (terms of service, privacy policy) require legal validation before publication.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common issues',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                ['Cannot sign in', 'Wrong password or expired session.', 'Check the password; sign in again.'],
                ['Empty PDF export', 'Conversation with no saved answer.', 'Wait for generation to finish before exporting.'],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'studio'],
    },
    {
      slug: 'api',
      icone: 'code',
      titre: 'Developer API',
      resume: 'v1 endpoints, session authentication and verifiable examples.',
      duree: '7 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What the API offers',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA exposes an HTTP v1 API used by its own interface. It covers accounts, conversations, projects, missions, memories, searches and Studio creations.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'There are no public API keys or dedicated tokens yet: authentication relies on the session cookie. A key-based API is separate work, not available today.',
            },
          ],
        },
        {
          id: 'auth',
          titre: 'Authentication',
          blocs: [
            {
              type: 'para',
              texte: 'Authenticate once, then keep the session cookie returned by the server.',
            },
            {
              type: 'code',
              langage: 'bash',
              code: `curl -c cookies.txt -X POST https://your-instance/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"motdepasse123","nom":"Your name"}'`,
            },
            {
              type: 'code',
              langage: 'bash',
              code: 'curl -b cookies.txt https://your-instance/api/v1/me',
            },
          ],
        },
        {
          id: 'routes',
          titre: 'Main endpoints',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Method', 'Path', 'Purpose'],
              lignes: [
                ['GET', '/api/v1/capabilities', 'Actually available capabilities (public)'],
                ['GET', '/api/v1/me', 'Signed-in account profile'],
                ['GET', '/api/v1/conversations', 'List conversations'],
                ['POST', '/api/v1/conversations', 'Create a conversation'],
                ['POST', '/api/v1/conversations/:id/messages', 'Send a message (JSON or stream)'],
                ['GET', '/api/v1/projets', 'List projects'],
                ['POST', '/api/v1/projets', 'Create a project'],
                ['POST', '/api/v1/missions/batch', 'Save validated missions'],
                ['GET', '/api/v1/memoires', 'List memories'],
                ['POST', '/api/v1/search', 'Run a sourced search'],
                ['POST', '/api/v1/studio/jobs', 'Start a Studio creation'],
                ['GET', '/api/v1/ai/usage', 'Account AI usage, per engine'],
              ],
            },
          ],
        },
        {
          id: 'exemple',
          titre: 'Example: send a message',
          blocs: [
            {
              type: 'code',
              langage: 'bash',
              code: `# 1. Create a conversation
curl -b cookies.txt -X POST https://your-instance/api/v1/conversations \\
  -H "Content-Type: application/json" -d '{"titre":"Test"}'

# 2. Send a message (full response)
curl -b cookies.txt -X POST https://your-instance/api/v1/conversations/CONV_ID/messages \\
  -H "Content-Type: application/json" \\
  -d '{"contenu":"Bonjour","stream":false}'`,
            },
            {
              type: 'para',
              texte:
                'With "stream": true the answer is pushed as events and the client reads fragments as they arrive. When the engine is unavailable, the API returns a structured error (code and message) instead of a simulated answer.',
            },
          ],
        },
        {
          id: 'limites',
          titre: 'Limits and best practices',
          blocs: [
            {
              type: 'liste',
              items: [
                'Usage limits apply per account; respect error responses that report a reached limit.',
                'Never share the session cookie: it grants full authentication.',
                'Response shapes may evolve; check the endpoint version.',
              ],
            },
          ],
        },
      ],
      associes: ['compte-securite', 'conversation'],
    },
  ],
};

export const DOCS: Record<'fr' | 'en', DocsLangue> = { fr, en };
