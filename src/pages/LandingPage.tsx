import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AuraLogo } from '../components/brand/AuraLogo';
import { AuraSculptureCanvas } from '../three/AuraSculptureCanvas';
import { useRevealAll } from '../components/motion/useReveal';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOTS_BANDEAU = [
  'Réfléchir',
  'Rechercher',
  'Créer',
  'Développer',
  'Livrer',
  'Réfléchir',
  'Rechercher',
  'Créer',
  'Développer',
  'Livrer',
];

const ETAPES = [
  {
    num: '01',
    titre: 'Réfléchir',
    texte:
      "Tout commence par une conversation. L'idée se clarifie, se découpe, se confronte — jusqu'à ce que le vrai projet apparaisse.",
    mots: ['Conversation', 'Clarification', 'Vision'],
    c1: '#A5E838',
    c2: '#43BC2C',
  },
  {
    num: '02',
    titre: 'Rechercher',
    texte:
      "Aura Explore interroge le web et ne renvoie que des réponses sourcées et traçables. La confiance naît de la preuve.",
    mots: ['Sourcé', 'Traçable', 'Web'],
    c1: '#EACB37',
    c2: '#F4E07A',
  },
  {
    num: '03',
    titre: 'Créer',
    texte:
      "Du brief au projet structuré : designs, documents, code. Aura Studio construit, itère, versionne — sous vos yeux.",
    mots: ['Studio', 'Itération', 'Versions'],
    c1: '#FF790D',
    c2: '#E85D00',
  },
  {
    num: '04',
    titre: 'Développer',
    texte:
      "Le résultat se livre : code exécutable, exports propres, mission close. De l'idée au résultat, sans rupture de fil.",
    mots: ['Exécution', 'Livrable', 'Résultat'],
    c1: '#43BC2C',
    c2: '#FF790D',
  },
];

const CAPACITES = [
  {
    idx: '01',
    titre: 'Conversations',
    texte:
      "Un fil de pensée qui garde le contexte, explique ses choix et se souvient de vos projets. Pas un chatbot de plus : un partenaire de travail.",
    mots: ['Contexte long', 'Multimodal', 'Mémoire de projet'],
  },
  {
    idx: '02',
    titre: 'Recherche sourcée',
    texte:
      "Explore fouille le web et cite ses sources à chaque affirmation. Les réponses se vérifient, se comparent, se partagent.",
    mots: ['Citations', 'Veille', 'Comparaison'],
  },
  {
    idx: '03',
    titre: 'Studio de création',
    texte:
      "Générez des sites, documents et visuels qui deviennent de vrais projets : versions, aperçus multi-écrans, exports propres.",
    mots: ['Génération', 'Aperçus', 'Export'],
  },
  {
    idx: '04',
    titre: 'Missions & projets',
    texte:
      "Découpez un objectif en missions suivies, avec étapes, livrables et quotas clairs. L'ambition devient un plan exécutable.",
    mots: ['Planification', 'Suivi', 'Quotas clairs'],
  },
];

const DECLARATION =
  "Aura tient le fil : votre première phrase devient un plan, le plan devient une création, la création devient un résultat.";

const CREATIONS = [
  {
    titre: 'Boutique de téléphones — Cotonou',
    brief: 'Brief : e-commerce premium, prix en FCFA, mobile d’abord.',
    grad: 'linear-gradient(120deg, #A5E838, #43BC2C)',
  },
  {
    titre: 'Studio photo — lumière douce',
    brief: 'Brief : portfolio éditorial, galerie immersive, contact direct.',
    grad: 'linear-gradient(120deg, #EACB37, #F4E07A)',
  },
  {
    titre: 'Chef cuisinier — table du jour',
    brief: 'Brief : site vitrine gourmand, menu illustré, réservation.',
    grad: 'linear-gradient(120deg, #FF790D, #E85D00)',
  },
  {
    titre: 'Fintech — épargne mobile',
    brief: 'Brief : landing rassurante, parcours simple, chiffres clairs.',
    grad: 'linear-gradient(120deg, #43BC2C, #A5E838)',
  },
  {
    titre: 'Voyage — carnet du Bénin',
    brief: 'Brief : récit de voyage illustré, carte, carnet photo.',
    grad: 'linear-gradient(120deg, #EACB37, #FF790D)',
  },
  {
    titre: 'Festival — nuit d’ouverture',
    brief: 'Brief : page événementielle vibrante, programme, billetterie.',
    grad: 'linear-gradient(120deg, #FF790D, #A5E838)',
  },
];

const DOCS = [
  {
    num: '01',
    titre: 'Démarrage',
    texte: 'Créer son espace, comprendre le fil et poser sa première intention.',
    etat: 'redaction',
    label: 'En rédaction',
  },
  {
    num: '02',
    titre: 'Le fil Aura',
    texte: 'Conversation, contexte, mémoire de projet : bien penser avec Aura.',
    etat: 'redaction',
    label: 'En rédaction',
  },
  {
    num: '03',
    titre: 'Recherche sourcée',
    texte: 'Interroger le web, lire les citations, vérifier, comparer, citer.',
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '04',
    titre: 'Studio & créations',
    texte: 'Générer, itérer, versionner, prévisualiser et exporter proprement.',
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '05',
    titre: 'Comptes & équipes',
    texte: 'Profils, espaces partagés, rôles et tranquillité des données.',
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '06',
    titre: 'API & développeurs',
    texte: 'Brancher Aura dans vos outils — avec des limites honnêtes.',
    etat: 'planifie',
    label: 'À venir',
  },
];

const PLANS = [
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
];

export const LandingPage: React.FC = () => {
  const racine = useRef<HTMLDivElement | null>(null);
  const bandeauRef = useRef<HTMLDivElement | null>(null);
  const filRef = useRef<HTMLDivElement | null>(null);
  const declRef = useRef<HTMLDivElement | null>(null);
  const galerieRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const docsReveal = useRevealAll<HTMLDivElement>();
  const tarifsReveal = useRevealAll<HTMLDivElement>();

  // Nav : fond au scroll
  useEffect(() => {
    const onScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 32);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useGSAP(
    () => {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduit) {
        gsap.set('.ligne-masquee > span', { y: 0 });
        gsap.set('[data-hero]', { opacity: 1, y: 0 });
        gsap.set('.declaration-texte .mot', { opacity: 1 });
        return;
      }

      /* ===== HERO : entrée cinématique ===== */
      gsap.to('.ligne-masquee > span', {
        y: 0,
        duration: 1.3,
        ease: 'power4.out',
        stagger: 0.14,
        delay: 0.12,
      });
      gsap.from('[data-hero]', {
        opacity: 0,
        y: 36,
        duration: 1.15,
        ease: 'power3.out',
        stagger: 0.13,
        delay: 0.42,
      });

      /* ===== HERO : parallaxe mots + zoom sculpture au scroll ===== */
      gsap.utils.toArray<HTMLElement>('.hero-mot').forEach((mot, i) => {
        gsap.to(mot, {
          yPercent: i % 2 ? -16 : -30,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
      gsap.to('.hero-scene', {
        yPercent: -12,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.utils.toArray<SVGElement>('.hero-traits svg').forEach((svg, i) => {
        gsap.to(svg, {
          xPercent: i ? -8 : 8,
          rotate: i ? -3 : 3,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      /* ===== BANDEAU : défilement soie infini ===== */
      const ruban = bandeauRef.current?.querySelector<HTMLElement>('.bandeau-ruban');
      if (ruban) {
        gsap.to(ruban, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      }

      /* ===== LE FIL : ruban SVG dessiné + étapes qui glissent ===== */
      const chemins = filRef.current?.querySelectorAll<SVGPathElement>('[data-fil-chemin]');
      chemins?.forEach((chemin) => {
        const longueur = chemin.getTotalLength();
        gsap.set(chemin, { strokeDasharray: longueur, strokeDashoffset: longueur });
        gsap.to(chemin, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: filRef.current,
            start: 'top 68%',
            end: 'bottom 72%',
            scrub: 0.8,
          },
        });
      });
      gsap.utils.toArray<HTMLElement>('.etape').forEach((etape) => {
        gsap.from(etape.querySelector('.etape-texte'), {
          y: 64,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: etape, start: 'top 78%' },
        });
        gsap.from(etape.querySelector('.etape-visuel'), {
          y: 42,
          rotate: -2.2,
          opacity: 0,
          duration: 1.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: etape, start: 'top 78%' },
        });
      });

      /* ===== DÉCLARATION : mots accrochés au scroll ===== */
      const decl = declRef.current?.querySelector<HTMLElement>('.declaration-texte');
      if (decl) {
        gsap.to(decl.querySelectorAll('.mot'), {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: declRef.current,
            start: 'top 74%',
            end: 'center 40%',
            scrub: 0.6,
          },
        });
      }

      /* ===== CAPACITÉS : rangées qui respirent ===== */
      gsap.utils.toArray<HTMLElement>('.capacite').forEach((ligne) => {
        gsap.from(ligne, {
          y: 44,
          opacity: 0,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: { trigger: ligne, start: 'top 86%' },
        });
      });

      /* ===== GALERIE : piste horizontale épinglée (desktop) ===== */
      const mm = gsap.matchMedia();
      mm.add(
        '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        () => {
          const piste = galerieRef.current?.querySelector<HTMLElement>('.galerie-piste');
          const track = galerieRef.current?.querySelector<HTMLElement>('.galerie-track');
          if (!piste || !track) return;

          const distance = () => Math.max(0, track.scrollWidth - piste.clientWidth + 48);

          gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: galerieRef.current,
              start: 'top top',
              end: () => `+=${distance() + window.innerHeight * 0.35}`,
              pin: true,
              scrub: 0.9,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });
        },
      );

      /* ===== TARIFS : la carte vedette s'ouvre en lumière ===== */
      gsap.from('.plan-vedette', {
        y: 60,
        scale: 0.94,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tarifs-grille', start: 'top 78%' },
      });
    },
    { scope: racine },
  );

  return (
    <div ref={racine}>
      {/* ================= NAV (légère) ================= */}
      <nav ref={navRef} className="nav" aria-label="Navigation principale">
        <div className="wrap nav-interieur">
          <Link to="/" aria-label="AURA — accueil">
            <AuraLogo taille="sm" />
          </Link>
          <ul className="nav-liens">
            <li>
              <a href="#galerie">Galerie</a>
            </li>
            <li>
              <a href="#documentation">Documentation</a>
            </li>
            <li>
              <a href="#tarifs">Tarifs</a>
            </li>
          </ul>
          <div className="nav-cta">
            <Link to="/login" className="btn btn-ligne">
              Connexion
            </Link>
            <Link to="/register" className="btn btn-encre">
              <span>Commencer</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO (très impressionnant) ================= */}
      <header className="hero">
        <div className="hero-lueur" aria-hidden />
        <div className="hero-traits" aria-hidden>
          <svg viewBox="0 0 1400 260" fill="none">
            <defs>
              <linearGradient id="trait-haut" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A5E838" stopOpacity="0" />
                <stop offset="0.35" stopColor="#A5E838" stopOpacity="0.55" />
                <stop offset="0.7" stopColor="#EACB37" stopOpacity="0.5" />
                <stop offset="1" stopColor="#FF790D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 190 C 260 60, 520 250, 780 130 C 1020 22, 1200 160, 1400 70"
              stroke="url(#trait-haut)"
              strokeWidth="46"
              strokeLinecap="round"
            />
          </svg>
          <svg viewBox="0 0 1400 260" fill="none">
            <defs>
              <linearGradient id="trait-bas" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF790D" stopOpacity="0" />
                <stop offset="0.3" stopColor="#FF790D" stopOpacity="0.42" />
                <stop offset="0.65" stopColor="#EACB37" stopOpacity="0.42" />
                <stop offset="1" stopColor="#A5E838" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 90 C 240 210, 500 30, 760 150 C 1010 260, 1190 100, 1400 180"
              stroke="url(#trait-bas)"
              strokeWidth="34"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="wrap hero-grille">
          <div className="hero-texte">
            <span className="kicker" data-hero>
              Plateforme d'intelligence artificielle
            </span>
            <h1 className="display-xxl">
              <span className="ligne-masquee">
                <span>
                  <span className="hero-mot">De</span>{' '}
                  <span className="hero-mot">l'idée</span>
                </span>
              </span>
              <span className="ligne-masquee">
                <span>
                  <span className="hero-mot">au</span>{' '}
                  <span className="hero-mot italique-vif">résultat</span>
                  <span className="hero-mot">.</span>
                </span>
              </span>
            </h1>
            <p className="sous-titre" data-hero>
              Conversation, recherche sourcée, création et exécution — un seul fil
              de pensée qui mène du prompt au livrable. L'IA qui travaille
              vraiment avec vous.
            </p>
            <div className="hero-actions" data-hero>
              <Link to="/register" className="btn btn-ruban">
                <span>Commencer l'expérience</span>
              </Link>
              <a href="#galerie" className="btn btn-ligne">
                Voir la galerie
              </a>
            </div>
            <div className="hero-energie" data-hero>
              <span className="hero-energie-points" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              Vert pour l'idée qui pousse. Or pour la valeur créée. Orange pour
              l'énergie qui livre.
            </div>
          </div>

          <div className="hero-scene" data-hero>
            <AuraSculptureCanvas />
            <div className="scene-halo" aria-hidden />
            <figure className="scene-cadre">
              <img
                src="/assets/aura-symbol-white.jpg"
                alt="La sculpture AURA : trois rubans verts, dorés et orange tissés en flamme"
              />
            </figure>
            <figcaption className="scene-legende">La sculpture vivante d'Aura</figcaption>
          </div>
        </div>

        <div className="scroll-indices" aria-hidden>
          <span className="trait" />
          Défiler
        </div>
      </header>

      {/* ================= BANDEAU ================= */}
      <div ref={bandeauRef} className="bandeau" aria-hidden>
        <div className="bandeau-ruban">
          {MOTS_BANDEAU.map((mot, i) => (
            <span className="bandeau-mot" key={i}>
              <i /> {mot}
            </span>
          ))}
        </div>
      </div>

      {/* ================= LE FIL ================= */}
      <section id="fil" className="section fil" ref={filRef}>
        <svg
          className="fil-ruban-svg"
          viewBox="0 0 680 1600"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="fil-grad" x1="340" y1="0" x2="340" y2="1600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5E838" />
              <stop offset="0.45" stopColor="#EACB37" />
              <stop offset="1" stopColor="#FF790D" />
            </linearGradient>
          </defs>
          <path
            data-fil-chemin
            d="M340 0 C 520 190, 140 340, 340 520 C 560 710, 130 850, 340 1040 C 540 1230, 160 1380, 340 1600"
            stroke="url(#fil-grad)"
            strokeWidth="34"
            strokeLinecap="round"
            opacity="0.24"
          />
          <path
            data-fil-chemin
            d="M340 0 C 520 190, 140 340, 340 520 C 560 710, 130 850, 340 1040 C 540 1230, 160 1380, 340 1600"
            stroke="url(#fil-grad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              Le fil Aura
            </span>
            <h2 className="display-xl" data-reveal>
              Un seul fil, <em className="italique-vif">quatre gestes</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              Là où d'autres empilent des outils, Aura tient une seule ligne — de
              la première phrase au résultat final.
            </p>
          </div>

          <div className="fil-etapes">
            {ETAPES.map((e) => (
              <article className="etape" key={e.num}>
                <div className="etape-texte">
                  <div className="etape-num" aria-hidden>
                    {e.num}
                  </div>
                  <h3 className="display-lg">{e.titre}</h3>
                  <p className="corps">{e.texte}</p>
                  <div className="capacite-mots">
                    {e.mots.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
                <div className="etape-visuel">
                  <svg
                    className="etape-motif"
                    viewBox="0 0 480 320"
                    fill="none"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <rect width="480" height="320" fill="#FFFDF8" />
                    <path
                      d="M-20 250 C 120 140, 200 300, 330 170 C 400 105, 460 120, 520 60"
                      stroke={`url(#motif-${e.num})`}
                      strokeWidth="58"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    <path
                      d="M-20 250 C 120 140, 200 300, 330 170 C 400 105, 460 120, 520 60"
                      stroke="#FFFDF8"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                    <defs>
                      <linearGradient
                        id={`motif-${e.num}`}
                        x1="0"
                        y1="320"
                        x2="480"
                        y2="0"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor={e.c1} />
                        <stop offset="1" stopColor={e.c2} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DÉCLARATION (mots accrochés) ================= */}
      <section className="declaration" ref={declRef}>
        <div className="wrap-etroit">
          <p className="declaration-texte">
            {DECLARATION.split(' ').map((mot, i) => (
              <React.Fragment key={i}>
                <span className="mot">{mot}</span>{' '}
              </React.Fragment>
            ))}
          </p>
          <span className="kicker declaration-signature">
            Une seule ligne, de bout en bout
          </span>
        </div>
      </section>

      {/* ================= CAPACITÉS ================= */}
      <section id="capacites" className="section capacites">
        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              Capacités
            </span>
            <h2 className="display-xl" data-reveal>
              Quatre forces, <em className="italique-vif">une lumière</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              Chaque capacité pousse dans la continuité des autres. Rien à
              ré-exporter, rien à re-saisir.
            </p>
          </div>

          <div className="capacite-liste">
            {CAPACITES.map((c) => (
              <div className="capacite" key={c.idx}>
                <div className="capacite-index" aria-hidden>
                  {c.idx}
                </div>
                <div className="capacite-titre">
                  <span className="capacite-trait" aria-hidden />
                  <h3 className="display-md">{c.titre}</h3>
                </div>
                <div>
                  <p className="corps">{c.texte}</p>
                  <div className="capacite-mots">
                    {c.mots.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GALERIE STUDIO ================= */}
      <section id="galerie" className="galerie-section" ref={galerieRef}>
        <div className="wrap galerie-entete">
          <div>
            <span className="kicker" data-reveal>
              Galerie Studio
            </span>
            <h2 className="display-xl" data-reveal style={{ color: 'var(--papier)' }}>
              Des créations qui{' '}
              <em className="italique-vif">respirent</em>.
            </h2>
          </div>
          <p data-reveal>
            Une vitrine de rendus de démonstration — la vitrine du Studio qui
            ouvre bientôt. Faites défiler pour traverser la galerie.
          </p>
        </div>

        <div className="galerie-piste">
          <div className="galerie-track">
            {CREATIONS.map((c) => (
              <article className="galerie-carte" key={c.titre}>
                <div className="carte-apercu" style={{ ['--apercu-grad' as string]: c.grad }}>
                  <div className="apercu-barre" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="apercu-corps" aria-hidden>
                    <div className="apercu-hero" />
                    <div className="apercu-lignes">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="apercu-bas">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
                <div className="carte-meta">
                  <h3>{c.titre}</h3>
                  <span className="carte-demo">Démonstration</span>
                </div>
                <p className="carte-brief">{c.brief}</p>
              </article>
            ))}
          </div>
        </div>

        <p className="galerie-note">
          Rendus de démonstration illustratifs — aucune création client réelle
          n'est présentée. Le Studio ouvre bientôt.
        </p>
      </section>

      {/* ================= DOCUMENTATION ================= */}
      <section id="documentation" className="section docs">
        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              Documentation
            </span>
            <h2 className="display-xl" data-reveal>
              Tout au même endroit,{' '}
              <em className="italique-vif">écrit au fil du chantier</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              Guides, réflexes, références : la documentation d'Aura grandit en
              même temps que le produit — avec la même honnêteté.
            </p>
          </div>

          <div className="docs-grille" ref={docsReveal}>
            {DOCS.map((d) => (
              <article className="doc-carte" key={d.num} data-reveal>
                <span className="doc-num">§ {d.num}</span>
                <h3>{d.titre}</h3>
                <p>{d.texte}</p>
                <span className="doc-statut" data-etat={d.etat}>
                  {d.label}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TARIFS ================= */}
      <section id="tarifs" className="section">
        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              Tarifs
            </span>
            <h2 className="display-xl" data-reveal>
              Clair, <em className="italique-vif">sans surprise</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              Les contours sont posés — les prix finaux seront annoncés avant
              l'ouverture, en toute transparence.
            </p>
          </div>

          <div className="tarifs-grille" ref={tarifsReveal}>
            {PLANS.map((p) => (
              <article
                className={`plan${p.vedette ? ' plan-vedette' : ''}`}
                key={p.nom}
                data-reveal={p.vedette ? undefined : ''}
              >
                <div className="plan-nom">{p.nom}</div>
                <div className="plan-prix">
                  {p.prix}
                  <small>{p.detail}</small>
                </div>
                <ul className="plan-liste">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`btn ${p.vedette ? 'btn-ruban' : 'btn-ligne'}`}
                >
                  <span>{p.cta}</span>
                </Link>
              </article>
            ))}
          </div>

          <p className="tarifs-note">
            Aucun prix n'est figé tant qu'il n'est pas définitivement annoncé —
            pas de mauvaise surprise, jamais.
          </p>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section cta">
        <div className="wrap">
          <div className="cta-panneau" data-reveal>
            <span className="kicker" style={{ justifyContent: 'center' }}>
              Le chantier est vivant
            </span>
            <h2 className="display-xl">
              Votre prochaine idée mérite un{' '}
              <em className="italique-vif">résultat</em>.
            </h2>
            <p className="sous-titre" style={{ marginInline: 'auto' }}>
              AURA se construit au grand jour. Le site et l'identité sont là —
              les comptes et le moteur IA ouvrent aux prochaines étapes.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-encre">
                <span>Entrer dans Aura</span>
              </Link>
              <a href="#galerie" className="btn btn-ligne">
                Traverser la galerie
              </a>
            </div>
            <p className="cta-note">
              Fonctionnement annoncé à l'état réel uniquement — aucune
              fonctionnalité simulée.
            </p>
          </div>
        </div>
      </section>

      {/* ================= PIED ================= */}
      <footer className="pied">
        <div className="wrap">
          <div className="pied-haut">
            <div className="pied-marque">
              <img src="/assets/aura-symbol.svg" alt="" aria-hidden />
              <div>
                <div className="display-md" style={{ fontSize: '1.5rem' }}>
                  Aura
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                  De l'idée au résultat.
                </div>
              </div>
            </div>
            <ul className="pied-liens">
              <li>
                <a href="#galerie">Galerie</a>
              </li>
              <li>
                <a href="#documentation">Documentation</a>
              </li>
              <li>
                <a href="#tarifs">Tarifs</a>
              </li>
              <li>
                <Link to="/login">Connexion</Link>
              </li>
            </ul>
          </div>
          <div className="pied-bas">
            <span>© {new Date().getFullYear()} Aura — tous droits réservés.</span>
            <span>Conçu autour d'une sculpture : trois rubans, une flamme.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
