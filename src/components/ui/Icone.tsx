/**
 * Jeu d'icônes d'AURA — dessiné pour le produit, pas emprunté.
 *
 * Principes (identité « Rubans & sculpture ») :
 *  - grille 24×24, tracé unique de 1,75 px, terminaisons rondes ;
 *  - aucune icône « baguette magique » : le Studio est une plume de ruban ;
 *  - la couleur vient du texte (currentColor) : une seule teinte par contexte ;
 *  - taille en `em` par défaut pour s'aligner sur la typographie.
 *
 * Le nom peut être sémantique (« studio ») ou hérité de l'ancien jeu
 * (« fa-wand-magic-sparkles ») : la table d'alias évite toute régression.
 */
import React from 'react';

const T = 1.75; // épaisseur du trait

/** Enveloppe commune : mêmes réglages de trait pour toutes les icônes. */
const Svg: React.FC<{
  children: React.ReactNode;
  className?: string;
  taille?: number | string;
  rempli?: boolean;
}> = ({ children, className, taille = '1em', rempli }) => (
  <svg
    className={`icone${className ? ' ' + className : ''}`}
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    fill={rempli ? 'currentColor' : 'none'}
    stroke={rempli ? 'none' : 'currentColor'}
    strokeWidth={rempli ? 0 : T}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

/* ── Primitives ── */
const p = (d: string) => <path d={d} />;
const c = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} />;
const l = (x1: number, y1: number, x2: number, y2: number) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} />
);
const rect = (x: number, y: number, w: number, h: number, r = 0) => (
  <rect x={x} y={y} width={w} height={h} rx={r} />
);

/**
 * Dessins. Chaque entrée renvoie les éléments SVG de l'icône.
 * Ils partagent la même grille pour rester alignés entre eux.
 */
const DESSINS: Record<string, React.ReactNode> = {
  /* ── Marque / produit ── */
  // Studio : un ruban qui se déplie en plume (remplace la baguette magique).
  studio: (
    <>
      {p('M3 19.5c5.6.8 9.4-2.2 11.4-7.2')}
      {p('M15.8 3.6l4.6 4.6-4.4 4.4-4.6-4.6z')}
      {p('M13 15.5l-2 .6.6-2')}
    </>
  ),
  // Création visuelle : cadre + ruban.
  creation: (
    <>
      <rect x="3.5" y="4.5" width="17" height="13" rx="2.5" />
      {p('M7 14c2.4-3.2 4.6-3.2 7 0')}
      {c(9, 8.6, 1.1)}
    </>
  ),

  /* ── Navigation / actions ── */
  plus: <>{l(12, 5, 12, 19)}{l(5, 12, 19, 12)}</>,
  minus: <>{l(5, 12, 19, 12)}</>,
  xmark: <>{p('M6 6l12 12')}{p('M18 6L6 18')}</>,
  check: <>{p('M4.5 12.6l4.7 4.7L19.8 6.6')}</>,
  'chevron-right': <>{p('M9.5 5.5L16 12l-6.5 6.5')}</>,
  'chevron-down': <>{p('M5.5 9.5L12 16l6.5-6.5')}</>,
  'chevron-left': <>{p('M14.5 5.5L8 12l6.5 6.5')}</>,
  'arrow-right': <>{l(4, 12, 19, 12)}{p('M13 6l6 6-6 6')}</>,
  'arrow-left': <>{l(20, 12, 5, 12)}{p('M11 6l-6 6 6 6')}</>,
  'arrow-up-right': <>{p('M6.5 17.5L17.5 6.5')}{p('M9.5 6.5h8v8')}</>,
  'arrow-right-from-bracket': (
    <>{p('M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4')}{p('M10.5 8.5L14.5 12l-4 3.5')}{l(14.5, 12, 4, 12)}</>
  ),
  'arrow-right-to-bracket': (
    <>{p('M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4')}{p('M13.5 8.5L17.5 12l-4 3.5')}{l(17.5, 12, 8, 12)}</>
  ),
  trash: (
    <>{l(4, 7, 20, 7)}{p('M9.5 7V5.4c0-.5.4-.9.9-.9h3.2c.5 0 .9.4.9.9V7')}{p('M6.5 7l.9 12.1c.05.8.7 1.4 1.5 1.4h6.2c.8 0 1.45-.6 1.5-1.4L17.5 7')}{l(10.5, 11, 10.5, 16.5)}{l(13.5, 11, 13.5, 16.5)}</>
  ),
  pen: <>{p('M4 20l.9-4.1L15.2 5.6a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.1 19.1z')}{p('M13.6 7.2l3.2 3.2')}</>,
  copy: (
    <>{rect(9, 9, 11, 11, 2.2)}{p('M15.5 6.5V5.2A1.2 1.2 0 0 0 14.3 4H5.2A1.2 1.2 0 0 0 4 5.2v9.1a1.2 1.2 0 0 0 1.2 1.2h1.3')}</>
  ),
  link: (
    <>{p('M10.5 13.5a3.6 3.6 0 0 0 5.1 0l2.4-2.4a3.6 3.6 0 0 0-5.1-5.1L11.6 7.3')}{p('M13.5 10.5a3.6 3.6 0 0 0-5.1 0L6 12.9a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3')}</>
  ),
  download: <>{p('M12 4v10.5')}{p('M8 11l4 4 4-4')}{p('M4.5 17.5v1A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-1')}</>,
  print: (
    <>{p('M7 8.5V4.5h10v4')}{rect(4, 8.5, 16, 7, 1.8)}{p('M7 15.5h10v4H7z')}{c(17, 11.2, 0.7)}</>
  ),
  'paper-plane': <>{p('M20.5 3.5L3.5 10.4l7 2.4 2.4 7z')}{p('M10.5 12.8l4-4')}</>,
  rotate: <>{p('M19.6 12a7.6 7.6 0 1 1-2.2-5.3')}{p('M20 4.4v4.2h-4.2')}</>,
  'circle-notch': <>{p('M12 3.2a8.8 8.8 0 1 0 8.8 8.8')}</>,
  spinner: (
    <>
      {p('M12 3.2a8.8 8.8 0 0 1 8.8 8.8')}
      {p('M20.8 12a8.8 8.8 0 0 1-8.8 8.8')}
    </>
  ),
  eraser: <>{p('M8.6 19.5H19')}{p('M15.6 4.9l3.6 3.6a1.4 1.4 0 0 1 0 2L11.6 18H7.9l-3.5-3.5a1.4 1.4 0 0 1 0-2L12 5a1.4 1.4 0 0 1 1.9 0z')}{p('M9 9.5l6 6')}</>,
  'floppy-disk': (
    <>{p('M5 3.5h10.5L20.5 8v11.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z')}{p('M8 3.5v5h7v-5')}{p('M8 20.5v-6h8v6')}</>
  ),
  send: <>{p('M20.5 3.5L3.5 10.4l7 2.4 2.4 7z')}{p('M10.5 12.8l4-4')}</>,

  /* ── Recherche / information ── */
  'magnifying-glass': <>{c(10.6, 10.6, 6.6)}{p('M15.6 15.6L20.5 20.5')}</>,
  'magnifying-glass-chart': (
    <>{c(10.6, 10.6, 6.6)}{p('M15.6 15.6L20.5 20.5')}{l(8.4, 12.6, 8.4, 10.4)}{l(10.8, 12.6, 10.8, 8.4)}{l(13.2, 12.6, 13.2, 11)}</>
  ),
  'circle-info': <>{c(12, 12, 8.8)}{l(12, 11, 12, 16.2)}{c(12, 8.2, 0.9)}</>,
  'circle-exclamation': <>{c(12, 12, 8.8)}{l(12, 7.8, 12, 13)}{c(12, 16, 0.9)}</>,
  'triangle-exclamation': <>{p('M12 3.8l8.6 15.2H3.4z')}{l(12, 9.6, 12, 14)}{c(12, 16.7, 0.85)}</>,
  list: <>{c(5.5, 7, 0.9)}{c(5.5, 12, 0.9)}{c(5.5, 17, 0.9)}{l(9, 7, 19, 7)}{l(9, 12, 19, 12)}{l(9, 17, 19, 17)}</>,
  'list-check': (
    <>{p('M4.5 7.5l1.6 1.6 3-3.2')}{p('M4.5 12.5l1.6 1.6 3-3.2')}{p('M4.5 17.5l1.6 1.6 3-3.2')}{l(13, 7.4, 20, 7.4)}{l(13, 12.4, 20, 12.4)}{l(13, 17.4, 20, 17.4)}</>
  ),
  'bars-progress': <>{p('M4.5 19.5V14')}{p('M10.5 19.5V9.5')}{p('M16.5 19.5V4.8')}{l(3, 19.5, 21, 19.5)}</>,
  'chart-column': <>{p('M4 20V4.5')}{l(4, 20, 20.5, 20)}{p('M8.5 20v-6.5')}{p('M13 20v-10')}{p('M17.5 20V8')}</>,
  newspaper: (
    <>{p('M4 5.5h12.5v13a1.5 1.5 0 0 0 1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5z')}{p('M16.5 9.5h2A1.5 1.5 0 0 1 20 11v6a1.5 1.5 0 0 1-1.5 1.5')}{l(7, 9, 13.5, 9)}{l(7, 12.5, 13.5, 12.5)}{l(7, 16, 11, 16)}</>
  ),
  'book-open': (
    <>{p('M12 7.2C10.4 5.8 8.3 5.2 5.6 5.3c-.6 0-1.1.5-1.1 1.1v10.3c0 .6.5 1.1 1.1 1.2 2.5.1 4.6.7 6.4 2 1.8-1.3 3.9-1.9 6.4-2 .6 0 1.1-.6 1.1-1.2V6.4c0-.6-.5-1.1-1.1-1.1-2.7-.1-4.8.5-6.4 1.9z')}{p('M12 7.2v13')}</>
  ),
  brain: (
    <>{p('M12 4.6c-2 0-3.4 1.5-3.4 3.3-1.7.4-2.9 1.9-2.9 3.7 0 1.6.9 3 2.3 3.6v1.9c0 1.2 1 2.2 2.2 2.2h.9c.5 0 .9-.4.9-.9V4.6z')}{p('M12 4.6c2 0 3.4 1.5 3.4 3.3 1.7.4 2.9 1.9 2.9 3.7 0 1.6-.9 3-2.3 3.6v1.9c0 1.2-1 2.2-2.2 2.2h-.9c-.5 0-.9-.4-.9-.9')}</>
  ),
  lightbulb: (
    <>{p('M9.2 15.4a5.6 5.6 0 1 1 5.6 0v2.1H9.2z')}{l(9.6, 20.4, 14.4, 20.4)}{l(10.4, 17.5, 13.6, 17.5)}</>
  ),
  compass: <>{c(12, 12, 8.8)}{p('M15.4 8.6l-2 4.6-4.6 2 2-4.6z')}</>,
  linkExterne: <>{p('M14 4.5h5.5V10')}{p('M19.5 4.5l-7.6 7.6')}{p('M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10')}</>,

  /* ── Travail / organisation ── */
  'diagram-project': (
    <>
      <rect x="9" y="3.5" width="6" height="5" rx="1.2" />
      <rect x="3" y="15.5" width="6" height="5" rx="1.2" />
      <rect x="15" y="15.5" width="6" height="5" rx="1.2" />
      {p('M12 8.5v3.5')}
      {p('M6 15.5V12h12v3.5')}
    </>
  ),
  sitemap: (
    <>
      <rect x="9" y="3" width="6" height="5" rx="1.2" />
      <rect x="3" y="16" width="5.5" height="4.5" rx="1.2" />
      <rect x="15.5" y="16" width="5.5" height="4.5" rx="1.2" />
      {p('M12 8v4')}
      {p('M5.75 16v-4h12.5v4')}
    </>
  ),
  'folder-open': (
    <>{p('M3.5 18.5V6.8c0-.9.7-1.6 1.6-1.6h4.1l2 2.3h6.1c.9 0 1.6.7 1.6 1.6v1.3')}{p('M3.5 18.5l2.3-6.4c.2-.6.8-1 1.5-1h13.2c1 0 1.7 1 1.3 1.9l-1.9 4.5c-.2.6-.8 1-1.5 1H3.5z')}</>
  ),
  'folder-plus': (
    <>{p('M3.5 18.2V6.8c0-.9.7-1.6 1.6-1.6h4.1l2 2.3h6.1c.9 0 1.6.7 1.6 1.6v8.9c0 .9-.7 1.6-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6z')}{l(12, 10.5, 12, 16)}{l(9.2, 13.2, 14.8, 13.2)}</>
  ),
  'box-archive': <>{rect(3.5, 4, 17, 4.6, 1.2)}{p('M5 8.6v10.3c0 .7.6 1.3 1.3 1.3h11.4c.7 0 1.3-.6 1.3-1.3V8.6')}{l(10, 12.4, 14, 12.4)}</>,
  calendar: (
    <>{rect(3.8, 5.5, 16.4, 15, 2.2)}{l(3.8, 10, 20.2, 10)}{l(8.4, 3.2, 8.4, 7)}{l(15.6, 3.2, 15.6, 7)}{c(8.6, 13.6, 0.85)}{c(12, 13.6, 0.85)}{c(15.4, 13.6, 0.85)}{c(8.6, 17, 0.85)}{c(12, 17, 0.85)}</>
  ),
  clock: <>{c(12, 12, 8.6)}{p('M12 7.4V12l3.3 2')}</>,
  'clock-rotate-left': <>{p('M4.4 12a7.7 7.7 0 1 0 2.3-5.4')}{p('M4 4.6v4.2h4.2')}{p('M12 8.4V12l2.9 1.8')}</>,
  inbox: (
    <>{p('M3.8 13.2V6.5c0-.9.7-1.7 1.7-1.7h13c.9 0 1.7.8 1.7 1.7v6.7')}{p('M3.8 13.2h4.6l1.3 2.4h4.6l1.3-2.4h4.6v4.8c0 .9-.8 1.7-1.7 1.7H5.5c-.9 0-1.7-.8-1.7-1.7z')}</>
  ),
  images: (
    <>{rect(3.5, 6, 13, 12, 2)}{p('M7.5 3.5h11A2 2 0 0 1 20.5 5.5v11')}{p('M5.5 15.2l3.4-3.9 2.9 3 2-2.3 2.7 3.2')}{c(7.4, 9.6, 1)}</>
  ),
  film: (
    <>{rect(3.5, 4.5, 17, 15, 2)}{l(8, 4.5, 8, 19.5)}{l(16, 4.5, 16, 19.5)}{l(3.5, 9.6, 8, 9.6)}{l(3.5, 14.4, 8, 14.4)}{l(16, 9.6, 20.5, 9.6)}{l(16, 14.4, 20.5, 14.4)}</>
  ),
  language: (
    <>{p('M4 5.4h8.6')}{p('M8.3 5.4c0 4.3-2 7.6-4.3 9.2')}{p('M5.6 9.8c1.2 2.7 3.3 4.4 5.4 5')}{p('M13 19l3.6-9.5L20.2 19')}{l(14.2, 15.7, 18.6, 15.7)}</>
  ),
  'map-location-dot': <>{p('M12 21c4-4.4 6.4-7.4 6.4-10.2A6.4 6.4 0 0 0 5.6 10.8C5.6 13.6 8 16.6 12 21z')}{c(12, 10.6, 2.3)}</>,
  'earth-africa': <>{c(12, 12, 8.8)}{p('M3.4 12h17.2')}{p('M12 3.2c2.6 2.4 3.9 5.4 3.9 8.8s-1.3 6.4-3.9 8.8c-2.6-2.4-3.9-5.4-3.9-8.8s1.3-6.4 3.9-8.8z')}</>,
  microphone: (
    <>{rect(9.2, 2.8, 5.6, 10.4, 2.8)}{p('M5.6 11.2a6.4 6.4 0 0 0 12.8 0')}{l(12, 17.6, 12, 21)}{l(9, 21, 15, 21)}</>
  ),
  'volume-high': <>{p('M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z')}{p('M15.4 9a4.3 4.3 0 0 1 0 6')}{p('M18 6.4a8 8 0 0 1 0 11.2')}</>,
  users: (
    <>{c(9.2, 8.2, 3.2)}{p('M3 20c0-3.3 2.7-5.4 6.2-5.4S15.4 16.7 15.4 20')}{p('M16.4 5.4a3.1 3.1 0 0 1 0 6')}{p('M17.6 14.8c2 .6 3.4 2.3 3.4 4.6')}</>
  ),
  user: <>{c(12, 8.4, 3.4)}{p('M5 20c0-3.6 3.1-5.8 7-5.8s7 2.2 7 5.8')}</>,
  'user-slash': <>{c(12, 8.4, 3.4)}{p('M5 20c0-3.6 3.1-5.8 7-5.8 1 0 1.9.15 2.7.42')}{l(4, 4, 20, 20)}</>,
  'shield-halved': <>{p('M12 3.2l7.6 2.9v5.6c0 4.7-3.2 7.7-7.6 8.9-4.4-1.2-7.6-4.2-7.6-8.9V6.1z')}{p('M12 3.2v17.4')}</>,
  sliders: <>{l(4, 8, 20, 8)}{c(9.5, 8, 2)}{l(4, 16, 20, 16)}{c(15.5, 16, 2)}</>,
  gear: (
    <>{c(12, 12, 3.2)}{p('M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M6.1 6.1l1.7 1.7M16.2 16.2l1.7 1.7M17.9 6.1l-1.7 1.7M7.8 16.2l-1.7 1.7')}{c(12, 12, 8.2)}</>
  ),
  'toggle-on': <>{rect(2.8, 7.6, 18.4, 8.8, 4.4)}{c(16.8, 12, 2.7)}</>,
  'toggle-off': <>{rect(2.8, 7.6, 18.4, 8.8, 4.4)}{c(7.2, 12, 2.7)}</>,
  'table-columns': <>{rect(3.5, 4.5, 17, 15, 2)}{l(9.4, 4.5, 9.4, 19.5)}{l(14.6, 4.5, 14.6, 19.5)}</>,
  house: <>{p('M4 10.4L12 4l8 6.4V19a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 19z')}{p('M9.6 20.4v-5.8h4.8v5.8')}</>,
  display: <>{rect(3, 4.5, 18, 12, 2)}{l(9, 20, 15, 20)}{l(12, 16.5, 12, 20)}</>,
  palette: (
    <>{p('M12 3.2a8.8 8.8 0 0 0 0 17.6c1.3 0 2-.9 2-1.9 0-1.4-1.4-1.8-1.4-3 0-1.1.9-2 2.1-2h1.9a4.2 4.2 0 0 0 4.2-4.2c0-3.6-3.9-6.5-8.8-6.5z')}{c(8.2, 8.4, 1)}{c(12.4, 7, 1)}{c(15.9, 9.4, 1)}{c(7.6, 12.8, 1)}</>
  ),
  envelope: <>{rect(3.2, 5.4, 17.6, 13.2, 2.2)}{p('M4.4 7.2l7.6 5.6 7.6-5.6')}</>,
  stop: <>{rect(6, 6, 12, 12, 2.4)}</>,
  'circle-stop': <>{c(12, 12, 8.8)}{rect(9, 9, 6, 6, 1.2)}</>,
  bolt: <>{p('M13.4 3.2L5.8 13.4h5.1L10.6 20.8 18.2 10.6h-5.1z')}</>,
  sun: <>{c(12, 12, 4.2)}{l(12, 2.6, 12, 5)}{l(12, 19, 12, 21.4)}{l(2.6, 12, 5, 12)}{l(19, 12, 21.4, 12)}{l(5.4, 5.4, 7.1, 7.1)}{l(16.9, 16.9, 18.6, 18.6)}{l(18.6, 5.4, 16.9, 7.1)}{l(7.1, 16.9, 5.4, 18.6)}</>,
  moon: <>{p('M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.8 8.8 0 1 0 10.8 10.8z')}</>,
  'bars': <>{l(4, 7, 20, 7)}{l(4, 12, 20, 12)}{l(4, 17, 20, 17)}</>,
  'bars-staggered': <>{l(4, 7, 20, 7)}{l(7.5, 12, 20, 12)}{l(4, 17, 16.5, 17)}</>,
  'align-left': <>{l(4, 6.5, 20, 6.5)}{l(4, 11, 15, 11)}{l(4, 15.5, 19, 15.5)}{l(4, 20, 12, 20)}</>,
  corner: <>{p('M6 19V9a3 3 0 0 1 3-3h9')}{p('M14.5 2.5L18 6l-3.5 3.5')}</>,
  code: <>{p('M9 7.5L4.5 12 9 16.5')}{p('M15 7.5L19.5 12 15 16.5')}{l(13.2, 5, 10.8, 19)}</>,
  comments: (
    <>{p('M14.5 4.2H7.2A3.2 3.2 0 0 0 4 7.4v4.1a3.2 3.2 0 0 0 3.2 3.2h.9v3.1l3.3-3.1h3.1a3.2 3.2 0 0 0 3.2-3.2V7.4a3.2 3.2 0 0 0-3.2-3.2z')}{p('M16.6 16.1a3.2 3.2 0 0 0 3.4-2.9')}</>
  ),
  'comment-dots': (
    <>{p('M20.5 11.6a8 8 0 0 1-8 8H8.9l-4.4 3v-3.6a8 8 0 0 1-1-4.2 8 8 0 0 1 8-8h1a8 8 0 0 1 8 8z')}{c(8.4, 11.6, 0.9)}{c(12, 11.6, 0.9)}{c(15.6, 11.6, 0.9)}</>
  ),
  rocket: (
    <>{p('M14.2 3.6c3.1.9 5.3 3.1 6.2 6.2-3 3.2-6.2 5.2-9.6 6.2l-2.8-2.8c1-3.4 3-6.6 6.2-9.6z')}{c(15.2, 8.8, 1.7)}{p('M7.8 13.4c-1.6.4-2.7 2-3 4.4 2.4-.3 4-1.4 4.4-3')}{p('M10.6 16.2c-.4 1.6-2 2.7-4.4 3 .3-2.4 1.4-4 3-4.4')}</>
  ),
  'shield-check': <>{p('M12 3.2l7.6 2.9v5.6c0 4.7-3.2 7.7-7.6 8.9-4.4-1.2-7.6-4.2-7.6-8.9V6.1z')}{p('M8.8 11.9l2.3 2.3 4.3-4.4')}</>,
};

/** Table d'alias : ancien nom Font Awesome → nom sémantique. */
const ALIAS: Record<string, string> = {
  'wand-magic-sparkles': 'studio',
  'studio': 'studio',
  copy: 'copy',
  'paper-plane': 'paper-plane',
  send: 'send',
  rocket: 'rocket',
  comments: 'comments',
  'comment-dots': 'comment-dots',
  code: 'code',
  flask: 'experimentation',
  microphone: 'microphone',
  'map-location-dot': 'map-location-dot',
  'earth-africa': 'earth-africa',
  language: 'language',
  'shield-halved': 'shield-halved',
  'magnifying-glass': 'magnifying-glass',
  'magnifying-glass-chart': 'magnifying-glass-chart',
  'list-check': 'list-check',
  'diagram-project': 'diagram-project',
  'folder-open': 'folder-open',
  'folder-plus': 'folder-plus',
  'file-lines': 'file-lines',
  'clock-rotate-left': 'clock-rotate-left',
  'chart-column': 'chart-column',
  newspaper: 'newspaper',
  'book-open': 'book-open',
  film: 'film',
  images: 'images',
  palette: 'palette',
  lightbulb: 'lightbulb',
  compass: 'compass',
  link: 'link',
  brain: 'brain',
  spinner: 'spinner',
  'circle-notch': 'circle-notch',
  bolt: 'bolt',
  calendar: 'calendar',
  clock: 'clock',
  'toggle-on': 'toggle-on',
  'toggle-off': 'toggle-off',
  'user': 'user',
  users: 'users',
  'user-slash': 'user-slash',
  'shield-check': 'shield-check',
  sliders: 'sliders',
  gear: 'gear',
  'table-columns': 'table-columns',
  sitemap: 'sitemap',
  print: 'print',
  download: 'download',
  envelope: 'envelope',
  inbox: 'inbox',
  house: 'house',
  display: 'display',
  eraser: 'eraser',
  'floppy-disk': 'floppy-disk',
  'box-archive': 'box-archive',
  trash: 'trash',
  pen: 'pen',
  plus: 'plus',
  minus: 'minus',
  check: 'check',
  xmark: 'xmark',
  stop: 'circle-stop',
  rotate: 'rotate',
  'volume-high': 'volume-high',
  'circle-info': 'circle-info',
  'circle-exclamation': 'circle-exclamation',
  'triangle-exclamation': 'triangle-exclamation',
  list: 'list',
  'align-left': 'align-left',
  bars: 'bars',
  'bars-staggered': 'bars-staggered',
  'bars-progress': 'bars-progress',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'arrow-right': 'arrow-right',
  'arrow-left': 'arrow-left',
  'arrow-up-right': 'arrow-up-right',
  'arrow-right-from-bracket': 'arrow-right-from-bracket',
  'arrow-right-to-bracket': 'arrow-right-to-bracket',
  'magnifying-glass-chart2': 'magnifying-glass-chart',
  corner: 'corner',
};

// Icônes « maison » dessinées après les alias (source unique de vérité).
const MAISON: Record<string, React.ReactNode> = {
  // Fiole d'expérimentation (simulation, essais) — sans cliché.
  experimentation: (
    <>
      {p('M9.4 3.2h5.2')}
      {p('M10.4 3.2v4.6L5.7 17a2.2 2.2 0 0 0 1.9 3.2h8.8a2.2 2.2 0 0 0 1.9-3.2l-4.7-9.2V3.2')}
      {p('M7.8 14.6h8.4')}
    </>
  ),
  'file-lines': (
    <>
      {p('M6 3.4h7.2L18 8.2v12.4H6z')}
      {p('M13.2 3.4v4.8H18')}
      {l(8.8, 12, 15.2, 12)}
      {l(8.8, 15.4, 15.2, 15.4)}
      {l(8.8, 18.4, 12.6, 18.4)}
    </>
  ),
};

export type NomIcone = string;

export interface IconeProps {
  /** Nom sémantique ou ancien nom Font Awesome. */
  nom: NomIcone;
  className?: string;
  /** Taille (px ou unité CSS) ; par défaut 1em, aligné sur le texte. */
  taille?: number | string;
  /** Remplissage plein (icônes massives type « stop »). */
  rempli?: boolean;
  /** Rotation continue (chargements). */
  tourne?: boolean;
}

/** Icône d'AURA. Aucune dépendance externe, aucun webfont. */
export const Icone: React.FC<IconeProps> = ({ nom, className, taille, rempli, tourne }) => {
  const brut = nom?.replace(/^fa-solid\s+/, '').replace(/^fa-/, '') ?? '';
  const cle = ALIAS[brut] ?? ALIAS[nom] ?? brut;
  const dessin = MAISON[cle] ?? DESSINS[cle] ?? DESSINS[ALIAS[cle] ?? ''] ?? null;
  const classes = [className, tourne ? 'icone-tourne' : ''].filter(Boolean).join(' ');

  if (!dessin) {
    // Repli assumé : petit losange de la sculpture, jamais un carré vide.
    return (
      <Svg className={classes} taille={taille} rempli={rempli}>
        {p('M12 4.5l7.5 7.5-7.5 7.5L4.5 12z')}
      </Svg>
    );
  }
  return (
    <Svg className={classes} taille={taille} rempli={rempli}>
      {dessin}
    </Svg>
  );
};
