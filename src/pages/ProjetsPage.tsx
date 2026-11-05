import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import {
  Dialogue,
  EtatChargement,
  EtatErreur,
  EtatVide,
} from '../components/ui/Primitives';
import * as api from '../services/api';
import type { Conversation, Creation, Memoire, Mission, Projet, Recherche } from '../services/types';

/**
 * Projets — gestion réelle (API v1) : création, modification, archivage,
 * suppression. Chaque projet possède son espace (conversations, missions,
 * créations, mémoire, recherches) et ses instructions propres, transmises
 * à l'assistant comme contexte. L'isolation est appliquée côté serveur.
 */

type FormulaireProjet = {
  nom: string;
  description: string;
  objectif: string;
  categorie: string;
  instructions: string;
};

const FORM_VIDE: FormulaireProjet = {
  nom: '',
  description: '',
  objectif: '',
  categorie: '',
  instructions: '',
};

export const ProjetsPage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<FormulaireProjet | null>(null);

  const rafraichir = useCallback(async () => {
    const r = await api.listerProjets({ archives: true });
    if (r.ok) setProjets(r.donnees.projets);
    else setErreur(r.erreur);
    setChargement(false);
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  // Ouverture automatique du dialogue via le menu « création rapide ».
  useEffect(() => {
    const etat = location.state as { creer?: boolean } | null;
    if (etat?.creer) {
      setDialogue({ ...FORM_VIDE });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const enregistrer = async () => {
    if (!dialogue || !dialogue.nom.trim()) return;
    const r = await api.creerProjet({ ...dialogue, nom: dialogue.nom.trim() });
    if (r.ok) {
      setDialogue(null);
      navigate(`/projets/${r.donnees.projet.id}`);
    } else {
      setErreur(r.erreur);
    }
  };

  return (
    <div className="page-module">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.projetsTitre}</h1>
          <p className="page-module-sous">{t.ws.instructionsAide}</p>
        </div>
        <button type="button" className="btn-principal" onClick={() => setDialogue({ ...FORM_VIDE })}>
          <i className="fa-solid fa-plus" /> {t.ws.projetNouveau}
        </button>
      </header>

      {erreur && <EtatErreur message={erreur} action={<button type="button" className="btn-simple" onClick={() => setErreur(null)}>{t.ws.reessayer}</button>} />}

      {chargement ? (
        <EtatChargement />
      ) : projets.length === 0 ? (
        <EtatVide
          icone="fa-folder-open"
          titre={t.ws.projetsTitre}
          texte={t.ws.continuVide}
          action={
            <button type="button" className="btn-principal" onClick={() => setDialogue({ ...FORM_VIDE })}>
              {t.ws.projetNouveau}
            </button>
          }
        />
      ) : (
        <div className="projets-grille">
          {projets.map((p) => (
            <Link key={p.id} to={`/projets/${p.id}`} className={`projet-carte${p.statut === 'archive' ? ' archive' : ''}`}>
              <div className="projet-carte-haut">
                <i className="fa-solid fa-folder-open" />
                {p.statut === 'archive' && <span className="badge">{t.ws.statutArchivee}</span>}
              </div>
              <strong>{p.nom}</strong>
              <p>{p.description || p.objectif || '—'}</p>
              {p.categorie && <em className="projet-categorie">{p.categorie}</em>}
            </Link>
          ))}
        </div>
      )}

      <Dialogue
        ouvert={Boolean(dialogue)}
        onFermer={() => setDialogue(null)}
        titre={t.ws.projetNouveau}
        large
        pied={
          <>
            <button type="button" className="btn-simple" onClick={() => setDialogue(null)}>
              {t.ws.annuler}
            </button>
            <button type="button" className="btn-principal" onClick={() => void enregistrer()} disabled={!dialogue?.nom.trim()}>
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        {dialogue && (
          <div className="formulaire">
            <label className="champ">
              <span>{t.ws.nomLabel} *</span>
              <input
                type="text"
                maxLength={120}
                value={dialogue.nom}
                onChange={(e) => setDialogue({ ...dialogue, nom: e.target.value })}
                required
              />
            </label>
            <label className="champ">
              <span>{t.ws.objectifLabel}</span>
              <textarea
                rows={2}
                maxLength={2000}
                value={dialogue.objectif}
                onChange={(e) => setDialogue({ ...dialogue, objectif: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.descriptionLabel}</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={dialogue.description}
                onChange={(e) => setDialogue({ ...dialogue, description: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.categorieLabel}</span>
              <input
                type="text"
                maxLength={60}
                value={dialogue.categorie}
                onChange={(e) => setDialogue({ ...dialogue, categorie: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.instructionsLabel}</span>
              <textarea
                rows={3}
                maxLength={8000}
                value={dialogue.instructions}
                onChange={(e) => setDialogue({ ...dialogue, instructions: e.target.value })}
              />
              <em className="champ-aide">{t.ws.instructionsAide}</em>
            </label>
          </div>
        )}
      </Dialogue>
    </div>
  );
};

/* ═══════════ Espace projet ═══════════ */

type Onglet = 'apercu' | 'convs' | 'missions' | 'creations' | 'memoire' | 'recherches';

export const ProjetDetailPage: React.FC = () => {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [memoires, setMemoires] = useState<Memoire[]>([]);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [recherches, setRecherches] = useState<Recherche[]>([]);
  const [onglet, setOnglet] = useState<Onglet>('apercu');
  const [edition, setEdition] = useState<FormulaireProjet | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    if (!id) return;
    const r = await api.ouvrirProjet(id);
    if (r.ok) {
      setProjet(r.donnees.projet);
      setConversations(r.donnees.conversations);
      setMissions(r.donnees.missions);
      setMemoires(r.donnees.memoires);
      setCreations(r.donnees.creations);
      setRecherches(r.donnees.recherches);
    } else {
      setErreur(r.erreur);
    }
    setChargement(false);
  }, [id]);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  if (chargement) return <EtatChargement />;
  if (!projet) {
    return (
      <div className="page-module">
        <EtatErreur
          message={erreur ?? t.ws.indisponible}
          action={
            <Link to="/projets" className="btn-principal">
              {t.ws.retour}
            </Link>
          }
        />
      </div>
    );
  }

  const enregistrerEdition = async () => {
    if (!edition || !id) return;
    const r = await api.majProjet(id, edition);
    if (r.ok) {
      setProjet(r.donnees.projet);
      setEdition(null);
    } else {
      setErreur(r.erreur);
    }
  };

  const onglets: Array<{ cle: Onglet; label: string; n: number }> = [
    { cle: 'apercu', label: t.ws.ongletApercu, n: 0 },
    { cle: 'convs', label: t.ws.ongletConvs, n: conversations.length },
    { cle: 'missions', label: t.ws.ongletMissions, n: missions.length },
    { cle: 'creations', label: t.ws.ongletCreations, n: creations.length },
    { cle: 'recherches', label: t.ws.ongletRecherches, n: recherches.length },
    { cle: 'memoire', label: t.ws.ongletMemoire, n: memoires.length },
  ];

  return (
    <div className="page-module">
      <header className="page-module-haut">
        <div>
          <Link to="/projets" className="lien-retour">
            <i className="fa-solid fa-arrow-left" /> {t.ws.projetsTitre}
          </Link>
          <h1 className="page-module-titre">{projet.nom}</h1>
          {projet.statut === 'archive' && <span className="badge">{t.ws.statutArchivee}</span>}
        </div>
        <div className="page-module-actions">
          <button
            type="button"
            className="btn-simple"
            onClick={() =>
              void api
                .majProjet(projet.id, { statut: projet.statut === 'archive' ? 'actif' : 'archive' })
                .then((r) => r.ok && setProjet(r.donnees.projet))
            }
          >
            <i className="fa-solid fa-box-archive" />{' '}
            {projet.statut === 'archive' ? t.ws.desarchiver : t.ws.archiver}
          </button>
          <button
            type="button"
            className="btn-simple"
            onClick={() =>
              setEdition({
                nom: projet.nom,
                description: projet.description,
                objectif: projet.objectif,
                categorie: projet.categorie,
                instructions: projet.instructions,
              })
            }
          >
            <i className="fa-solid fa-pen" /> {t.ws.renommer}
          </button>
          <button
            type="button"
            className="btn-danger-simple"
            onClick={async () => {
              if (!window.confirm(t.ws.confirmerSuppr)) return;
              await api.supprimerProjet(projet.id);
              navigate('/projets');
            }}
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </header>

      {erreur && <EtatErreur message={erreur} />}

      <div className="onglets" role="tablist">
        {onglets.map((o) => (
          <button
            key={o.cle}
            type="button"
            role="tab"
            aria-selected={onglet === o.cle}
            className={onglet === o.cle ? 'actif' : ''}
            onClick={() => setOnglet(o.cle)}
          >
            {o.label}
            {o.n > 0 && <span className="onglet-n">{o.n}</span>}
          </button>
        ))}
      </div>

      {onglet === 'apercu' && (
        <div className="projet-apercu">
          {projet.objectif && (
            <section>
              <h2>{t.ws.objectifLabel}</h2>
              <p className="corps">{projet.objectif}</p>
            </section>
          )}
          {projet.description && (
            <section>
              <h2>{t.ws.descriptionLabel}</h2>
              <p className="corps">{projet.description}</p>
            </section>
          )}
          <section>
            <h2>{t.ws.instructionsLabel}</h2>
            <p className="corps">{projet.instructions || '—'}</p>
            <em className="champ-aide">{t.ws.instructionsAide}</em>
          </section>
        </div>
      )}

      {onglet === 'convs' && (
        <div className="liste-simple">
          {conversations.length === 0 ? (
            <EtatVide titre={t.ws.convVide} />
          ) : (
            conversations.map((c) => (
              <Link key={c.id} to={`/chat/${c.id}`} className="ligne-simple">
                <i className="fa-solid fa-comment-dots" />
                <strong>{c.titre}</strong>
                <em>{new Date(c.maj).toLocaleDateString()}</em>
              </Link>
            ))
          )}
          <button
            type="button"
            className="btn-principal"
            onClick={() => navigate('/chat', { state: { nouveau: true } })}
          >
            <i className="fa-solid fa-plus" /> {t.ws.nouvelleConv}
          </button>
        </div>
      )}

      {onglet === 'missions' && (
        <div className="liste-simple">
          {missions.length === 0 ? (
            <EtatVide titre={t.ws.nouvelleMission} />
          ) : (
            missions.map((m) => (
              <Link key={m.id} to="/missions" className="ligne-simple">
                <i className="fa-solid fa-list-check" />
                <strong>{m.titre}</strong>
                <em>{t.ws[`statut${m.statut === 'a_faire' ? 'AFaire' : m.statut === 'en_cours' ? 'EnCours' : m.statut === 'en_attente' ? 'EnAttente' : m.statut === 'terminee' ? 'Terminee' : 'Archivee'}` as keyof typeof t.ws]}</em>
              </Link>
            ))
          )}
        </div>
      )}

      {onglet === 'creations' && (
        <div className="liste-simple">
          {creations.length === 0 ? (
            <EtatVide titre={t.ws.aucuneCreation} />
          ) : (
            creations.map((c) => (
              <Link key={c.id} to="/studio" className="ligne-simple">
                <i className="fa-solid fa-file-lines" />
                <strong>{c.titre}</strong>
                <em>{c.type}</em>
              </Link>
            ))
          )}
        </div>
      )}

      {onglet === 'recherches' && (
        <div className="liste-simple">
          {recherches.length === 0 ? (
            <EtatVide titre={t.ws.historiqueRecherches} />
          ) : (
            recherches.map((r) => (
              <Link key={r.id} to="/explore" className="ligne-simple">
                <i className="fa-solid fa-magnifying-glass" />
                <strong>{r.requete}</strong>
                <em>{new Date(r.cree).toLocaleDateString()}</em>
              </Link>
            ))
          )}
        </div>
      )}

      {onglet === 'memoire' && (
        <div className="liste-simple">
          {memoires.length === 0 ? (
            <EtatVide titre={t.ws.memoireVide} texte={t.ws.memoireSous} />
          ) : (
            memoires.map((m) => (
              <div key={m.id} className="ligne-simple">
                <i className="fa-solid fa-brain" />
                <strong>{m.contenu}</strong>
                <em>{m.actif ? t.ws.memoireActive : t.ws.memoireInactive}</em>
              </div>
            ))
          )}
          <Link to="/memoire" className="btn-principal">
            {t.ws.memoireTitre}
          </Link>
        </div>
      )}

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
            <button type="button" className="btn-principal" onClick={() => void enregistrerEdition()}>
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        {edition && (
          <div className="formulaire">
            <label className="champ">
              <span>{t.ws.nomLabel}</span>
              <input
                type="text"
                maxLength={120}
                value={edition.nom}
                onChange={(e) => setEdition({ ...edition, nom: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.objectifLabel}</span>
              <textarea
                rows={2}
                value={edition.objectif}
                onChange={(e) => setEdition({ ...edition, objectif: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.descriptionLabel}</span>
              <textarea
                rows={3}
                value={edition.description}
                onChange={(e) => setEdition({ ...edition, description: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.categorieLabel}</span>
              <input
                type="text"
                maxLength={60}
                value={edition.categorie}
                onChange={(e) => setEdition({ ...edition, categorie: e.target.value })}
              />
            </label>
            <label className="champ">
              <span>{t.ws.instructionsLabel}</span>
              <textarea
                rows={3}
                value={edition.instructions}
                onChange={(e) => setEdition({ ...edition, instructions: e.target.value })}
              />
            </label>
          </div>
        )}
      </Dialogue>
    </div>
  );
};
