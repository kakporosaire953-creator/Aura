import React, { useCallback, useRef, useState } from 'react';
import { Icone } from './Icone';
import { useT } from '../../app/prefs';
import type { ModeChat, PieceJointeChat } from '../../services/types';

/**
 * Briques du composeur : images jointes et mode de travail.
 *
 * Les images sont réduites dans le navigateur (1280 px de côté, JPEG 82 %)
 * avant d'être envoyées : le serveur n'accepte que des data URLs d'image
 * déjà légères, jamais un fichier brut ni une URL distante.
 */

const MAX_PIECES = 3;
const MAX_COTE = 1280;
const QUALITE = 0.82;

export const MODES: Array<{ cle: ModeChat }> = [
  { cle: 'conversation' },
  { cle: 'raisonnement' },
  { cle: 'code' },
  { cle: 'recherche' },
];

function mimeDe(dataUrl: string): string {
  const m = /^data:([^;]+);/.exec(dataUrl);
  return m ? m[1] : 'image/jpeg';
}

function lireFichier(fichier: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error('lecture'));
    fr.readAsDataURL(fichier);
  });
}

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image'));
    img.src = src;
  });
}

async function reduire(fichier: File): Promise<PieceJointeChat> {
  const dataUrl = await lireFichier(fichier);
  if (!dataUrl.startsWith('data:image/')) throw new Error('type');
  const img = await chargerImage(dataUrl);
  const echelle = Math.min(1, MAX_COTE / Math.max(img.width || 1, img.height || 1));
  const dejaLegere = echelle === 1 && dataUrl.length <= 900_000;
  if (dejaLegere) {
    return {
      nom: fichier.name.slice(0, 120),
      type: mimeDe(dataUrl),
      taille: fichier.size,
      data: dataUrl,
    };
  }
  const toile = document.createElement('canvas');
  toile.width = Math.max(1, Math.round(img.width * echelle));
  toile.height = Math.max(1, Math.round(img.height * echelle));
  const ctx = toile.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, toile.width, toile.height);
  ctx.drawImage(img, 0, 0, toile.width, toile.height);
  const sortie = toile.toDataURL('image/jpeg', QUALITE);
  return {
    nom: `${fichier.name.replace(/\.[^.]+$/, '')}.jpg`,
    type: 'image/jpeg',
    taille: Math.round((sortie.length * 3) / 4),
    data: sortie,
  };
}

export function usePiecesJointes(): {
  pieces: PieceJointeChat[];
  erreur: string | null;
  ajouter: (fichiers: FileList | File[]) => Promise<void>;
  retirer: (i: number) => void;
  vider: () => void;
} {
  const [pieces, setPieces] = useState<PieceJointeChat[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const t = useT();

  const ajouter = useCallback(
    async (fichiers: FileList | File[]) => {
      const liste = Array.from(fichiers);
      if (!liste.length) return;
      setErreur(null);
      const place = MAX_PIECES - pieces.length;
      if (place <= 0) {
        setErreur(t.composeur.maxImages);
        return;
      }
      const retenues = liste.slice(0, place);
      if (liste.length > place) setErreur(t.composeur.maxImages);
      const ajouts: PieceJointeChat[] = [];
      for (const f of retenues) {
        try {
          ajouts.push(await reduire(f));
        } catch {
          setErreur(t.composeur.imageIllisible);
        }
      }
      if (ajouts.length) setPieces((p) => [...p, ...ajouts].slice(0, MAX_PIECES));
    },
    [pieces.length, t],
  );

  const retirer = useCallback((i: number) => {
    setPieces((p) => p.filter((_, idx) => idx !== i));
    setErreur(null);
  }, []);

  const vider = useCallback(() => {
    setPieces([]);
    setErreur(null);
  }, []);

  return { pieces, erreur, ajouter, retirer, vider };
}

export const BoutonJoindre: React.FC<{
  onFichiers: (f: FileList) => void;
  desactive?: boolean;
}> = ({ onFichiers, desactive }) => {
  const t = useT();
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) onFichiers(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="bouton-joindre"
        onClick={() => ref.current?.click()}
        disabled={desactive}
        aria-label={t.composeur.joindre}
        title={t.composeur.joindre}
      >
        <Icone nom="plus" />
      </button>
    </>
  );
};

export const VignettesPieces: React.FC<{
  pieces: PieceJointeChat[];
  onRetirer: (i: number) => void;
}> = ({ pieces, onRetirer }) => {
  const t = useT();
  if (!pieces.length) return null;
  return (
    <ul className="vignettes-pieces">
      {pieces.map((p, i) => (
        <li key={`${p.nom}-${i}`}>
          <img src={p.data} alt={p.nom} width={56} height={56} />
          <button
            type="button"
            onClick={() => onRetirer(i)}
            aria-label={`${t.composeur.retirer} ${p.nom}`}
            title={t.composeur.retirer}
          >
            <Icone nom="xmark" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export const SelecteurMode: React.FC<{
  mode: ModeChat;
  onMode: (m: ModeChat) => void;
  /** Avec une image jointe, c'est la tâche « image » qui route : on le dit. */
  desactive?: boolean;
}> = ({ mode, onMode, desactive }) => {
  const t = useT();
  return (
    <label
      className={`selecteur-mode${desactive ? ' est-desactive' : ''}`}
      title={desactive ? t.composeur.modeImageAide : t.composeur.modeAide}
    >
      <Icone nom="bolt" />
      <select
        value={mode}
        onChange={(e) => onMode(e.target.value as ModeChat)}
        aria-label={t.composeur.mode}
        disabled={desactive}
      >
        {MODES.map((m) => (
          <option key={m.cle} value={m.cle}>
            {t.composeur.modes[m.cle]}
          </option>
        ))}
      </select>
      <Icone nom="chevron-down" className="selecteur-mode-chevron" />
    </label>
  );
};
