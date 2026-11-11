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
            {
              type: 'note',
              ton: 'info',
              texte:
                'AURA peut aussi s’installer comme une application sur téléphone ou ordinateur : voir le guide « Installer AURA ».',
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
          id: 'modes',
          titre: 'Les quatre modes',
          blocs: [
            {
              type: 'para',
              texte:
                'Le sélecteur de mode change la façon dont la demande est traitée, pas seulement le ton de la réponse. Il s’applique aux messages sans image : une image est confiée au moteur qui sait la lire.',
            },
            {
              type: 'tableau',
              entetes: ['Mode', 'Ce qu’il privilégie', 'Quand le choisir'],
              lignes: [
                ['Aura', 'Réponse directe, fluide, en continu.', 'La conversation courante, les questions simples.'],
                ['Réflexion', 'Un modèle porté sur le raisonnement.', 'Un plan, une décision, un problème à décortiquer.'],
                ['Code', 'Un modèle déclaré compatible avec le code.', 'Écrire, corriger ou expliquer du code.'],
                ['Recherche', 'La capacité à citer des sources réelles (URL).', 'Un fait à vérifier, une actualité, une comparaison sourcée.'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Chaque mode exige une capacité précise du fournisseur configuré. Si aucun modèle ne l’a, la demande est refusée avec un code explicite (par exemple « aucun-fournisseur ») : aucune réponse n’est inventée pour faire bonne figure.',
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
      slug: 'memoire',
      icone: 'brain',
      titre: 'Mémoire',
      resume: 'Ce qu’AURA retient d’une conversation à l’autre — et comment l’écrire, le couper ou l’effacer.',
      duree: '5 min',
      sections: [
        {
          id: 'principe',
          titre: 'À quoi sert la mémoire',
          blocs: [
            {
              type: 'para',
              texte:
                'L’historique d’une conversation ne franchit pas ses murs : une nouvelle conversation repart sans les échanges précédents. La mémoire comble ce vide, mais seulement avec ce que vous décidez d’écrire : une préférence durable, un contexte sur votre travail, une consigne de style.',
            },
            {
              type: 'liste',
              items: [
                'Préférence : « Réponds en français, sans jargon. »',
                'Contexte personnel : « Je travaille seule sur un projet de formation à Cotonou. »',
                'Préférence de réponse : « Donne toujours un plan avant le texte. »',
              ],
            },
          ],
        },
        {
          id: 'ajouter',
          titre: 'Écrire une mémoire',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Mémoire » dans la navigation latérale.',
                'Créez une entrée : le texte peut aller jusqu’à 2 000 caractères.',
                'Choisissez son type (préférence, contexte personnel, préférence de réponse).',
                'Rattachez-la à un projet si elle ne concerne qu’un projet ; laissez vide pour une portée générale.',
                'Enregistrez : l’entrée est active immédiatement.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Une mémoire désactivée reste dans votre liste mais n’est jamais envoyée au modèle. Vous pouvez la réactiver à tout moment.',
            },
          ],
        },
        {
          id: 'portee',
          titre: 'Quelle portée, quel ordre',
          blocs: [
            {
              type: 'para',
              texte:
                'Deux portées coexistent : générale (aucun projet) et rattachée à un projet. Une conversation ouverte depuis un projet reçoit les mémoires générales et celles de ce projet ; les mémoires les plus récentes sont présentées en premier.',
            },
            {
              type: 'liste',
              items: [
                'Une mémoire de projet ne fuit pas dans les autres projets.',
                'Seules les mémoires actives partent au modèle.',
                'Le nombre de mémoires envoyées dépend de leur longueur : au-delà d’une certaine taille, le contexte est tronqué — gardez des entrées courtes et utiles.',
              ],
            },
          ],
        },
        {
          id: 'controle',
          titre: 'Couper l’usage de la mémoire',
          blocs: [
            {
              type: 'para',
              texte:
                'Dans « Paramètres → Préférences », la ligne « Autoriser l’usage de la mémoire dans les réponses » commande l’envoi. Désactivée, plus aucune mémoire ne part au modèle, même active.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'AURA n’écrit jamais de mémoire à votre place : aucun contenu de conversation n’est extrait automatiquement. Ce qui est retenu est exactement ce que vous avez saisi.',
            },
          ],
        },
        {
          id: 'effacer',
          titre: 'Supprimer et repartir',
          blocs: [
            {
              type: 'liste',
              items: [
                'Suppression d’une entrée : définitive, immédiate.',
                'Suppression de toutes les mémoires : un seul geste depuis la page « Mémoire ».',
                'Suppression du compte : efface aussi les mémoires, comme le reste de vos données.',
              ],
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
                  'La mémoire semble ignorée',
                  'La préférence d’usage est désactivée, ou l’entrée est inactive.',
                  'Vérifier les deux dans « Paramètres » et « Mémoire ».',
                ],
                [
                  'La réponse mélange deux projets',
                  'Des mémoires générales contredisent celles d’un projet.',
                  'Rattacher la consigne au bon projet, ou la préciser.',
                ],
                [
                  'L’entrée est refusée',
                  'Texte vide ou supérieur à 2 000 caractères.',
                  'Raccourcir : une consigne utile tient en deux phrases.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'projets-missions'],
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
      slug: 'exports',
      icone: 'download',
      titre: 'Exports et formats',
      resume: 'Sortir une création de l’application : huit formats, ce que chaque fichier contient vraiment.',
      duree: '5 min',
      sections: [
        {
          id: 'ou',
          titre: 'Où exporter',
          blocs: [
            {
              type: 'para',
              texte:
                'Toute création du Studio peut être exportée, à la version que vous regardez. L’export se fait depuis la création ouverte, jamais depuis la liste.',
            },
            {
              type: 'etapes',
              items: [
                'Ouvrez « Studio », puis la création concernée.',
                'Choisissez la version à exporter (la plus récente par défaut).',
                'Ouvrez le menu d’export et sélectionnez un format.',
                'Le fichier est téléchargé immédiatement, nommé d’après le titre.',
              ],
            },
          ],
        },
        {
          id: 'formats',
          titre: 'Les huit formats',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Format', 'À quoi il sert', 'Ce que le fichier contient'],
              lignes: [
                ['.docx (Word)', 'Retoucher, annoter, envoyer', 'Titres hiérarchisés, paragraphes, listes, citations, code. Calibri et Consolas.'],
                ['.pdf', 'Diffuser sans risque de retouche', 'A4, titres, listes, citations en gris, code, pagination avec pied de page.'],
                ['.pptx (PowerPoint)', 'Présenter', 'Une diapositive par titre, format 16:9, 60 diapositives maximum.'],
                ['.xlsx (Excel)', 'Exploiter des tableaux', 'Une feuille par section, tableaux extraits, nombres reconnus comme nombres.'],
                ['.csv', 'Importer ailleurs', 'Tableaux uniquement, séparateur point-virgule, UTF-8 avec BOM (Excel français l’ouvre sans réglage).'],
                ['.txt', 'Lire partout', 'Texte brut, titres en capitales soulignées de tirets.'],
                ['.html', 'Consulter dans un navigateur', 'Page autonome, styles simples, aucune ressource distante.'],
                ['.md (Markdown)', 'Versionner, réutiliser', 'La structure d’origine, la plus fidèle.'],
              ],
            },
          ],
        },
        {
          id: 'fidelite',
          titre: 'Ce qui est conservé, ce qui ne l’est pas',
          blocs: [
            {
              type: 'liste',
              items: [
                'Conservé partout : l’ordre des sections, les titres, les listes, les tableaux (sauf TXT et HTML simplifié), le code.',
                'Non conservé : l’apparence de la page web (couleurs, polices de la marque, animations).',
                'PDF : pas d’italique — les polices standard n’en fournissent pas sans embarquer un fichier. Les citations sont rendues en gris.',
                'CSV : seuls les tableaux sont exportés ; s’il n’y en a aucun, le texte est écrit ligne par ligne.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Aucun format n’est une capture d’écran : ce sont des documents réels, modifiables. Une mise en page sophistiquée (colonnes, encadrés) n’existe pas dans les créations : elle ne peut donc pas être exportée.',
            },
          ],
        },
        {
          id: 'nommage',
          titre: 'Nom du fichier',
          blocs: [
            {
              type: 'para',
              texte:
                'Le nom suit le titre de la création : accents retirés, espaces remplacés par des tirets, 60 caractères maximum, puis l’extension. « Plan de lancement — Aura » devient « plan-de-lancement-aura.pdf ».',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Exporter deux fois la même version produit deux fichiers identiques : rien n’est modifié côté serveur, et l’export n’est pas compté comme une révision.',
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
                ['Le bouton d’export est inactif', 'La création n’a pas encore de version générée.', 'Attendre la fin de la génération, puis réessayer.'],
                ['Le fichier Excel affiche une seule colonne', 'Le séparateur du tableur n’est pas le point-virgule.', 'Préférer le .xlsx, ou régler le séparateur à l’import.'],
                ['Le PDF contient « ? » à la place d’un caractère', 'Caractère absent de l’encodage des polices standard (emoji, idéogramme).', 'Retirer l’emoji ou choisir le .docx, qui gère l’Unicode.'],
              ],
            },
          ],
        },
      ],
      associes: ['studio', 'conversation'],
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
      slug: 'application',
      icone: 'display',
      titre: 'Installer AURA',
      resume: 'Installer l’application sur un téléphone ou un ordinateur, ce qui marche hors ligne, et comment la mettre à jour.',
      duree: '4 min',
      sections: [
        {
          id: 'interet',
          titre: 'Pourquoi installer',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA s’installe depuis le navigateur : aucune boutique, aucun frais, aucun compte supplémentaire. L’application s’ouvre en plein écran, sans barre d’adresse, et garde en mémoire la coque de l’interface pour démarrer vite.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'C’est le même site, avec le même compte et les mêmes données. Installer ne duplique rien.',
            },
          ],
        },
        {
          id: 'installer',
          titre: 'Le geste, selon l’appareil',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Appareil', 'Geste'],
              lignes: [
                ['Android (Chrome)', 'Menu ⋮ → « Installer l’application ». Un bouton « Installer AURA » apparaît aussi dans la barre latérale.'],
                ['iPhone / iPad (Safari)', 'Bouton Partager → « Sur l’écran d’accueil » → Ajouter.'],
                ['Ordinateur (Chrome, Edge)', 'Icône d’installation dans la barre d’adresse, ou le bouton de la barre latérale.'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Sur iPhone, seule Safari propose l’ajout à l’écran d’accueil ; les navigateurs intégrés (Facebook, Instagram) ne le permettent pas. Sur Android, éviter également les navigateurs intégrés.',
            },
          ],
        },
        {
          id: 'hors-ligne',
          titre: 'Ce qui fonctionne hors ligne',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Élément', 'Hors ligne'],
              lignes: [
                ['Coque de l’application (interface, styles, icônes)', 'oui, en cache'],
                ['Pages déjà consultées', 'oui'],
                ['Conversations, recherche, créations', 'non — le réseau est requis'],
                ['Envoi de messages en attente', 'non — rien n’est mis en file'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'AURA ne garde jamais en cache les réponses de l’API. Un compte suspendu, une session fermée ou une conversation supprimée doivent être vus immédiatement, pas resservis depuis un cache.',
            },
          ],
        },
        {
          id: 'mises-a-jour',
          titre: 'Mises à jour',
          blocs: [
            {
              type: 'para',
              texte:
                'Une nouvelle version est téléchargée en arrière-plan, puis proposée par un bandeau : « Une nouvelle version d’AURA est prête — Recharger ». Rien ne se recharge sans votre accord.',
            },
            {
              type: 'liste',
              items: [
                'La version en cours reste utilisable tant que vous ne rechargez pas.',
                'Le rechargement ne déconnecte pas et ne perd pas la saisie en cours de génération côté serveur.',
                'Aucune mise à jour ne s’installe en pleine conversation sans un geste de votre part.',
              ],
            },
          ],
        },
        {
          id: 'desinstaller',
          titre: 'Désinstaller',
          blocs: [
            {
              type: 'para',
              texte:
                'Appui long sur l’icône → « Désinstaller » (ou « Supprimer le raccourci »). Sur ordinateur : icône d’installation dans la barre d’adresse → Désinstaller.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Désinstaller ne supprime aucun compte ni aucune donnée : tout reste sur le serveur, accessible en se reconnectant dans un navigateur.',
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
                ['Aucune proposition d’installation', 'Le site a été ouvert dans un navigateur intégré, ou la page n’a pas encore été rechargée.', 'Ouvrir dans Chrome ou Safari, recharger une fois.'],
                ['Le bandeau de mise à jour revient sans cesse', 'Le rechargement n’a pas abouti (onglet en veille).', 'Fermer tous les onglets AURA, rouvrir l’application, recharger.'],
                ['L’application affiche une page « hors ligne » alors que le réseau est là', 'Réseau captif ou très lent (le délai est de 6 secondes).', 'Se reconnecter au réseau, puis réessayer.'],
              ],
            },
          ],
        },
      ],
      associes: ['demarrage', 'compte-securite'],
    },
    {
      slug: 'erreurs',
      icone: 'triangle-exclamation',
      titre: 'Comprendre les erreurs',
      resume: 'Chaque message a un code précis. Voici ce qu’ils veulent dire, et quoi faire.',
      duree: '6 min',
      sections: [
        {
          id: 'lire',
          titre: 'Un code, pas une devinette',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA ne remplace jamais une panne par une réponse inventée. Chaque refus porte un code stable, visible dans la réponse de l’API et traduit en clair dans l’interface. Le code est la vérité : le message peut changer de langue, pas le code.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Pour un diagnostic, transmettez le code, l’heure approximative et l’action tentée. Ne transmettez jamais votre cookie de session ni votre mot de passe.',
            },
          ],
        },
        {
          id: 'compte',
          titre: 'Compte et session',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Statut', 'Ce que ça veut dire', 'Quoi faire'],
              lignes: [
                ['identifiants', '401', 'Adresse ou mot de passe incorrect.', 'Vérifier la saisie ; utiliser la réinitialisation si besoin.'],
                ['anonyme', '401', 'Aucune session valide.', 'Se connecter.'],
                ['session-expiree', '401', 'La session a été fermée ou révoquée.', 'Se reconnecter ; sur un autre appareil, c’est le signe d’une révocation.'],
                ['email-non-verifie', '403', 'L’adresse doit être confirmée pour continuer.', 'Ouvrir le lien reçu ; sinon renvoyer depuis les paramètres.'],
                ['compte-banni', '403', 'Le compte a été suspendu par l’administration.', 'Contacter l’administrateur de l’instance ; les données sont conservées.'],
                ['limite', '429', 'Trop de requêtes sur la fenêtre en cours.', 'Attendre la fin de la fenêtre indiquée.'],
                ['jeton-invalide / jeton-expire', '410', 'Lien de vérification ou de réinitialisation déjà utilisé ou périmé.', 'Demander un nouveau lien.'],
              ],
            },
          ],
        },
        {
          id: 'ia',
          titre: 'Moteurs IA',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Ce que ça veut dire', 'Quoi faire'],
              lignes: [
                ['modele-indisponible', 'Aucun moteur configuré ne peut traiter cette demande.', 'Vérifier la configuration de l’instance ; réessayer plus tard.'],
                ['cle-manquante', 'La clé d’un fournisseur est absente.', 'C’est une configuration serveur : rien à faire côté utilisateur.'],
                ['limite-modele', 'Le fournisseur a atteint son quota.', 'Attendre, ou basculer de mode pour un modèle moins sollicité.'],
                ['auth-fournisseur', 'La clé a été refusée par le fournisseur.', 'Configuration serveur : la clé doit être remplacée.'],
                ['bloque', 'La demande a été refusée par le modèle (contenu).', 'Reformuler ; ce n’est pas une panne.'],
                ['vide', 'Le modèle a renvoyé une réponse vide.', 'Relancer une fois, puis reformuler.'],
                ['timeout', 'Le modèle n’a pas répondu dans le délai.', 'Réessayer ; raccourcir la demande si cela se répète.'],
                ['aucun-fournisseur', 'Aucun fournisseur compatible n’est disponible.', 'Configuration serveur, ou mode nécessitant une capacité absente.'],
                ['reseau', 'La liaison avec le fournisseur a échoué.', 'Réessayer ; vérifier la connexion côté serveur.'],
              ],
            },
          ],
        },
        {
          id: 'service',
          titre: 'Service et stockage',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Statut', 'Signification'],
              lignes: [
                ['stockage-indisponible', '503', 'La base n’est pas configurée ou ne répond pas : rien n’est écrit, rien n’est perdu.'],
                ['mail-indisponible', '503', 'Aucun fournisseur d’e-mail : les liens ne peuvent pas partir (ils ne sont jamais annoncés comme envoyés).'],
                ['google-indisponible', '503', 'La connexion Google n’est pas configurée sur cet environnement.'],
                ['chat-indisponible', '503', 'Aucun moteur IA actif : la conversation est refusée franchement.'],
                ['admin-non-configure', '503', 'Le panneau d’administration n’est pas activé sur cet environnement.'],
                ['validation', '400', 'Une donnée envoyée est invalide ; le champ fautif est indiqué.'],
                ['introuvable', '404', 'La ressource n’existe pas, ou appartient à un autre compte.'],
                ['interne', '500', 'Erreur inattendue côté serveur ; elle est journalisée sans donnée sensible.'],
              ],
            },
          ],
        },
        {
          id: 'diagnostic',
          titre: 'Ce qu’il faut noter avant de demander de l’aide',
          blocs: [
            {
              type: 'liste',
              items: [
                'Le code exact (par exemple « modele-indisponible »), pas seulement la phrase affichée.',
                'L’heure, avec le fuseau, pour retrouver la trace dans le journal serveur.',
                'L’écran et l’action : « envoi d’un message en mode Recherche » vaut mieux que « ça ne marche pas ».',
                'Le navigateur et l’appareil, si l’erreur ne touche qu’un appareil.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Ne jamais coller un cookie, un jeton de vérification ou un mot de passe dans un message : ces éléments donnent un accès complet et n’aident pas au diagnostic.',
            },
          ],
        },
      ],
      associes: ['limites', 'compte-securite'],
    },
    {
      slug: 'limites',
      icone: 'bars-progress',
      titre: 'Débit, durées et quotas',
      resume: 'Les limites réellement appliquées, leurs fenêtres, et la durée de vie des liens et des sessions.',
      duree: '5 min',
      sections: [
        {
          id: 'principe',
          titre: 'Pourquoi des limites',
          blocs: [
            {
              type: 'para',
              texte:
                'Les moteurs IA coûtent à chaque appel. Les limites protègent le service d’un usage automatique et garantissent qu’une personne ne monopolise pas la capacité. Elles sont appliquées par compte, côté serveur — pas dans le navigateur.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Une limite atteinte renvoie toujours un refus explicite (code « limite », statut 429) avec la fenêtre à attendre : jamais une réponse simulée.',
            },
          ],
        },
        {
          id: 'debit',
          titre: 'Fenêtres de débit',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Action', 'Limite', 'Fenêtre'],
              lignes: [
                ['Messages de conversation', '40', '5 minutes'],
                ['Recherche sourcée', '12', '5 minutes'],
                ['Aide à la décomposition en missions', '12', '5 minutes'],
                ['Créations du Studio', '12', '10 minutes'],
                ['Nouvelle version d’une création', '12', '10 minutes'],
                ['Changement de mot de passe', '5', '15 minutes'],
                ['Suppression de compte', '5', '15 minutes'],
                ['Renvoi du lien de vérification', '3', '1 heure'],
                ['Requêtes d’administration', '120', '5 minutes'],
              ],
            },
          ],
        },
        {
          id: 'duree',
          titre: 'Durées de vie',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Élément', 'Durée'],
              lignes: [
                ['Session ouverte', '7 jours à compter de la connexion'],
                ['Lien de confirmation d’adresse', '24 heures'],
                ['Lien de réinitialisation du mot de passe', '30 minutes'],
                ['Historique envoyé au modèle', 'les 40 derniers messages de la conversation'],
                ['Longueur d’une mémoire', '2 000 caractères'],
                ['Diapositives d’un export PowerPoint', '60 au maximum'],
              ],
            },
          ],
        },
        {
          id: 'stockage',
          titre: 'Ce qui est conservé',
          blocs: [
            {
              type: 'liste',
              items: [
                'Conversations, messages, projets, missions, mémoires, créations et exports demandés : conservés jusqu’à leur suppression.',
                'Sessions : seule une empreinte du jeton est stockée, jamais le jeton lui-même.',
                'Jetons de vérification et de réinitialisation : à usage unique, jamais en clair, expirés à l’heure dite.',
                'Journal d’administration : 200 dernières actions, sans mot de passe ni jeton.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'La suppression d’un compte efface le compte et ses données associées. Elle est définitive : il n’existe pas de corbeille.',
            },
          ],
        },
        {
          id: 'augmenter',
          titre: 'Que faire quand une limite gêne',
          blocs: [
            {
              type: 'liste',
              items: [
                'Attendre la fin de la fenêtre : elle est indiquée dans le refus.',
                'Regrouper les demandes dans un même message plutôt que d’en envoyer plusieurs.',
                'Pour un usage d’équipe ou un besoin supérieur, la limite se règle côté serveur (administrateur de l’instance).',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Les valeurs ci-dessus sont celles du code livré. Une instance peut les avoir ajustées : le refus, lui, indique toujours la fenêtre réellement appliquée.',
            },
          ],
        },
      ],
      associes: ['erreurs', 'api'],
    },
    {
      slug: 'compte-securite',
      icone: 'shield-halved',
      titre: 'Compte, données et sécurité',
      resume: 'Connexion, sessions actives, mot de passe, exports et suppression : ce que vous contrôlez vraiment.',
      duree: '6 min',
      sections: [
        {
          id: 'objectif',
          titre: 'Ce que vous contrôlez',
          blocs: [
            {
              type: 'para',
              texte:
                'Tout ce qui touche au compte se règle depuis « Paramètres » et « Sécurité du compte » : la connexion, les appareils connectés, le mot de passe, les exports et la suppression définitive.',
            },
            {
              type: 'liste',
              items: [
                'Connexion par mot de passe ou par Google.',
                'Sessions actives, avec appareil et dernière activité.',
                'Changement de mot de passe, qui ferme les autres sessions.',
                'Export d’une conversation en PDF ou en Word.',
                'Suppression définitive du compte et de ses données.',
              ],
            },
          ],
        },
        {
          id: 'connexion',
          titre: 'Se connecter, récupérer l’accès',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Par mot de passe : saisissez l’adresse et le mot de passe sur la page de connexion.',
                'Par Google : bouton « Continuer avec Google ». Si la connexion Google n’est pas configurée sur l’instance, le bouton n’apparaît pas — rien n’est simulé.',
                'Mot de passe oublié : demandez un lien depuis « Mot de passe oublié ». Il est valable 30 minutes et ne sert qu’une fois.',
                'Adresse à confirmer : ouvrez le lien reçu (valable 24 heures). S’il a expiré, un nouveau peut être demandé depuis les paramètres, trois fois par heure au maximum.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'La confirmation d’adresse n’est bloquante que si l’exploitant l’a activée. Quand elle l’est, l’espace répond « email-non-verifie » tant que le lien n’a pas été ouvert. Délier une connexion Google n’est pas encore possible : il faut supprimer le compte pour repartir de zéro.',
            },
          ],
        },
        {
          id: 'sessions',
          titre: 'Sessions actives',
          blocs: [
            {
              type: 'para',
              texte:
                'Chaque appareil connecté apparaît avec son navigateur et sa dernière activité. Une session dure 7 jours à compter de la connexion : passé ce délai, il faut se reconnecter.',
            },
            {
              type: 'etapes',
              items: [
                'Ouvrez « Sécurité du compte » dans les paramètres.',
                'Repérez un appareil que vous ne reconnaissez pas.',
                'Fermez-le : sa session est révoquée immédiatement.',
                'En cas de doute, utilisez « Fermer les autres sessions » : tout sauf l’appareil courant est déconnecté.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Changer de mot de passe ferme aussi les autres sessions. Un appareil révoqué qui revient reçoit « session-expiree » et doit se reconnecter.',
            },
          ],
        },
        {
          id: 'motdepasse',
          titre: 'Changer de mot de passe',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Paramètres → Sécurité du compte ».',
                'Saisissez le mot de passe actuel, puis le nouveau (8 caractères minimum).',
                'Validez : les autres appareils sont déconnectés.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Cinq changements sont possibles par tranche de 15 minutes. Un compte créé uniquement via Google n’a pas encore de mot de passe : depuis une session ouverte, vous pouvez en définir un sans saisir d’ancien mot de passe — utile pour se connecter sans passer par Google.',
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
                'Seule une empreinte des jetons de session est stockée : le jeton lui-même n’est jamais conservé en clair.',
                'Les conversations ne sont accessibles qu’au compte qui les a créées.',
                'L’export d’une création produit un fichier chez vous ; rien n’est publié ni partagé automatiquement.',
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
          id: 'suppression',
          titre: 'Supprimer son compte',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Ouvrez « Paramètres », puis la zone de suppression.',
                'Saisissez votre mot de passe et confirmez.',
                'Le compte et ses données de travail sont effacés, les sessions fermées.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'La suppression est définitive : il n’existe pas de corbeille. Elle est différente d’une suspension prononcée par l’administration, qui ferme l’accès mais conserve les données.',
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
                ['« Identifiants incorrects »', 'Adresse ou mot de passe erroné.', 'Réessayer, puis passer par la réinitialisation.'],
                ['« Session expirée » sans raison', 'Session fermée depuis un autre appareil (ou révoquée).', 'Se reconnecter ; vérifier les sessions actives.'],
                ['Lien de réinitialisation refusé', 'Lien déjà utilisé ou âgé de plus de 30 minutes.', 'Demander un nouveau lien.'],
                ['Export PDF vide', 'Conversation sans réponse enregistrée.', 'Attendre la fin de la génération avant d’exporter.'],
                ['Impossible de se connecter après une suspension', 'Compte fermé par l’administration (code « compte-banni »).', 'Contacter l’administrateur de l’instance ; les données sont intactes.'],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'erreurs'],
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
            {
              type: 'note',
              ton: 'info',
              texte:
                'AURA can also be installed as an app on phone or computer: see the “Install AURA” guide.',
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
          id: 'modes',
          titre: 'The four modes',
          blocs: [
            {
              type: 'para',
              texte:
                'The mode selector changes how the request is handled, not just the tone of the answer. It applies to messages without an image: an image goes to the engine able to read it.',
            },
            {
              type: 'tableau',
              entetes: ['Mode', 'What it favours', 'When to pick it'],
              lignes: [
                ['Aura', 'A direct, fluid, streaming answer.', 'Everyday conversation, simple questions.'],
                ['Reasoning', 'A model built for reasoning.', 'A plan, a decision, a problem to unpack.'],
                ['Code', 'A model declared code-compatible.', 'Writing, fixing or explaining code.'],
                ['Search', 'The ability to cite real sources (URLs).', 'A fact to check, news, a sourced comparison.'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Each mode requires a specific capability from the configured provider. If no model has it, the request is refused with an explicit code (for example “aucun-fournisseur”): no answer is invented to save face.',
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
          id: 'exemple',
          titre: 'Concrete example',
          blocs: [
            {
              type: 'code',
              langage: 'text',
              code: 'Project goal: prepare the opening of a phone shop in Cotonou.',
            },
            {
              type: 'para',
              texte:
                'Expected result: a list of suggested missions (local market study, supplier choice, cash-flow plan, launch communication). You validate the ones that concern you; the others are never saved.',
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
      slug: 'memoire',
      icone: 'brain',
      titre: 'Memory',
      resume: 'What AURA keeps between two conversations — and how to write, switch off or delete it.',
      duree: '5 min',
      sections: [
        {
          id: 'principe',
          titre: 'What memory is for',
          blocs: [
            {
              type: 'para',
              texte:
                'A conversation’s history does not cross its own walls: a new conversation starts without the previous exchanges. Memory fills that gap, but only with what you choose to write: a lasting preference, context about your work, a style instruction.',
            },
            {
              type: 'liste',
              items: [
                'Preference: “Answer in French, without jargon.”',
                'Personal context: “I work alone on a training project in Cotonou.”',
                'Answer preference: “Always give a plan before the text.”',
              ],
            },
          ],
        },
        {
          id: 'ajouter',
          titre: 'Writing a memory',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Memory” in the sidebar.',
                'Create an entry: the text may be up to 2,000 characters.',
                'Choose its type (preference, personal context, answer preference).',
                'Attach it to a project if it concerns only one project; leave empty for general scope.',
                'Save: the entry is active immediately.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'A disabled memory stays in your list but is never sent to the model. You can re-enable it at any time.',
            },
          ],
        },
        {
          id: 'portee',
          titre: 'Scope and order',
          blocs: [
            {
              type: 'para',
              texte:
                'Two scopes coexist: general (no project) and project-bound. A conversation opened from a project receives the general memories and that project’s own; the most recent memories are presented first.',
            },
            {
              type: 'liste',
              items: [
                'A project memory does not leak into other projects.',
                'Only active memories are sent to the model.',
                'How many are sent depends on their length: beyond a certain size the context is truncated — keep entries short and useful.',
              ],
            },
          ],
        },
        {
          id: 'controle',
          titre: 'Turning memory off',
          blocs: [
            {
              type: 'para',
              texte:
                'In “Settings → Preferences”, the line “Allow memory usage in answers” controls sending. When disabled, no memory is sent at all, even active ones.',
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'AURA never writes a memory on your behalf: no conversation content is extracted automatically. What is kept is exactly what you typed.',
            },
          ],
        },
        {
          id: 'effacer',
          titre: 'Deleting and starting over',
          blocs: [
            {
              type: 'liste',
              items: [
                'Deleting one entry: permanent, immediate.',
                'Deleting all memories: a single action from the “Memory” page.',
                'Deleting the account: also erases memories, like the rest of your data.',
              ],
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common problems',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                [
                  'The memory seems ignored',
                  'The usage preference is off, or the entry is inactive.',
                  'Check both in “Settings” and “Memory”.',
                ],
                [
                  'The answer mixes two projects',
                  'General memories contradict a project’s ones.',
                  'Attach the instruction to the right project, or make it more specific.',
                ],
                [
                  'The entry is rejected',
                  'Empty text or longer than 2,000 characters.',
                  'Shorten it: a useful instruction fits in two sentences.',
                ],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'projets-missions'],
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
      slug: 'exports',
      icone: 'download',
      titre: 'Exports and formats',
      resume: 'Getting a creation out of the app: eight formats, and what each file really contains.',
      duree: '5 min',
      sections: [
        {
          id: 'ou',
          titre: 'Where to export',
          blocs: [
            {
              type: 'para',
              texte:
                'Any Studio creation can be exported, at the version you are viewing. Export happens from the open creation, never from the list.',
            },
            {
              type: 'etapes',
              items: [
                'Open “Studio”, then the creation you need.',
                'Pick the version to export (most recent by default).',
                'Open the export menu and choose a format.',
                'The file downloads immediately, named after the title.',
              ],
            },
          ],
        },
        {
          id: 'formats',
          titre: 'The eight formats',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Format', 'What it is for', 'What the file contains'],
              lignes: [
                ['.docx (Word)', 'Edit, annotate, send', 'Headings, paragraphs, lists, quotes, code. Calibri and Consolas.'],
                ['.pdf', 'Share without edits', 'A4, headings, lists, quotes in grey, code, page numbers and footer.'],
                ['.pptx (PowerPoint)', 'Present', 'One slide per heading, 16:9, 60 slides maximum.'],
                ['.xlsx (Excel)', 'Work with tables', 'One sheet per section, tables extracted, numbers stored as numbers.'],
                ['.csv', 'Import elsewhere', 'Tables only, semicolon separator, UTF-8 with BOM (French Excel opens it as is).'],
                ['.txt', 'Read anywhere', 'Plain text, headings in capitals underlined with dashes.'],
                ['.html', 'Open in a browser', 'Standalone page, simple styles, no remote resource.'],
                ['.md (Markdown)', 'Version, reuse', 'The original structure, the most faithful.'],
              ],
            },
          ],
        },
        {
          id: 'fidelite',
          titre: 'What is kept, what is not',
          blocs: [
            {
              type: 'liste',
              items: [
                'Kept everywhere: section order, headings, lists, tables (except TXT and simplified HTML), code.',
                'Not kept: the web page’s look (brand colours, fonts, animations).',
                'PDF: no italics — standard fonts do not provide them without embedding a file. Quotes are rendered in grey.',
                'CSV: only tables are exported; with none present, text is written line by line.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'No format is a screenshot: these are real, editable documents. Sophisticated layout (columns, boxes) does not exist inside creations, so it cannot be exported.',
            },
          ],
        },
        {
          id: 'nommage',
          titre: 'File name',
          blocs: [
            {
              type: 'para',
              texte:
                'The name follows the creation title: accents removed, spaces turned into dashes, 60 characters maximum, then the extension. “Launch plan — Aura” becomes “launch-plan-aura.pdf”.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Exporting the same version twice produces two identical files: nothing changes server-side, and an export does not count as a revision.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common problems',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                ['The export button is inactive', 'The creation has no generated version yet.', 'Wait for generation to finish, then retry.'],
                ['Excel shows a single column', 'The spreadsheet separator is not a semicolon.', 'Prefer .xlsx, or set the separator on import.'],
                ['The PDF shows “?” instead of a character', 'Character missing from the standard fonts encoding (emoji, CJK).', 'Remove the emoji or choose .docx, which handles Unicode.'],
              ],
            },
          ],
        },
      ],
      associes: ['studio', 'conversation'],
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
      slug: 'application',
      icone: 'display',
      titre: 'Install AURA',
      resume: 'Install the app on a phone or computer, what works offline, and how updates arrive.',
      duree: '4 min',
      sections: [
        {
          id: 'interet',
          titre: 'Why install',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA installs from the browser: no store, no fee, no extra account. The app opens full screen, without an address bar, and keeps the interface shell cached so it starts fast.',
            },
            {
              type: 'note',
              ton: 'info',
              texte: 'It is the same site, with the same account and the same data. Installing duplicates nothing.',
            },
          ],
        },
        {
          id: 'installer',
          titre: 'The gesture, per device',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Device', 'Gesture'],
              lignes: [
                ['Android (Chrome)', '⋮ menu → “Install app”. An “Install AURA” button also appears in the sidebar.'],
                ['iPhone / iPad (Safari)', 'Share button → “Add to Home Screen” → Add.'],
                ['Desktop (Chrome, Edge)', 'Install icon in the address bar, or the sidebar button.'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'On iPhone, only Safari offers Add to Home Screen; in-app browsers (Facebook, Instagram) do not. On Android, avoid in-app browsers too.',
            },
          ],
        },
        {
          id: 'hors-ligne',
          titre: 'What works offline',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Item', 'Offline'],
              lignes: [
                ['App shell (interface, styles, icons)', 'yes, cached'],
                ['Pages already visited', 'yes'],
                ['Conversations, search, creations', 'no — network required'],
                ['Queued messages', 'no — nothing is queued'],
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'AURA never caches API responses. A suspended account, a closed session or a deleted conversation must be seen immediately, never replayed from a cache.',
            },
          ],
        },
        {
          id: 'mises-a-jour',
          titre: 'Updates',
          blocs: [
            {
              type: 'para',
              texte:
                'A new version downloads in the background, then is offered by a banner: “A new version of AURA is ready — Reload”. Nothing reloads without your consent.',
            },
            {
              type: 'liste',
              items: [
                'The current version stays usable until you reload.',
                'Reloading does not sign you out and does not lose a generation running server-side.',
                'No update installs mid-conversation without a gesture from you.',
              ],
            },
          ],
        },
        {
          id: 'desinstaller',
          titre: 'Uninstall',
          blocs: [
            {
              type: 'para',
              texte:
                'Long-press the icon → “Uninstall” (or “Remove shortcut”). On desktop: install icon in the address bar → Uninstall.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Uninstalling deletes no account and no data: everything stays on the server, reachable by signing in from any browser.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common problems',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                ['No install prompt', 'The site was opened in an in-app browser, or the page has not been reloaded yet.', 'Open in Chrome or Safari, reload once.'],
                ['The update banner keeps coming back', 'The reload did not complete (tab asleep).', 'Close all AURA tabs, reopen the app, reload.'],
                ['“Offline” page while the network is up', 'Captive or very slow network (the timeout is 6 seconds).', 'Reconnect, then retry.'],
              ],
            },
          ],
        },
      ],
      associes: ['demarrage', 'compte-securite'],
    },
    {
      slug: 'erreurs',
      icone: 'triangle-exclamation',
      titre: 'Understanding errors',
      resume: 'Every message carries a precise code. Here is what they mean, and what to do.',
      duree: '6 min',
      sections: [
        {
          id: 'lire',
          titre: 'A code, not a guess',
          blocs: [
            {
              type: 'para',
              texte:
                'AURA never replaces a failure with an invented answer. Every refusal carries a stable code, visible in the API response and rendered plainly in the interface. The code is the truth: the message may change language, not the code.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'For a diagnosis, send the code, the approximate time and the action attempted. Never send your session cookie or your password.',
            },
          ],
        },
        {
          id: 'compte',
          titre: 'Account and session',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Status', 'Meaning', 'What to do'],
              lignes: [
                ['identifiants', '401', 'Wrong address or password.', 'Check the entry; use password reset if needed.'],
                ['anonyme', '401', 'No valid session.', 'Sign in.'],
                ['session-expiree', '401', 'The session was closed or revoked.', 'Sign in again; on another device it signals a revocation.'],
                ['email-non-verifie', '403', 'The address must be confirmed first.', 'Open the link received; otherwise resend from settings.'],
                ['compte-banni', '403', 'The account was suspended by administration.', 'Contact the instance administrator; data is kept.'],
                ['limite', '429', 'Too many requests in the current window.', 'Wait until the window resets.'],
                ['jeton-invalide / jeton-expire', '410', 'Verification or reset link already used or expired.', 'Request a new link.'],
              ],
            },
          ],
        },
        {
          id: 'ia',
          titre: 'AI engines',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Meaning', 'What to do'],
              lignes: [
                ['modele-indisponible', 'No configured engine can handle this request.', 'Check the instance configuration; retry later.'],
                ['cle-manquante', 'A provider key is missing.', 'Server configuration: nothing to do as a user.'],
                ['limite-modele', 'The provider reached its quota.', 'Wait, or switch mode for a less busy model.'],
                ['auth-fournisseur', 'The provider rejected the key.', 'Server configuration: the key must be replaced.'],
                ['bloque', 'The model refused the request (content).', 'Rephrase; this is not an outage.'],
                ['vide', 'The model returned an empty answer.', 'Retry once, then rephrase.'],
                ['timeout', 'The model did not answer in time.', 'Retry; shorten the request if it repeats.'],
                ['aucun-fournisseur', 'No compatible provider is available.', 'Server configuration, or a mode needing a missing capability.'],
                ['reseau', 'The link to the provider failed.', 'Retry; check the server connection.'],
              ],
            },
          ],
        },
        {
          id: 'service',
          titre: 'Service and storage',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Code', 'Status', 'Meaning'],
              lignes: [
                ['stockage-indisponible', '503', 'The database is not configured or not responding: nothing is written, nothing is lost.'],
                ['mail-indisponible', '503', 'No email provider: links cannot be sent (they are never reported as sent).'],
                ['google-indisponible', '503', 'Google sign-in is not configured on this environment.'],
                ['chat-indisponible', '503', 'No AI engine active: the conversation is refused plainly.'],
                ['admin-non-configure', '503', 'The admin panel is not enabled on this environment.'],
                ['validation', '400', 'A submitted value is invalid; the failing field is reported.'],
                ['introuvable', '404', 'The resource does not exist, or belongs to another account.'],
                ['interne', '500', 'Unexpected server error; logged without sensitive data.'],
              ],
            },
          ],
        },
        {
          id: 'diagnostic',
          titre: 'What to note before asking for help',
          blocs: [
            {
              type: 'liste',
              items: [
                'The exact code (for example “modele-indisponible”), not just the displayed sentence.',
                'The time, with the time zone, to find the server trace.',
                'The screen and the action: “sending a message in Search mode” beats “it does not work”.',
                'The browser and device, if the error affects only one device.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Never paste a cookie, a verification token or a password into a message: those grant full access and do not help diagnosis.',
            },
          ],
        },
      ],
      associes: ['limites', 'compte-securite'],
    },
    {
      slug: 'limites',
      icone: 'bars-progress',
      titre: 'Rate limits and lifetimes',
      resume: 'The limits actually enforced, their windows, and how long links and sessions last.',
      duree: '5 min',
      sections: [
        {
          id: 'principe',
          titre: 'Why limits exist',
          blocs: [
            {
              type: 'para',
              texte:
                'AI engines cost money on every call. Limits protect the service from automated use and keep one person from monopolising capacity. They apply per account, server-side — not in the browser.',
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'A reached limit always returns an explicit refusal (code “limite”, status 429) with the window to wait for: never a simulated answer.',
            },
          ],
        },
        {
          id: 'debit',
          titre: 'Rate windows',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Action', 'Limit', 'Window'],
              lignes: [
                ['Conversation messages', '40', '5 minutes'],
                ['Sourced search', '12', '5 minutes'],
                ['Mission breakdown assistance', '12', '5 minutes'],
                ['Studio creations', '12', '10 minutes'],
                ['New version of a creation', '12', '10 minutes'],
                ['Password change', '5', '15 minutes'],
                ['Account deletion', '5', '15 minutes'],
                ['Resending the verification link', '3', '1 hour'],
                ['Administration requests', '120', '5 minutes'],
              ],
            },
          ],
        },
        {
          id: 'duree',
          titre: 'Lifetimes',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Item', 'Lifetime'],
              lignes: [
                ['Open session', '7 days from sign-in'],
                ['Email confirmation link', '24 hours'],
                ['Password reset link', '30 minutes'],
                ['History sent to the model', 'the last 40 messages of the conversation'],
                ['Length of a memory', '2,000 characters'],
                ['Slides in a PowerPoint export', '60 maximum'],
              ],
            },
          ],
        },
        {
          id: 'stockage',
          titre: 'What is kept',
          blocs: [
            {
              type: 'liste',
              items: [
                'Conversations, messages, projects, missions, memories, creations and requested exports: kept until deleted.',
                'Sessions: only a hash of the token is stored, never the token itself.',
                'Verification and reset tokens: single use, never in clear text, expired on time.',
                'Administration log: last 200 actions, without passwords or tokens.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Deleting an account erases the account and its related data. It is final: there is no recycle bin.',
            },
          ],
        },
        {
          id: 'augmenter',
          titre: 'When a limit gets in the way',
          blocs: [
            {
              type: 'liste',
              items: [
                'Wait for the window to reset: it is stated in the refusal.',
                'Group requests into one message instead of sending several.',
                'For team use or higher needs, the limit is set server-side (instance administrator).',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'The values above are those of the shipped code. An instance may have adjusted them: the refusal always states the window actually enforced.',
            },
          ],
        },
      ],
      associes: ['erreurs', 'api'],
    },
    {
      slug: 'compte-securite',
      icone: 'shield-halved',
      titre: 'Account, data and security',
      resume: 'Signing in, active sessions, password, exports and deletion: what you actually control.',
      duree: '6 min',
      sections: [
        {
          id: 'objectif',
          titre: 'What you control',
          blocs: [
            {
              type: 'para',
              texte:
                'Everything about your account lives under “Settings” and “Account security”: signing in, connected devices, password, exports and permanent deletion.',
            },
            {
              type: 'liste',
              items: [
                'Sign-in with a password or with Google.',
                'Active sessions, with device and last activity.',
                'Password change, which closes other sessions.',
                'Conversation export to PDF or Word.',
                'Permanent deletion of the account and its data.',
              ],
            },
          ],
        },
        {
          id: 'connexion',
          titre: 'Signing in, recovering access',
          blocs: [
            {
              type: 'etapes',
              items: [
                'With a password: enter the address and password on the sign-in page.',
                'With Google: “Continue with Google”. If Google sign-in is not configured on the instance, the button does not appear — nothing is simulated.',
                'Forgot password: request a link from “Forgot password”. It is valid for 30 minutes and works once.',
                'Address to confirm: open the link received (valid 24 hours). If it expired, a new one can be requested from settings, at most three times an hour.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Email confirmation only blocks access when the operator enabled it. When it is on, the workspace answers “email-non-verifie” until the link is opened. Unlinking a Google connection is not possible yet: deleting the account is the way to start over.',
            },
          ],
        },
        {
          id: 'sessions',
          titre: 'Active sessions',
          blocs: [
            {
              type: 'para',
              texte:
                'Each connected device appears with its browser and last activity. A session lasts 7 days from sign-in: after that, you must sign in again.',
            },
            {
              type: 'etapes',
              items: [
                'Open “Account security” in settings.',
                'Spot a device you do not recognise.',
                'Close it: its session is revoked immediately.',
                'If in doubt, use “Close other sessions”: everything except the current device is signed out.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'Changing your password also closes other sessions. A revoked device that comes back receives “session-expiree” and must sign in again.',
            },
          ],
        },
        {
          id: 'motdepasse',
          titre: 'Changing your password',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Settings → Account security”.',
                'Enter the current password, then the new one (8 characters minimum).',
                'Confirm: other devices are signed out.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Five changes are allowed per 15-minute window. An account created only through Google has no password yet: from an open session you can set one without typing an old password — handy to sign in without Google.',
            },
          ],
        },
        {
          id: 'donnees',
          titre: 'How data is handled',
          blocs: [
            {
              type: 'liste',
              items: [
                'AI engine keys stay server-side: they are never sent to the browser.',
                'Messages are sent to the configured AI engine only to produce the answer.',
                'Technical logs record the provider, duration and error type — never your message content or passwords.',
                'Only a hash of session tokens is stored: the token itself is never kept in clear text.',
                'Conversations are accessible only to the account that created them.',
                'Exporting a creation produces a file on your side; nothing is published or shared automatically.',
              ],
            },
            {
              type: 'note',
              ton: 'info',
              texte:
                'These points describe how the product currently works. Contractual texts (terms, privacy policy) still need legal review before publication.',
            },
          ],
        },
        {
          id: 'suppression',
          titre: 'Deleting your account',
          blocs: [
            {
              type: 'etapes',
              items: [
                'Open “Settings”, then the deletion area.',
                'Enter your password and confirm.',
                'The account and its work data are erased, sessions closed.',
              ],
            },
            {
              type: 'note',
              ton: 'limite',
              texte:
                'Deletion is final: there is no recycle bin. It differs from an administrative suspension, which closes access but keeps the data.',
            },
          ],
        },
        {
          id: 'problemes',
          titre: 'Common problems',
          blocs: [
            {
              type: 'tableau',
              entetes: ['Symptom', 'Likely cause', 'Fix'],
              lignes: [
                ['“Invalid credentials”', 'Wrong address or password.', 'Retry, then use the reset flow.'],
                ['“Session expired” for no reason', 'Session closed from another device (or revoked).', 'Sign in again; check active sessions.'],
                ['Reset link refused', 'Link already used, or older than 30 minutes.', 'Request a new link.'],
                ['Empty PDF export', 'Conversation with no saved answer.', 'Wait for generation to finish before exporting.'],
                ['Cannot sign in after a suspension', 'Account closed by administration (code “compte-banni”).', 'Contact the instance administrator; data is intact.'],
              ],
            },
          ],
        },
      ],
      associes: ['conversation', 'erreurs'],
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
