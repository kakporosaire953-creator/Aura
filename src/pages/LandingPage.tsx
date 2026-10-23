import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  siAnthropic,
  siClaude,
  siDeepseek,
  siGooglegemini,
  siHuggingface,
  siMetaai,
  siMistralai,
  siNvidia,
  siOllama,
  siPerplexity,
} from 'simple-icons';
import { AuraSculptureCanvas } from '../three/AuraSculptureCanvas';
import { useRevealAll } from '../components/motion/useReveal';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';

import imgTelephones from '../assets/galerie/boutique-telephones.jpg';
import imgPhoto from '../assets/galerie/studio-photo.jpg';
import imgChef from '../assets/galerie/chef-cuisinier.jpg';
import imgFintech from '../assets/galerie/fintech-epargne.jpg';
import imgVoyage from '../assets/galerie/voyage-benin.jpg';
import imgFestival from '../assets/galerie/festival-nuit.jpg';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ===== Logos de l'écosystème IA mondial (marques officielles) ===== */
type LogoIA = {
  nom: string;
  couleur: string;
  svg?: string;
  fa?: string;
};

const LOGOS_IA: LogoIA[] = [
  { nom: 'OpenAI', couleur: '#000000', fa: 'fa-openai' },
  { nom: 'Claude', couleur: '#D97757', svg: siClaude.path },
  { nom: 'Gemini', couleur: '#8E75B2', svg: siGooglegemini.path },
  { nom: 'Mistral', couleur: '#FA520F', svg: siMistralai.path },
  { nom: 'Perplexity', couleur: '#1FB8CD', svg: siPerplexity.path },
  { nom: 'DeepSeek', couleur: '#5786FE', svg: siDeepseek.path },
  { nom: 'Meta AI', couleur: '#9844FF', svg: siMetaai.path },
  { nom: 'Hugging Face', couleur: '#FFD21E', svg: siHuggingface.path },
  { nom: 'NVIDIA', couleur: '#76B900', svg: siNvidia.path },
  { nom: 'Ollama', couleur: '#E6E6E6', svg: siOllama.path },
  { nom: 'Anthropic', couleur: '#B8B8B8', svg: siAnthropic.path },
];

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
    icone: 'fa-lightbulb',
    titre: 'Réfléchir',
    texte:
      "Tout commence par une conversation. L'idée se clarifie, se découpe, se confronte — jusqu'à ce que le vrai projet apparaisse.",
    mots: ['Conversation', 'Clarification', 'Vision'],
    c1: '#A5E838',
    c2: '#43BC2C',
  },
  {
    num: '02',
    icone: 'fa-earth-africa',
    titre: 'Rechercher',
    texte:
      "Aura Explore interroge le web et ne renvoie que des réponses sourcées et traçables. La confiance naît de la preuve.",
    mots: ['Sourcé', 'Traçable', 'Web'],
    c1: '#EACB37',
    c2: '#F4E07A',
  },
  {
    num: '03',
    icone: 'fa-wand-magic-sparkles',
    titre: 'Créer',
    texte:
      "Du brief au projet structuré : designs, documents, code. Aura Studio construit, itère, versionne — sous vos yeux.",
    mots: ['Studio', 'Itération', 'Versions'],
    c1: '#FF790D',
    c2: '#E85D00',
  },
  {
    num: '04',
    icone: 'fa-rocket',
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
];

const DECLARATION =
  "Aura tient le fil : votre première phrase devient un plan, le plan devient une création, la création devient un résultat.";

const CREATIONS = [
  {
    titre: 'Boutique de téléphones — Cotonou',
    brief: 'Brief : e-commerce premium, prix en FCFA, mobile d’abord.',
    img: imgTelephones,
  },
  {
    titre: 'Studio photo — lumière douce',
    brief: 'Brief : portfolio éditorial, galerie immersive, contact direct.',
    img: imgPhoto,
  },
  {
    titre: 'Chef cuisinier — table du jour',
    brief: 'Brief : site vitrine gourmand, menu illustré, réservation.',
    img: imgChef,
  },
  {
    titre: 'Fintech — épargne mobile',
    brief: 'Brief : landing rassurante, parcours simple, chiffres clairs.',
    img: imgFintech,
  },
  {
    titre: 'Voyage — carnet du Bénin',
    brief: 'Brief : récit de voyage illustré, carte, carnet photo.',
    img: imgVoyage,
  },
  {
    titre: 'Festival — nuit d’ouverture',
    brief: 'Brief : page événementielle vibrante, programme, billetterie.',
    img: imgFestival,
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

const BandeauLogos: React.FC = () => (
  <div className="logos-ia" aria-label="L'écosystème IA mondial">
    <div className="logos-ia-piste">
      {[...LOGOS_IA, ...LOGOS_IA].map((logo, i) => (
        <span className="logo-ia" key={`${logo.nom}-${i}`}>
          {logo.svg ? (
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
              <path d={logo.svg} fill={logo.couleur} />
            </svg>
          ) : (
            <i
              className={`fa-brands ${logo.fa}`}
              style={{ color: logo.couleur, fontSize: '25px' }}
              aria-hidden
            />
          )}
          <span className="logo-ia-nom">{logo.nom}</span>
        </span>
      ))}
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const racine = useRef<HTMLDivElement | null>(null);
  const bandeauRef = useRef<HTMLDivElement | null>(null);
  const filRef = useRef<HTMLDivElement | null>(null);
  const declRef = useRef<HTMLDivElement | null>(null);
  const galerieRef = useRef<HTMLDivElement | null>(null);
  const tarifsReveal = useRevealAll<HTMLDivElement>();

  useGSAP(
    () => {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* ===== HERO : révélation hypnotique des textes ===== */
      if (!reduit) {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.to('.ligne-masquee > span', { y: 0, duration: 1.25, stagger: 0.13 }, 0.1)
          .from(
            '.hero-mot',
            {
              yPercent: 118,
              rotate: 4,
              opacity: 0,
              filter: 'blur(8px)',
              duration: 1.15,
              stagger: 0.09,
            },
            0.18,
          )
          .from(
            '[data-hero]',
            { opacity: 0, y: 32, duration: 1.05, stagger: 0.12 },
            0.55,
          )
          .from(
            '.hero-lueur',
            { scale: 0.6, opacity: 0, duration: 1.7, ease: 'power2.out' },
            0,
          );
      } else {
        gsap.set('.ligne-masquee > span', { y: 0 });
        gsap.set('.hero-mot, [data-hero]', { opacity: 1, y: 0 });
        gsap.set('.declaration-texte .mot', { opacity: 1 });
      }

      /* ===== HERO : chorégraphies par viewport (gsap.matchMedia) ===== */
      const mm = gsap.matchMedia();

      mm.add(
        '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.utils.toArray<HTMLElement>('.hero-mot').forEach((mot, i) => {
            gsap.to(mot, {
              yPercent: i % 2 ? -22 : -40,
              rotate: i % 2 ? -1.6 : 1.2,
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
            yPercent: -14,
            scale: 1.12,
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
              xPercent: i ? -10 : 10,
              rotate: i ? -4 : 4,
              ease: 'none',
              scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            });
          });
        },
      );

      mm.add(
        '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.utils.toArray<HTMLElement>('.hero-mot').forEach((mot, i) => {
            gsap.to(mot, {
              yPercent: i % 2 ? -7 : -13,
              ease: 'none',
              scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            });
          });
        },
      );

      /* ===== BANDEAU MOTS : défilement soie ===== */
      const ruban = bandeauRef.current?.querySelector<HTMLElement>('.bandeau-ruban');
      if (ruban) {
        gsap.to(ruban, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
      }

      /* ===== LE FIL : ruban dessiné + étapes glissantes ===== */
      const chemins = filRef.current?.querySelectorAll<SVGPathElement>('[data-fil-chemin]');
      chemins?.forEach((chemin) => {
        const longueur = chemin.getTotalLength();
        gsap.set(chemin, { strokeDasharray: longueur, strokeDashoffset: longueur });
        gsap.to(chemin, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: filRef.current,
            start: 'top 70%',
            end: 'bottom 74%',
            scrub: 0.8,
          },
        });
      });
      gsap.utils.toArray<HTMLElement>('.etape').forEach((etape) => {
        gsap.from(etape.querySelector('.etape-texte'), {
          y: 54,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: etape, start: 'top 80%' },
        });
        gsap.from(etape.querySelector('.etape-visuel'), {
          y: 38,
          rotate: -2,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: etape, start: 'top 80%' },
        });
      });

      /* ===== DÉCLARATION : mots accrochés au scroll ===== */
      const decl = declRef.current?.querySelector<HTMLElement>('.declaration-texte');
      if (decl) {
        gsap.to(decl.querySelectorAll('.mot'), {
          opacity: 1,
          y: 0,
          stagger: 0.07,
          ease: 'none',
          scrollTrigger: {
            trigger: declRef.current,
            start: 'top 76%',
            end: 'center 42%',
            scrub: 0.6,
          },
        });
      }

      /* ===== CAPACITÉS ===== */
      gsap.utils.toArray<HTMLElement>('.capacite').forEach((ligne) => {
        gsap.from(ligne, {
          y: 38,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: ligne, start: 'top 88%' },
        });
      });

      /* ===== GALERIE : piste horizontale épinglée (desktop) ===== */
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

      /* ===== TARIFS : la vedette s'ouvre en lumière ===== */
      gsap.from('.plan-vedette', {
        y: 52,
        scale: 0.95,
        opacity: 0,
        duration: 1.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tarifs-grille', start: 'top 80%' },
      });
    },
    { scope: racine },
  );

  return (
    <div ref={racine}>
      <SiteNav />

      {/* ================= HERO ================= */}
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
                <i className="fa-solid fa-bolt" aria-hidden />
                <span>Commencer l'expérience</span>
              </Link>
              <a href="#galerie" className="btn btn-ligne">
                <i className="fa-solid fa-images" aria-hidden />
                <span>Voir la galerie</span>
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

      {/* ===== LOGOS IA (juste après le hero) ===== */}
      <BandeauLogos />

      {/* ===== BANDEAU MOTS ===== */}
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
                  <h3 className="display-lg">
                    <i className={`fa-solid ${e.icone} etape-icone`} aria-hidden />{' '}
                    {e.titre}
                  </h3>
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

      {/* ================= DÉCLARATION ================= */}
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
                  <i className={`fa-solid ${c.icone} capacite-icone`} aria-hidden />
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
                <div className="carte-apercu">
                  <div className="apercu-barre" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </div>
                  <img src={c.img} alt={`Rendu de démonstration — ${c.titre}`} loading="lazy" />
                </div>
                <div className="carte-meta">
                  <h3>{c.titre}</h3>
                  <span className="carte-demo">
                    <i className="fa-solid fa-flask" aria-hidden /> Démonstration
                  </span>
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
                    <li key={f}>
                      <i className="fa-solid fa-check" aria-hidden /> {f}
                    </li>
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
              <Link to="/documentation" className="btn btn-ligne">
                <i className="fa-solid fa-book-open" aria-hidden />
                <span>Lire la documentation</span>
              </Link>
            </div>
            <p className="cta-note">
              Fonctionnement annoncé à l'état réel uniquement — aucune
              fonctionnalité simulée.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
