/**
 * Briques UI du workspace : dialogue accessible, états communs
 * (chargement, vide, erreur), carte d'identité d'un élément.
 */
import React, { useEffect, useRef } from 'react';

/* ── Dialogue accessible (Escape, clic extérieur, retour de focus) ── */

export const Dialogue: React.FC<{
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
  pied?: React.ReactNode;
  large?: boolean;
}> = ({ ouvert, onFermer, titre, children, pied, large }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const precedent = useRef<Element | null>(null);
  // onFermer en ref : l'effet ne se relance pas à chaque rendu (sinon le
  // focus est volé en pleine saisie — et la barre d'espace activait le
  // bouton de fermeture, ce qui refermait le dialogue).
  const fermerRef = useRef(onFermer);
  fermerRef.current = onFermer;

  useEffect(() => {
    if (!ouvert) return;
    precedent.current = document.activeElement;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermerRef.current();
    };
    document.addEventListener('keydown', auClavier);
    // Focus initial sur le premier CHAMP du formulaire, jamais sur un bouton.
    const t = setTimeout(() => {
      ref.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', auClavier);
      clearTimeout(t);
      (precedent.current as HTMLElement | null)?.focus?.();
    };
  }, [ouvert]);

  if (!ouvert) return null;
  return (
    <div className="dlg-fond" onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div
        className={`dlg${large ? ' dlg-large' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        ref={ref}
      >
        <div className="dlg-entete">
          <h2 className="dlg-titre">{titre}</h2>
          <button type="button" className="dlg-fermer" aria-label="Fermer" onClick={onFermer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="dlg-corps">{children}</div>
        {pied && <div className="dlg-pied">{pied}</div>}
      </div>
    </div>
  );
};

/* ── États ── */

export const EtatChargement: React.FC<{ texte?: string }> = ({ texte }) => (
  <div className="etat etat-chargement" role="status">
    <span className="etat-spinner" aria-hidden="true" />
    <p>{texte ?? 'Chargement…'}</p>
  </div>
);

export const EtatVide: React.FC<{
  icone?: string;
  titre: string;
  texte?: string;
  action?: React.ReactNode;
}> = ({ icone, titre, texte, action }) => (
  <div className="etat etat-vide">
    <i className={`fa-solid ${icone ?? 'fa-inbox'}`} aria-hidden="true" />
    <p className="etat-titre">{titre}</p>
    {texte && <p className="etat-texte">{texte}</p>}
    {action}
  </div>
);

export const EtatErreur: React.FC<{ message: string; action?: React.ReactNode }> = ({
  message,
  action,
}) => (
  <div className="etat etat-erreur" role="alert">
    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    <p>{message}</p>
    {action}
  </div>
);

/* ── Badge ── */

export const Badge: React.FC<{ children: React.ReactNode; ton?: 'neutre' | 'vert' | 'feu' | 'or' }> = ({
  children,
  ton = 'neutre',
}) => <span className={`badge badge-${ton}`}>{children}</span>;
