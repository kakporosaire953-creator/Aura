/**
 * Administration du référentiel documentaire.
 *
 * L'interface n'accorde aucun droit : chaque action appelle une route
 * serveur protégée par `AURA_ADMIN_EMAILS`. Elle sert à faire le travail
 * réel — activer une source vérifiée, importer un document, valider ou
 * archiver une ressource, tester une recherche.
 *
 * Aucune ressource n'est créée ici « pour l'exemple » : ce que la page
 * affiche est ce que le serveur contient.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrefs } from '../app/prefs';
import { Icone } from '../components/ui/Icone';
import * as api from '../services/api';
import type {
  SavoirDomaine,
  SavoirEtat,
  SavoirJournalEntreeAdmin,
  SavoirNiveau,
  SavoirPassageAdmin,
  SavoirRessource,
  SavoirSource,
  SavoirStatut,
} from '../services/types';

const L = {
  fr: {
    titre: 'Référentiel documentaire',
    sous: 'Les sources que l’assistant peut citer — jamais devinées, jamais inventées.',
    retour: 'Administration',
    chargement: 'Chargement de l’état réel…',
    refuse: 'Accès réservé aux administrateurs.',
    ressources: 'ressources',
    actives: 'utilisables',
    aVerifier: 'à vérifier',
    segments: 'segments',
    sources: 'sources',
    sourcesActives: 'sources autorisées',
    recherche: 'recherche',
    embeddingsOff: 'Recherche lexicale : aucun fournisseur d’embeddings n’est configuré.',
    catalogue: 'Catalogue de sources',
    catalogueAide:
      'Une URL n’est téléchargée que si son hôte est autorisé ici. Les candidats proposés restent inactifs tant que vous ne les avez pas vérifiés.',
    semer: 'Ajouter les 8 candidats béninois',
    activer: 'Autoriser',
    desactiver: 'Retirer l’autorisation',
    enAttente: 'en attente',
    actif: 'actif',
    desactive: 'désactivé',
    ressourcesTitre: 'Documents indexés',
    aucun: 'Aucun document. Importez une page officielle ou collez un texte.',
    valider: 'Valider',
    archiver: 'Archiver',
    reindexer: 'Réindexer',
    supprimer: 'Supprimer',
    importer: 'Importer un document',
    parUrl: 'Depuis une URL autorisée',
    parTexte: 'Texte collé',
    url: 'URL du document',
    texte: 'Texte du document',
    titreChamp: 'Titre',
    domaine: 'Domaine',
    niveau: 'Niveau d’autorité',
    organisme: 'Organisme',
    pays: 'Pays (ISO 2)',
    envoyer: 'Lancer l’import',
    test: 'Tester la recherche',
    question: 'Question à tester',
    tester: 'Chercher',
    aucunPassage: 'Aucun passage : le document n’est pas encore validé, ou la question ne correspond pas.',
    journal: 'Journal du référentiel',
    confirmerSupprimer: 'Supprimer définitivement ce document et son index ?',
    statuts: { actif: 'utilisable', 'a-verifier': 'à vérifier', expire: 'expiré', archive: 'archivé' } as Record<SavoirStatut, string>,
    niveaux: { A: 'A — officiel', B: 'B — spécialisé', C: 'C — complémentaire' } as Record<SavoirNiveau, string>,
    domaines: {
      administration: 'Administration',
      culture: 'Culture',
      geographie: 'Géographie',
      education: 'Éducation',
      entrepreneuriat: 'Entrepreneuriat',
      institutions: 'Institutions',
      statistiques: 'Statistiques',
      numerique: 'Numérique',
    } as Record<SavoirDomaine, string>,
  },
  en: {
    titre: 'Document reference',
    sous: 'Sources the assistant may cite — never guessed, never invented.',
    retour: 'Administration',
    chargement: 'Loading actual state…',
    refuse: 'Administrators only.',
    ressources: 'documents',
    actives: 'usable',
    aVerifier: 'to review',
    segments: 'segments',
    sources: 'sources',
    sourcesActives: 'authorised sources',
    recherche: 'search',
    embeddingsOff: 'Lexical search only: no embedding provider is configured.',
    catalogue: 'Source catalogue',
    catalogueAide:
      'A URL is fetched only when its host is authorised here. Proposed candidates stay inactive until you verify them.',
    semer: 'Add the 8 Beninese candidates',
    activer: 'Authorise',
    desactiver: 'Revoke',
    enAttente: 'pending',
    actif: 'active',
    desactive: 'disabled',
    ressourcesTitre: 'Indexed documents',
    aucun: 'No document yet. Import an official page or paste a text.',
    valider: 'Approve',
    archiver: 'Archive',
    reindexer: 'Reindex',
    supprimer: 'Delete',
    importer: 'Import a document',
    parUrl: 'From an authorised URL',
    parTexte: 'Pasted text',
    url: 'Document URL',
    texte: 'Document text',
    titreChamp: 'Title',
    domaine: 'Domain',
    niveau: 'Authority level',
    organisme: 'Organisation',
    pays: 'Country (ISO 2)',
    envoyer: 'Start import',
    test: 'Test the search',
    question: 'Question to test',
    tester: 'Search',
    aucunPassage: 'No passage: the document is not approved yet, or the question does not match.',
    journal: 'Reference log',
    confirmerSupprimer: 'Permanently delete this document and its index?',
    statuts: { actif: 'usable', 'a-verifier': 'to review', expire: 'expired', archive: 'archived' } as Record<SavoirStatut, string>,
    niveaux: { A: 'A — official', B: 'B — specialised', C: 'C — supplementary' } as Record<SavoirNiveau, string>,
    domaines: {
      administration: 'Administration',
      culture: 'Culture',
      geographie: 'Geography',
      education: 'Education',
      entrepreneuriat: 'Entrepreneurship',
      institutions: 'Institutions',
      statistiques: 'Statistics',
      numerique: 'Digital',
    } as Record<SavoirDomaine, string>,
  },
};

const dateCourte = (iso: string | null, langue: 'fr' | 'en'): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium' });
};

export const SavoirAdminPage: React.FC = () => {
  const { lang } = usePrefs();
  const t = L[lang];

  const [acces, setAcces] = useState<'inconnu' | 'admin' | 'refuse'>('inconnu');
  const [etat, setEtat] = useState<SavoirEtat | null>(null);
  const [ressources, setRessources] = useState<SavoirRessource[]>([]);
  const [sources, setSources] = useState<SavoirSource[]>([]);
  const [journal, setJournal] = useState<SavoirJournalEntreeAdmin[]>([]);
  const [filtre, setFiltre] = useState<SavoirStatut | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState(false);

  // Import
  const [modeImport, setModeImport] = useState<'url' | 'texte'>('url');
  const [url, setUrl] = useState('');
  const [texte, setTexte] = useState('');
  const [titre, setTitre] = useState('');
  const [organisme, setOrganisme] = useState('');
  const [pays, setPays] = useState('BJ');
  const [domaine, setDomaine] = useState<SavoirDomaine>('administration');
  const [niveau, setNiveau] = useState<SavoirNiveau>('A');

  // Test de recherche
  const [question, setQuestion] = useState('');
  const [passages, setPassages] = useState<SavoirPassageAdmin[] | null>(null);
  const [modeRecherche, setModeRecherche] = useState<string>('');

  const charger = useCallback(async () => {
    const accesAdmin = await api.adminEtat();
    if (!accesAdmin.ok || !accesAdmin.donnees.admin) {
      setAcces('refuse');
      return;
    }
    setAcces('admin');
    const [e, r, s, j] = await Promise.all([
      api.savoirEtat(),
      api.savoirRessources(filtre ? { statut: filtre } : {}),
      api.savoirSources(),
      api.savoirJournal(),
    ]);
    if (e.ok) setEtat(e.donnees);
    else setErreur(e.erreur);
    if (r.ok) setRessources(r.donnees.ressources);
    if (s.ok) setSources(s.donnees.sources);
    if (j.ok) setJournal(j.donnees.entrees.slice(0, 20));
  }, [filtre]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const executer = async (fn: () => Promise<{ ok: boolean; erreur?: string }>, succes: string) => {
    setAction(true);
    setErreur(null);
    setMessage(null);
    const r = await fn();
    setAction(false);
    if (!r.ok) setErreur(r.erreur ?? 'Action refusée.');
    else {
      setMessage(succes);
      await charger();
    }
  };

  if (acces === 'inconnu') {
    return (
      <section className="page-section admin-page">
        <p className="corps" role="status">
          {t.chargement}
        </p>
      </section>
    );
  }

  if (acces === 'refuse') {
    return (
      <section className="page-section admin-page">
        <h1 className="display-md">{t.titre}</h1>
        <p className="form-note form-info" role="status">
          <Icone nom="shield-halved" /> {t.refuse}
        </p>
        <Link to="/app" className="lien-discret">
          {t.retour}
        </Link>
      </section>
    );
  }

  const importer = async (ev: React.FormEvent) => {
    ev.preventDefault();
    await executer(
      () =>
        api.savoirImporter({
          ...(modeImport === 'url' ? { url: url.trim() } : { texte }),
          titre: titre.trim() || undefined,
          domaine,
          niveau,
          organisme: organisme.trim() || undefined,
          pays: pays.trim().toUpperCase() || undefined,
        }),
      lang === 'en' ? 'Import finished — document is awaiting review.' : 'Import terminé — document en attente de validation.',
    );
  };

  return (
    <section className="page-section admin-page savoir-page">
      <header className="admin-entete">
        <h1 className="display-md">{t.titre}</h1>
        <p className="corps">{t.sous}</p>
        <Link to="/admin" className="lien-discret">
          <Icone nom="arrow-left" /> {t.retour}
        </Link>
      </header>

      {message && (
        <p className="form-note form-succes" role="status">
          {message}
        </p>
      )}
      {erreur && (
        <p className="form-note form-erreur" role="alert">
          {erreur}
        </p>
      )}

      {etat && (
        <>
          <div className="admin-stats" aria-label={t.titre}>
            {[
              { cle: t.ressources, valeur: etat.ressources },
              { cle: t.actives, valeur: etat.actives },
              { cle: t.aVerifier, valeur: etat.aVerifier },
              { cle: t.segments, valeur: etat.segments },
              { cle: t.sources, valeur: etat.sources },
              { cle: t.sourcesActives, valeur: etat.sourcesActives },
            ].map((s) => (
              <div className="admin-stat" key={s.cle}>
                <strong>{s.valeur}</strong>
                <span>{s.cle}</span>
              </div>
            ))}
          </div>
          <p className="form-note">
            <Icone nom="magnifying-glass" /> {t.recherche} : <strong>{etat.recherche}</strong>
            {etat.recherche === 'lexicale' && ` — ${t.embeddingsOff}`}
          </p>
        </>
      )}

      {/* ── Catalogue ── */}
      <section className="savoir-bloc" aria-labelledby="savoir-catalogue">
        <div className="savoir-bloc-entete">
          <h2 id="savoir-catalogue" className="titre-sm">
            {t.catalogue}
          </h2>
          <button
            type="button"
            className="btn btn-secondaire"
            disabled={action}
            onClick={() => void executer(() => api.savoirSemer(), lang === 'en' ? 'Candidates added (pending).' : 'Candidats ajoutés (en attente).')}
          >
            {t.semer}
          </button>
        </div>
        <p className="form-note">{t.catalogueAide}</p>
        <div className="savoir-tableau" role="table" aria-label={t.catalogue}>
          <div className="savoir-ligne savoir-ligne-entete" role="row">
            <span role="columnheader">Source</span>
            <span role="columnheader">Hôte</span>
            <span role="columnheader">Statut</span>
            <span role="columnheader">Action</span>
          </div>
          {sources.length === 0 && (
            <p className="form-note">{lang === 'en' ? 'Empty catalogue.' : 'Catalogue vide.'}</p>
          )}
          {sources.map((s) => (
            <div className="savoir-ligne" role="row" key={s.id}>
              <span role="cell" className="savoir-cellule-forte">
                {s.nom}
                <small>{t.niveaux[s.niveau]}</small>
              </span>
              <span role="cell" className="savoir-mono">
                {s.hote}
              </span>
              <span role="cell">
                <span className={`pastille pastille-${s.statut}`}>
                  {s.statut === 'actif' ? t.actif : s.statut === 'desactive' ? t.desactive : t.enAttente}
                </span>
              </span>
              <span role="cell">
                {s.statut === 'actif' ? (
                  <button
                    type="button"
                    className="btn-lien"
                    disabled={action}
                    onClick={() => void executer(() => api.savoirStatutSource(s.id, 'desactive'), t.desactiver)}
                  >
                    {t.desactiver}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-lien"
                    disabled={action}
                    onClick={() => void executer(() => api.savoirStatutSource(s.id, 'actif'), t.activer)}
                  >
                    {t.activer}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Import ── */}
      <section className="savoir-bloc" aria-labelledby="savoir-import">
        <h2 id="savoir-import" className="titre-sm">
          {t.importer}
        </h2>
        <form className="savoir-form" onSubmit={(e) => void importer(e)}>
          <div className="savoir-bascule" role="group" aria-label={t.importer}>
            <button
              type="button"
              className={modeImport === 'url' ? 'actif' : ''}
              onClick={() => setModeImport('url')}
            >
              {t.parUrl}
            </button>
            <button
              type="button"
              className={modeImport === 'texte' ? 'actif' : ''}
              onClick={() => setModeImport('texte')}
            >
              {t.parTexte}
            </button>
          </div>
          {modeImport === 'url' ? (
            <label>
              {t.url}
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://service-public.bj/…"
                required
              />
            </label>
          ) : (
            <label>
              {t.texte}
              <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={6} required />
            </label>
          )}
          <div className="savoir-form-grille">
            <label>
              {t.titreChamp}
              <input value={titre} onChange={(e) => setTitre(e.target.value)} />
            </label>
            <label>
              {t.organisme}
              <input value={organisme} onChange={(e) => setOrganisme(e.target.value)} />
            </label>
            <label>
              {t.domaine}
              <select value={domaine} onChange={(e) => setDomaine(e.target.value as SavoirDomaine)}>
                {Object.entries(t.domaines).map(([cle, libelle]) => (
                  <option key={cle} value={cle}>
                    {libelle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.niveau}
              <select value={niveau} onChange={(e) => setNiveau(e.target.value as SavoirNiveau)}>
                {Object.entries(t.niveaux).map(([cle, libelle]) => (
                  <option key={cle} value={cle}>
                    {libelle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.pays}
              <input value={pays} maxLength={2} onChange={(e) => setPays(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn btn-primaire" disabled={action}>
            {t.envoyer}
          </button>
        </form>
      </section>

      {/* ── Ressources ── */}
      <section className="savoir-bloc" aria-labelledby="savoir-ressources">
        <div className="savoir-bloc-entete">
          <h2 id="savoir-ressources" className="titre-sm">
            {t.ressourcesTitre}
          </h2>
          <label className="savoir-filtre">
            {t.domaine}
            <select value={filtre} onChange={(e) => setFiltre(e.target.value as SavoirStatut | '')}>
              <option value="">—</option>
              <option value="actif">{t.statuts.actif}</option>
              <option value="a-verifier">{t.statuts['a-verifier']}</option>
              <option value="archive">{t.statuts.archive}</option>
            </select>
          </label>
        </div>
        {ressources.length === 0 ? (
          <p className="form-note">{t.aucun}</p>
        ) : (
          <ul className="savoir-ressources">
            {ressources.map((r) => (
              <li key={r.id} className="savoir-ressource">
                <div className="savoir-ressource-titre">
                  <strong>{r.titre}</strong>
                  <span className={`pastille pastille-${r.statut}`}>{t.statuts[r.statut]}</span>
                  <span className="savoir-niveau">{t.niveaux[r.niveau]}</span>
                </div>
                <div className="savoir-meta">
                  <span>{r.organisme}</span>
                  <span>{t.domaines[r.domaine] ?? r.domaine}</span>
                  <span>{r.pays}</span>
                  <span>
                    {r.segments} {t.segments}
                  </span>
                  <span>
                    {r.verification ? `${lang === 'en' ? 'verified' : 'vérifié'} ${dateCourte(r.verification, lang)}` : lang === 'en' ? 'not verified' : 'non vérifié'}
                  </span>
                </div>
                {r.avertissements.length > 0 && (
                  <ul className="savoir-alertes">
                    {r.avertissements.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
                <div className="savoir-actions">
                  {r.statut !== 'actif' && (
                    <button
                      type="button"
                      className="btn-lien"
                      disabled={action}
                      onClick={() => void executer(() => api.savoirStatutRessource(r.id, 'actif'), t.valider)}
                    >
                      {t.valider}
                    </button>
                  )}
                  {r.statut === 'actif' && (
                    <button
                      type="button"
                      className="btn-lien"
                      disabled={action}
                      onClick={() => void executer(() => api.savoirStatutRessource(r.id, 'archive'), t.archiver)}
                    >
                      {t.archiver}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-lien"
                    disabled={action}
                    onClick={() => void executer(() => api.savoirReindexer(r.id), t.reindexer)}
                  >
                    {t.reindexer}
                  </button>
                  <button
                    type="button"
                    className="btn-lien btn-danger"
                    disabled={action}
                    onClick={() => {
                      if (window.confirm(t.confirmerSupprimer)) {
                        void executer(() => api.savoirSupprimerRessource(r.id), t.supprimer);
                      }
                    }}
                  >
                    {t.supprimer}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Test de recherche ── */}
      <section className="savoir-bloc" aria-labelledby="savoir-test">
        <h2 id="savoir-test" className="titre-sm">
          {t.test}
        </h2>
        <form
          className="savoir-form-inline"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const r = await api.savoirRecherche(question);
              if (!r.ok) {
                setErreur(r.erreur);
                return;
              }
              setPassages(r.donnees.passages);
              setModeRecherche(r.donnees.mode);
            })();
          }}
        >
          <label>
            {t.question}
            <input value={question} onChange={(e) => setQuestion(e.target.value)} required minLength={3} />
          </label>
          <button type="submit" className="btn btn-secondaire" disabled={action}>
            {t.tester}
          </button>
        </form>
        {passages && (
          <div className="savoir-resultats">
            <p className="form-note">
              {modeRecherche} · {passages.length} passage(s)
            </p>
            {passages.length === 0 && <p className="form-note">{t.aucunPassage}</p>}
            {passages.map((p) => (
              <article key={`${p.ressourceId}-${p.ordre}`} className="savoir-passage">
                <header>
                  <strong>{p.titre}</strong>
                  <span className="savoir-mono">{p.score.toFixed(2)}</span>
                </header>
                <p>{p.texte.slice(0, 400)}</p>
                <footer>
                  {p.organisme} · {t.niveaux[p.niveau]} · {p.pays}
                  {p.alertes.length > 0 && ` · ${p.alertes.join(' ; ')}`}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Journal ── */}
      <section className="savoir-bloc" aria-labelledby="savoir-journal">
        <h2 id="savoir-journal" className="titre-sm">
          {t.journal}
        </h2>
        <ul className="savoir-journal">
          {journal.map((j) => (
            <li key={j.id}>
              <span className="savoir-mono">{dateCourte(j.le, lang)}</span>
              <span>{j.action}</span>
              <span>{j.detail}</span>
              <span className="savoir-mono">{j.par}</span>
            </li>
          ))}
          {journal.length === 0 && <li className="form-note">—</li>}
        </ul>
      </section>
    </section>
  );
};
