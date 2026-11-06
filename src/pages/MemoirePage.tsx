import React, { useCallback, useEffect, useState } from 'react';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import {
  Dialogue,
  EtatChargement,
  EtatErreur,
  EtatVide,
} from '../components/ui/Primitives';
import * as api from '../services/api';
import type { Memoire, TypeMemoire } from '../services/types';
import { Icone } from '../components/ui/Icone';

/**
 * Mémoire AURA — informations mémorisées, transparentes et contrôlées.
 * L'utilisateur consulte, ajoute, modifie, désactive et efface réellement
 * (API v1). La mémoire n'est utilisée dans les conversations que si la
 * préférence correspondante est active (Paramètres).
 */

const TYPES: TypeMemoire[] = [
  'preference',
  'contexte_personnel',
  'preference_reponse',
  'professionnel',
  'instruction_projet',
  'temporaire',
];

function libelleType(type: TypeMemoire): string {
  return type.replace(/_/g, ' ');
}

export const MemoirePage: React.FC = () => {
  const t = useT();
  const sim = simulationActivee();
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ajout, setAjout] = useState<{ contenu: string; type: TypeMemoire } | null>(null);
  const [edition, setEdition] = useState<{ id: string; contenu: string; type: TypeMemoire } | null>(null);

  const rafraichir = useCallback(async () => {
    const r = await api.listerMemoires();
    if (r.ok) setMemoires(r.donnees.memoires);
    else setErreur(r.erreur);
    setChargement(false);
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  return (
    <div className="page-module">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.memoireTitre}</h1>
          <p className="page-module-sous">{t.ws.memoireSous}</p>
        </div>
        <div className="page-module-actions">
          {memoires.length > 0 && (
            <button
              type="button"
              className="btn-danger-simple"
              onClick={async () => {
                if (!window.confirm(t.ws.confirmerVider)) return;
                await api.viderMemoires();
                void rafraichir();
              }}
            >
              <Icone nom="eraser" /> {t.ws.toutEffacer}
            </button>
          )}
          <button type="button" className="btn-principal" onClick={() => setAjout({ contenu: '', type: 'contexte_personnel' })}>
            <Icone nom="plus" /> {t.ws.ajouterMemoire}
          </button>
        </div>
      </header>

      {erreur && <EtatErreur message={erreur} />}

      {chargement ? (
        <EtatChargement />
      ) : memoires.length === 0 ? (
        <EtatVide
          icone="brain"
          titre={t.ws.memoireVide}
          texte={t.ws.memoireSous}
          action={
            <button type="button" className="btn-principal" onClick={() => setAjout({ contenu: '', type: 'contexte_personnel' })}>
              {t.ws.ajouterMemoire}
            </button>
          }
        />
      ) : (
        <div className="memoire-liste">
          {memoires.map((m) => (
            <article key={m.id} className={`memoire-carte${m.actif ? '' : ' inactive'}`}>
              <div className="memoire-haut">
                <span className="badge">{libelleType(m.type)}</span>
                <span className="memoire-etat">{m.actif ? t.ws.memoireActive : t.ws.memoireInactive}</span>
              </div>
              <p className="memoire-contenu">{m.contenu}</p>
              <div className="mission-actions">
                <button
                  type="button"
                  className="btn-simple"
                  onClick={async () => {
                    await api.majMemoire(m.id, { actif: !m.actif });
                    void rafraichir();
                  }}
                >
                  <Icone nom={m.actif ? 'toggle-on' : 'toggle-off'} />{' '}
                  {m.actif ? t.ws.memoireActive : t.ws.memoireInactive}
                </button>
                <button
                  type="button"
                  className="btn-simple"
                  onClick={() => setEdition({ id: m.id, contenu: m.contenu, type: m.type })}
                >
                  <Icone nom="pen" />
                </button>
                <button
                  type="button"
                  className="btn-danger-simple"
                  onClick={async () => {
                    if (!window.confirm(t.ws.confirmerSuppr)) return;
                    await api.supprimerMemoire(m.id);
                    void rafraichir();
                  }}
                >
                  <Icone nom="trash" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="module-note">
        <Icone nom="shield-halved" /> {t.ws.noteConfidentialite}
        {sim && ' — '}
        {sim && t.simulation.badge}
      </p>

      <Dialogue
        ouvert={Boolean(ajout)}
        onFermer={() => setAjout(null)}
        titre={t.ws.ajouterMemoire}
        large
        pied={
          <>
            <button type="button" className="btn-simple" onClick={() => setAjout(null)}>
              {t.ws.annuler}
            </button>
            <button
              type="button"
              className="btn-principal"
              disabled={!ajout?.contenu.trim()}
              onClick={async () => {
                if (!ajout || !ajout.contenu.trim()) return;
                const r = await api.creerMemoire({ contenu: ajout.contenu.trim(), type: ajout.type });
                if (r.ok) {
                  setAjout(null);
                  void rafraichir();
                } else {
                  setErreur(r.erreur);
                }
              }}
            >
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        {ajout && (
          <div className="formulaire">
            <label className="champ">
              <span>{t.ws.typeMemoireLabel}</span>
              <select value={ajout.type} onChange={(e) => setAjout({ ...ajout, type: e.target.value as TypeMemoire })}>
                {TYPES.map((x) => (
                  <option key={x} value={x}>
                    {libelleType(x)}
                  </option>
                ))}
              </select>
            </label>
            <label className="champ">
              <span>{t.ws.ajouterMemoire}</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={ajout.contenu}
                onChange={(e) => setAjout({ ...ajout, contenu: e.target.value })}
              />
            </label>
          </div>
        )}
      </Dialogue>

      <Dialogue
        ouvert={Boolean(edition)}
        onFermer={() => setEdition(null)}
        titre={t.ws.renommer}
        large
        pied={
          <>
            <button type="button" className="btn-simple" onClick={() => setEdition(null)}>
              {t.ws.annuler}
            </button>
            <button
              type="button"
              className="btn-principal"
              onClick={async () => {
                if (!edition || !edition.contenu.trim()) return;
                await api.majMemoire(edition.id, { contenu: edition.contenu.trim(), type: edition.type });
                setEdition(null);
                void rafraichir();
              }}
            >
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        {edition && (
          <div className="formulaire">
            <label className="champ">
              <span>{t.ws.typeMemoireLabel}</span>
              <select value={edition.type} onChange={(e) => setEdition({ ...edition, type: e.target.value as TypeMemoire })}>
                {TYPES.map((x) => (
                  <option key={x} value={x}>
                    {libelleType(x)}
                  </option>
                ))}
              </select>
            </label>
            <label className="champ">
              <span>{t.ws.ajouterMemoire}</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={edition.contenu}
                onChange={(e) => setEdition({ ...edition, contenu: e.target.value })}
              />
            </label>
          </div>
        )}
      </Dialogue>
    </div>
  );
};
