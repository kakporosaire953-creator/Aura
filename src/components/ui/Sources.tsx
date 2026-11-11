import React from 'react';
import type { ReferenceCitee } from '../../services/types';
import { Icone } from './Icone';

/**
 * Citations documentaires — discrètes, repliées par défaut.
 *
 * Seules les références réellement transmises au modèle sont affichées :
 * l'interface ne fabrique jamais de source. Les alertes (non vérifiée,
 * périmée, niveau C) restent visibles, elles ne sont pas décoratives.
 */
const TEXTES = {
  fr: {
    sources: 'source(s)',
    voir: 'Voir les sources',
    niveau: { A: 'officiel', B: 'spécialisé', C: 'complémentaire' } as Record<string, string>,
    publie: 'publié',
    verifie: 'vérifié',
    nonVerifie: 'non vérifié',
    ouvrir: 'ouvrir',
    avertissements: 'À savoir',
  },
  en: {
    sources: 'source(s)',
    voir: 'View sources',
    niveau: { A: 'official', B: 'specialised', C: 'supplementary' } as Record<string, string>,
    publie: 'published',
    verifie: 'verified',
    nonVerifie: 'not verified',
    ouvrir: 'open',
    avertissements: 'Please note',
  },
};

const dateCourte = (iso: string | null, langue: 'fr' | 'en'): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const Sources: React.FC<{
  references: ReferenceCitee[];
  langue: 'fr' | 'en';
  avertissements?: string[];
}> = ({ references, langue, avertissements }) => {
  if (!references.length) return null;
  const t = TEXTES[langue];

  return (
    <details className="msg-sources">
      <summary>
        <Icone nom="link" />
        <span>
          {references.length} {t.sources}
        </span>
      </summary>
      <ul className="msg-sources-liste">
        {references.map((r) => {
          const publication = dateCourte(r.publication, langue);
          const verification = dateCourte(r.verification, langue);
          return (
            <li key={`${r.etiquette}-${r.ressourceId}`} id={`source-${r.etiquette}`} className="msg-source">
              <span className="msg-source-tag">[{r.etiquette}]</span>
              <div className="msg-source-corps">
                <div className="msg-source-titre">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer noopener">
                      {r.titre}
                    </a>
                  ) : (
                    r.titre
                  )}
                </div>
                <div className="msg-source-meta">
                  <span>{r.organisme}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.niveau[r.niveau] ?? r.niveau}</span>
                  {publication && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {t.publie} {publication}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>
                    {verification ? `${t.verifie} ${verification}` : t.nonVerifie}
                  </span>
                </div>
                {r.alertes.length > 0 && (
                  <ul className="msg-source-alertes">
                    {r.alertes.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {avertissements && avertissements.length > 0 && (
        <div className="msg-source-avertissements">
          <strong>{t.avertissements}</strong>
          <ul>
            {avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
};
