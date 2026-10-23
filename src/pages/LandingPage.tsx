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
import { Tilt } from '../components/motion/Tilt';
import { MagicEye } from '../components/motion/MagicEye';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { useT } from '../app/prefs';

import imgTelephones from '../assets/galerie/boutique-telephones.jpg';
import imgPhoto from '../assets/galerie/studio-photo.jpg';
import imgChef from '../assets/galerie/chef-cuisinier.jpg';
import imgFintech from '../assets/galerie/fintech-epargne.jpg';
import imgVoyage from '../assets/galerie/voyage-benin.jpg';
import imgFestival from '../assets/galerie/festival-nuit.jpg';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const IMAGES_GALERIE = [imgTelephones, imgPhoto, imgChef, imgFintech, imgVoyage, imgFestival];

const COULEURS_MOTIF: [string, string][] = [
  ['#A5E838', '#43BC2C'],
  ['#EACB37', '#F4E07A'],
  ['#FF790D', '#E85D00'],
  ['#43BC2C', '#FF790D'],
];

type LogoIA = { nom: string; couleur: string; svg?: string; fa?: string };

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

const BandeauLogos: React.FC<{ label: string }> = ({ label }) => (
  <div className="logos-ia" aria-label={label}>
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
  const t = useT();
  const racine = useRef<HTMLDivElement | null>(null);
  const bandeauRef = useRef<HTMLDivElement | null>(null);
  const filRef = useRef<HTMLDivElement | null>(null);
  const declRef = useRef<HTMLDivElement | null>(null);
  const galerieRef = useRef<HTMLDivElement | null>(null);
  const stGalerie = useRef<ScrollTrigger | null>(null);
  const tarifsReveal = useRevealAll<HTMLDivElement>();

  useGSAP(
    () => {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* ===== HERO : révélation des mots dans des masques fixes
             (pas de blur sur les textes en dégradé — bug de rendu) ===== */
      if (!reduit) {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from('.hero-mot', { yPercent: 115, opacity: 0, duration: 1.15, stagger: 0.09 }, 0.12)
          .from('[data-hero]', { opacity: 0, y: 32, duration: 1.05, stagger: 0.12 }, 0.5)
          .from('.hero-lueur', { scale: 0.6, opacity: 0, duration: 1.7, ease: 'power2.out' }, 0);
      } else {
        gsap.set('.hero-mot, [data-hero]', { opacity: 1, y: 0 });
        gsap.set('.declaration-texte .mot', { opacity: 1 });
      }

      /* ===== HERO : parallaxe par LIGNE masquée (aucun rognage) ===== */
      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.ligne-masquee').forEach((ligne, i) => {
          gsap.to(ligne, {
            yPercent: i % 2 ? -8 : -15,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
          });
        });
        gsap.to('.hero-scene', {
          yPercent: -14,
          scale: 1.12,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.utils.toArray<SVGElement>('.hero-traits svg').forEach((svg, i) => {
          gsap.to(svg, {
            xPercent: i ? -10 : 10,
            rotate: i ? -4 : 4,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
          });
        });
      });

      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.ligne-masquee').forEach((ligne, i) => {
          gsap.to(ligne, {
            yPercent: i % 2 ? -4 : -7,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
          });
        });
      });

      /* ===== BANDEAU MOTS ===== */
      const ruban = bandeauRef.current?.querySelector<HTMLElement>('.bandeau-ruban');
      if (ruban) {
        gsap.to(ruban, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
      }

      /* ===== LE FIL : ruban dessiné, goutte de lumière, nœuds qui s'allument ===== */
      const chemins = filRef.current?.querySelectorAll<SVGPathElement>('[data-fil-chemin]');
      const listeChemins = chemins ? Array.from(chemins) : [];
      const refChemin = listeChemins[0] ?? null;
      const noeuds = filRef.current?.querySelectorAll<SVGGElement>('[data-fil-noeud]');
      const goutte = filRef.current?.querySelector<SVGCircleElement>('[data-fil-goutte]');
      const noyau = filRef.current?.querySelector<SVGCircleElement>('[data-fil-goutte-noyau]');

      if (refChemin && noeuds?.length) {
        const longueur = refChemin.getTotalLength();

        // Place les nœuds sur le tracé (quartiles du ruban)
        const seuils: number[] = [];
        noeuds.forEach((noeud, i) => {
          const s = (i + 0.5) / noeuds.length;
          seuils.push(s - 0.06);
          const p = refChemin.getPointAtLength(s * longueur);
          noeud.setAttribute('transform', `translate(${p.x}, ${p.y})`);
        });

        const placerGoutte = (prog: number) => {
          const p = refChemin.getPointAtLength(prog * longueur);
          goutte?.setAttribute('transform', `translate(${p.x}, ${p.y})`);
          noyau?.setAttribute('transform', `translate(${p.x}, ${p.y})`);
          noeuds.forEach((noeud, i) => {
            noeud.classList.toggle('actif', prog >= seuils[i]);
          });
        };

        if (reduit) {
          listeChemins.forEach((c) => gsap.set(c, { strokeDashoffset: 0, strokeDasharray: 'none' }));
          placerGoutte(1);
        } else {
          listeChemins.forEach((chemin) => {
            const l = chemin.getTotalLength();
            gsap.set(chemin, { strokeDasharray: l, strokeDashoffset: l });
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

          ScrollTrigger.create({
            trigger: filRef.current,
            start: 'top 70%',
            end: 'bottom 74%',
            scrub: 0.8,
            onUpdate: (self) => placerGoutte(self.progress),
          });
        }

        // Étapes : glissement doux à l'arrivée
        if (!reduit) {
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
        }
      }

      /* ===== DÉCLARATION ===== */
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
      if (!reduit) {
        gsap.utils.toArray<HTMLElement>('.capacite').forEach((ligne) => {
          gsap.from(ligne, {
            y: 38,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: ligne, start: 'top 88%' },
          });
        });
      }

      /* ===== GALERIE : piste épinglée + carte active en perspective ===== */
      const piste = galerieRef.current?.querySelector<HTMLElement>('.galerie-piste');
      const track = galerieRef.current?.querySelector<HTMLElement>('.galerie-track');

      const majCarteActive = () => {
        const cartes = galerieRef.current?.querySelectorAll<HTMLElement>('.galerie-carte');
        if (!cartes?.length) return;
        const centre = window.innerWidth / 2;
        let meilleur = 0;
        let distMin = Infinity;
        cartes.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - centre);
          if (d < distMin) {
            distMin = d;
            meilleur = i;
          }
        });
        cartes.forEach((c, i) => c.classList.toggle('carte-active', i === meilleur));
      };

      if (piste && track) {
        majCarteActive();
        piste.addEventListener('scroll', majCarteActive, { passive: true });

        // Clavier : flèches gauche/droite entre les cartes
        const onClavier = (e: KeyboardEvent) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const cartes = Array.from(track.querySelectorAll<HTMLElement>('.galerie-carte'));
          const idx = cartes.indexOf(document.activeElement as HTMLElement);
          if (idx === -1) return;
          e.preventDefault();
          const suivant = Math.max(0, Math.min(cartes.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)));
          cartes[suivant].focus();
          const st = stGalerie.current;
          if (st) {
            st.scroll(st.start + ((suivant + 0.5) / cartes.length) * (st.end - st.start));
          }
        };
        piste.addEventListener('keydown', onClavier);

        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
          const distance = () => Math.max(0, track.scrollWidth - piste.clientWidth + 48);
          const tween = gsap.to(track, {
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
              onUpdate: majCarteActive,
            },
          });
          stGalerie.current = (tween as unknown as { scrollTrigger?: ScrollTrigger }).scrollTrigger ?? null;
          return () => {
            stGalerie.current = null;
          };
        });

        return () => {
          piste.removeEventListener('scroll', majCarteActive);
          piste.removeEventListener('keydown', onClavier);
        };
      }

      /* ===== TARIFS : la vedette s'ouvre en lumière ===== */
      if (!reduit) {
        gsap.from('.plan-vedette', {
          y: 52,
          scale: 0.95,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.tarifs-grille', start: 'top 80%' },
        });
      }
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
              {t.hero.kicker}
            </span>
            <h1 className="display-xxl">
              <span className="ligne-masquee">
                <span>
                  <span className="hero-mot">{t.hero.ligne1}</span>
                </span>
              </span>
              <span className="ligne-masquee">
                <span>
                  <span className="hero-mot">{t.hero.ligne2avant}</span>{' '}
                  <span className="hero-mot italique-vif">{t.hero.ligne2italique}.</span>
                </span>
              </span>
            </h1>
            <p className="sous-titre" data-hero>
              {t.hero.sous}
            </p>
            <div className="hero-actions" data-hero>
              <Link to="/register" className="btn btn-ruban">
                <i className="fa-solid fa-bolt" aria-hidden />
                <span>{t.hero.cta1}</span>
              </Link>
              <a href="#galerie" className="btn btn-ligne">
                <i className="fa-solid fa-images" aria-hidden />
                <span>{t.hero.cta2}</span>
              </a>
            </div>
            <div className="hero-energie" data-hero>
              <span className="hero-energie-points" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {t.hero.energie}
            </div>
          </div>

          <div className="hero-scene" data-hero>
            <AuraSculptureCanvas />
            <div className="scene-halo" aria-hidden />
            <figure className="scene-cadre">
              <img src="/assets/aura-symbol-white.jpg" alt={t.hero.legende} />
            </figure>
            <figcaption className="scene-legende">{t.hero.legende}</figcaption>
          </div>
        </div>

        <div className="scroll-indices" aria-hidden>
          <span className="trait" />
          {t.hero.scroll}
        </div>
      </header>

      {/* ===== LOGOS IA ===== */}
      <BandeauLogos label={t.logos.label} />

      {/* ===== BANDEAU MOTS ===== */}
      <div ref={bandeauRef} className="bandeau" aria-hidden>
        <div className="bandeau-ruban">
          {[...t.bandeau.mots, ...t.bandeau.mots, ...t.bandeau.mots, ...t.bandeau.mots].map(
            (mot, i) => (
              <span className="bandeau-mot" key={i}>
                <i /> {mot}
              </span>
            ),
          )}
        </div>
      </div>

      {/* ================= LE FIL (ruban narratif) ================= */}
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
          {[0, 1, 2, 3].map((i) => (
            <g className="fil-noeud" data-fil-noeud={i} key={i}>
              <circle className="fil-noeud-halo" r="30" fill="url(#fil-grad)" />
              <circle r="11" fill="#FFFDF8" stroke="url(#fil-grad)" strokeWidth="4" />
            </g>
          ))}
          <circle data-fil-goutte r="10" fill="#FF790D" opacity="0.85" />
          <circle data-fil-goutte-noyau r="4" fill="#FFFDF8" />
        </svg>

        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              {t.fil.kicker}
            </span>
            <h2 className="display-xl" data-reveal>
              {t.fil.titre1} <em className="italique-vif">{t.fil.titre2}</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              {t.fil.sous}
            </p>
          </div>

          <div className="fil-etapes">
            {t.fil.etapes.map((e, i) => (
              <article className="etape" key={e.num}>
                <div className="etape-texte">
                  <div className="etape-num" aria-hidden>
                    {e.num}
                  </div>
                  <h3 className="display-lg">
                    <i className={`fa-solid ${e.icone} etape-icone`} aria-hidden /> {e.titre}
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
                      opacity="0.55"
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
                        <stop stopColor={COULEURS_MOTIF[i][0]} />
                        <stop offset="1" stopColor={COULEURS_MOTIF[i][1]} />
                      </linearGradient>
                    </defs>
                  </svg>
                  {i === 1 && (
                    <MagicEye className="etape-oeil" label={e.titre} />
                  )}
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
            {t.decl.texte.split(' ').map((mot, i) => (
              <React.Fragment key={i}>
                <span className="mot">{mot}</span>{' '}
              </React.Fragment>
            ))}
          </p>
          <span className="kicker declaration-signature">{t.decl.signature}</span>
        </div>
      </section>

      {/* ================= CAPACITÉS ================= */}
      <section id="capacites" className="section capacites">
        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              {t.capacites.kicker}
            </span>
            <h2 className="display-xl" data-reveal>
              {t.capacites.titre1} <em className="italique-vif">{t.capacites.titre2}</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              {t.capacites.sous}
            </p>
          </div>

          <div className="capacite-liste">
            {t.capacites.lignes.map((c) => (
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
              {t.galerie.kicker}
            </span>
            <h2 className="display-xl" data-reveal style={{ color: '#FFFDF8' }}>
              {t.galerie.titre1} <em className="italique-vif">{t.galerie.titre2}</em>.
            </h2>
          </div>
          <p data-reveal>{t.galerie.sous}</p>
        </div>

        <div className="galerie-piste" aria-label={t.galerie.kicker}>
          <div className="galerie-track">
            {t.galerie.creations.map((c, i) => (
              <Tilt
                className="galerie-carte"
                key={c.titre}
                tabIndex={0}
                role="group"
                aria-label={c.titre}
              >
                <div className="carte-scene">
                  <div className="apercu-pile" aria-hidden>
                    <span className="apercu-volet volet-1" />
                    <span className="apercu-volet volet-2" />
                  </div>
                  <div className="carte-apercu">
                    <div className="apercu-barre" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </div>
                    <img src={IMAGES_GALERIE[i]} alt={`${t.galerie.badge} — ${c.titre}`} loading="lazy" />
                  </div>
                </div>
                <div className="carte-meta">
                  <h3>{c.titre}</h3>
                  <span className="carte-demo">
                    <i className="fa-solid fa-flask" aria-hidden /> {t.galerie.badge}
                  </span>
                </div>
                <p className="carte-brief">{c.brief}</p>
              </Tilt>
            ))}
          </div>
        </div>

        <p className="galerie-note">{t.galerie.note}</p>
      </section>

      {/* ================= TARIFS ================= */}
      <section id="tarifs" className="section">
        <div className="wrap">
          <div className="fil-en-tete">
            <span className="kicker" data-reveal>
              {t.tarifs.kicker}
            </span>
            <h2 className="display-xl" data-reveal>
              {t.tarifs.titre1} <em className="italique-vif">{t.tarifs.titre2}</em>.
            </h2>
            <p className="sous-titre" data-reveal>
              {t.tarifs.sous}
            </p>
          </div>

          <div className="tarifs-grille" ref={tarifsReveal}>
            {t.tarifs.plans.map((p) => (
              <Tilt
                className={`plan${p.vedette ? ' plan-vedette' : ''}`}
                key={p.nom}
                {...(p.vedette ? {} : { 'data-reveal': '' })}
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
                <Link to="/register" className={`btn ${p.vedette ? 'btn-ruban' : 'btn-ligne'}`}>
                  <span>{p.cta}</span>
                </Link>
              </Tilt>
            ))}
          </div>

          <p className="tarifs-note">{t.tarifs.note}</p>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section cta">
        <div className="wrap">
          <div className="cta-panneau" data-reveal>
            <div className="cta-halo" aria-hidden />
            <span className="kicker" style={{ justifyContent: 'center' }}>
              {t.cta.kicker}
            </span>
            <h2 className="display-xl">
              {t.cta.titre1} <em className="italique-vif">{t.cta.titre2}</em>.
            </h2>
            <p className="sous-titre" style={{ marginInline: 'auto' }}>
              {t.cta.sous}
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-encre">
                <span>{t.cta.b1}</span>
              </Link>
              <Link to="/documentation" className="btn btn-ligne">
                <i className="fa-solid fa-book-open" aria-hidden />
                <span>{t.cta.b2}</span>
              </Link>
            </div>
            <p className="cta-note">{t.cta.note}</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
