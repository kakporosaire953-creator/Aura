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
  },
  {
    num: '02',
    titre: 'Rechercher',
    texte:
      "Aura Explore interroge le web et ne renvoie que des réponses sourcées et traçables. La confiance naît de la preuve.",
    mots: ['Sourcé', 'Traçable', 'Web'],
  },
  {
    num: '03',
    titre: 'Créer',
    texte:
      "Du brief au projet structuré : designs, documents, code. Aura Studio construit, itère, versionne — sous vos yeux.",
    mots: ['Studio', 'Itération', 'Versions'],
  },
  {
    num: '04',
    titre: 'Développer',
    texte:
      "Le résultat se livre : code exécutable, exports propres, mission close. De l'idée au résultat, sans rupture de fil.",
    mots: ['Exécution', 'Livrable', 'Résultat'],
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

export const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const bandeauRef = useRef<HTMLDivElement | null>(null);
  const filRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const revealRef = useRevealAll<HTMLDivElement>();

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
        return;
      }

      // Hero : titres en cascade, soie
      gsap.to('.ligne-masquee > span', {
        y: 0,
        duration: 1.25,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.15,
      });
      gsap.from('[data-hero]', {
        opacity: 0,
        y: 34,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.13,
        delay: 0.45,
      });

      // Bandeau kinétique
      const ruban = bandeauRef.current?.querySelector<HTMLElement>('.bandeau-ruban');
      if (ruban) {
        gsap.to(ruban, {
          xPercent: -50,
          duration: 26,
          ease: 'none',
          repeat: -1,
        });
      }

      // Le fil : le ruban SVG se dessine au scroll
      const chemin = filRef.current?.querySelector<SVGPathElement>('[data-fil-chemin]');
      if (chemin) {
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
      }

      // Légères parallaxes sur les visuels d'étapes
      gsap.utils.toArray<HTMLElement>('.etape-visuel').forEach((visuel, i) => {
        gsap.fromTo(
          visuel,
          { y: i % 2 ? 36 : 20 },
          {
            y: i % 2 ? -22 : -12,
            ease: 'none',
            scrollTrigger: { trigger: visuel, start: 'top bottom', end: 'bottom top', scrub: 1 },
          },
        );
      });
    },
    { scope: heroRef },
  );

  return (
    <div ref={heroRef}>
      {/* ================= NAV ================= */}
      <nav ref={navRef} className="nav" aria-label="Navigation principale">
        <div className="wrap nav-interieur">
          <Link to="/" aria-label="AURA — accueil">
            <AuraLogo taille="sm" />
          </Link>
          <ul className="nav-liens">
            <li>
              <a href="#fil">Le fil</a>
            </li>
            <li>
              <a href="#capacites">Capacités</a>
            </li>
            <li>
              <a href="#sculpture">La sculpture</a>
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

      {/* ================= HERO ================= */}
      <header className="hero">
        <div className="hero-lueur" aria-hidden />
        <div className="wrap hero-grille">
          <div className="hero-texte">
            <span className="kicker" data-hero>
              Plateforme d'intelligence artificielle
            </span>
            <h1 className="display-xxl">
              <span className="ligne-masquee">
                <span>
                  De l'idée au <em className="italique-vif">résultat</em>.
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
              <a href="#fil" className="btn btn-ligne">
                Suivre le fil
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
              <img src="/assets/aura-symbol-white.jpg" alt="La sculpture AURA : trois rubans verts, dorés et orange tissés en flamme" />
            </figure>
            <figcaption className="scene-legende">
              La sculpture vivante d'Aura
            </figcaption>
          </div>
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
        <svg className="fil-ruban-svg" viewBox="0 0 680 1600" fill="none" preserveAspectRatio="none" aria-hidden>
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
              Un seul fil,{' '}
              <em className="italique-vif">quatre gestes</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              Là où d'autres empilent des outils, Aura tient une seule ligne — de
              la première phrase au résultat final.
            </p>
          </div>

          <div className="fil-etapes">
            {ETAPES.map((e) => (
              <article className="etape" key={e.num}>
                <div className="etape-texte" data-reveal>
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
                <div className="etape-visuel" data-reveal="tourne">
                  <svg className="etape-motif" viewBox="0 0 480 320" fill="none" preserveAspectRatio="xMidYMid slice">
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
                      <linearGradient id={`motif-${e.num}`} x1="0" y1="320" x2="480" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor={e.num === '01' ? '#A5E838' : e.num === '02' ? '#EACB37' : e.num === '03' ? '#FF790D' : '#43BC2C'} />
                        <stop offset="1" stopColor={e.num === '01' ? '#43BC2C' : e.num === '02' ? '#F4E07A' : e.num === '03' ? '#E85D00' : '#FF790D'} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </article>
            ))}
          </div>
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

          <div className="capacite-liste" ref={revealRef}>
            {CAPACITES.map((c) => (
              <div className="capacite" key={c.idx} data-reveal>
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

      {/* ================= SCULPTURE ================= */}
      <section id="sculpture" className="section sculpture">
        <div className="wrap sculpture-grille">
          <div className="sculpture-texte">
            <span className="kicker" data-reveal>
              L'identité
            </span>
            <h2 className="display-xl" data-reveal>
              Une seule lumière.{' '}
              <em className="italique-vif">Trois énergies.</em>
            </h2>
            <p data-reveal>
              Le logo d'Aura n'est pas un ornement : c'est une sculpture de trois
              rubans qui n'en font qu'un. Chaque courbe porte une promesse.
            </p>
            <div className="energies">
              <div className="energie" data-reveal>
                <span className="energie-tiret" aria-hidden />
                <div>
                  <strong>Le vert — l'idée qui pousse</strong>
                  <span>
                    La croissance, la recherche, le vivant. Tout commence par une
                    graine de pensée.
                  </span>
                </div>
              </div>
              <div className="energie" data-reveal>
                <span className="energie-tiret" aria-hidden />
                <div>
                  <strong>L'or — la valeur qui se construit</strong>
                  <span>
                    Le soin, la qualité, la fierté du travail bien fait. La valeur
                    se tisse patiemment.
                  </span>
                </div>
              </div>
              <div className="energie" data-reveal>
                <span className="energie-tiret" aria-hidden />
                <div>
                  <strong>L'orange — l'énergie qui livre</strong>
                  <span>
                    Le mouvement, l'exécution, le résultat. La flamme qui pousse
                    l'idée jusqu'au bout.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sculpture-figure" data-reveal>
            <img src="/assets/aura-symbol-white.jpg" alt="Le logo AURA présenté comme une sculpture de rubans" />
          </div>
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
              <a href="#fil" className="btn btn-ligne">
                Relire le fil
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
                <a href="#fil">Le fil</a>
              </li>
              <li>
                <a href="#capacites">Capacités</a>
              </li>
              <li>
                <a href="#sculpture">La sculpture</a>
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
