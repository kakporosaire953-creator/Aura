/**
 * Panneau d'administration.
 *
 * Ce que cette page fait : lire l'état réel des comptes, suspendre, rétablir,
 * fermer des sessions, supprimer. Ce qu'elle ne fait jamais : décider seule de
 * l'accès — chaque appel est revérifié côté serveur (`AURA_ADMIN_EMAILS`).
 * L'interface ne fait que masquer ce qui n'a pas lieu d'être vu.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrefs, useT } from '../app/prefs';
import { useSession } from '../app/session';
import { Icone } from '../components/ui/Icone';
import * as api from '../services/api';
import type {
  AdminDetail,
  AdminJournalEntree,
  AdminStatistiques,
  AdminUtilisateur,
} from '../services/types';

function dateLisible(valeur: string | null, lang: 'fr' | 'en', jamais: string): string {
  if (!valeur) return jamais;
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return jamais;
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export const AdminPage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut } = useSession();

  const [acces, setAcces] = useState<'inconnu' | 'admin' | 'refuse' | 'non-configure'>('inconnu');
  const [stats, setStats] = useState<AdminStatistiques | null>(null);
  const [liste, setListe] = useState<{
    total: number;
    page: number;
    pages: number;
    utilisateurs: AdminUtilisateur[];
  } | null>(null);
  const [journal, setJournal] = useState<AdminJournalEntree[]>([]);
  const [recherche, setRecherche] = useState('');
  const [rechercheAppliquee, setRechercheAppliquee] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [motif, setMotif] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [action, setAction] = useState<'idle' | 'envoi'>('idle');

  const charger = useCallback(async () => {
    setChargement(true);
    // L'état d'accès d'abord : inutile de réclamer les données (et de faire
    // échouer trois appels) avant de savoir que la porte est ouverte.
    const etat = await api.adminEtat();
    if (!etat.ok) {
      setChargement(false);
      setAcces('refuse');
      return;
    }
    if (!etat.donnees.configure) {
      setChargement(false);
      setAcces('non-configure');
      return;
    }
    if (!etat.donnees.admin) {
      setChargement(false);
      setAcces('refuse');
      return;
    }
    setAcces('admin');

    const [s, l, j] = await Promise.all([
      api.adminStatistiques(),
      api.adminUtilisateurs({ recherche: rechercheAppliquee, page, taille: 20 }),
      api.adminJournal(),
    ]);
    setChargement(false);
    if (s.ok) setStats(s.donnees);
    if (l.ok) setListe(l.donnees);
    if (j.ok) setJournal(j.donnees.entrees);
  }, [rechercheAppliquee, page]);

  useEffect(() => {
    if (statut === 'connecte') void charger();
  }, [statut, charger]);

  const rafraichir = async () => {
    await charger();
  };

  const agir = async (fn: () => Promise<api.ReponseApi<unknown>>, succes: string) => {
    setAction('envoi');
    setErreur(null);
    setMessage(null);
    const r = await fn();
    setAction('idle');
    if (!r.ok) {
      setErreur(r.code === 'admin-refuse' ? t.admin.accesRefuse : r.erreur);
      return;
    }
    setMessage(succes);
    setMotif('');
    setConfirmation('');
    await rafraichir();
    if (detail) {
      const d = await api.adminUtilisateur(detail.utilisateur.id);
      setDetail(d.ok ? d.donnees : null);
    }
  };

  if (acces === 'inconnu') {
    return (
      <section className="page-section admin-page">
        <p className="corps" role="status">
          {t.admin.chargement}
        </p>
      </section>
    );
  }

  if (acces !== 'admin') {
    return (
      <section className="page-section admin-page">
        <h1 className="display-md">{t.admin.titre}</h1>
        <p className="form-note form-info" role="status">
          <Icone nom="shield-halved" />{' '}
          {acces === 'non-configure' ? t.admin.nonConfigure : t.admin.accesRefuse}
        </p>
      </section>
    );
  }

  return (
    <section className="page-section admin-page">
      <header className="admin-entete">
        <h1 className="display-md">{t.admin.titre}</h1>
        <p className="corps">{t.admin.sous}</p>
        <Link to="/admin/savoir" className="lien-discret">
          <Icone nom="book-open" /> {lang === 'en' ? 'Document reference' : 'Référentiel documentaire'}
        </Link>
      </header>

      {stats && (
        <div className="admin-stats" aria-label={t.admin.statsTitre}>
          {[
            { cle: 'comptes', valeur: stats.comptes },
            { cle: 'verifies', valeur: stats.verifies },
            { cle: 'google', valeur: stats.google },
            { cle: 'bannis', valeur: stats.bannis },
            { cle: 'sessionsActives', valeur: stats.sessionsActives },
            { cle: 'inscriptions7j', valeur: stats.inscriptions7j },
            { cle: 'conversations', valeur: stats.conversations },
            { cle: 'messages', valeur: stats.messages },
            { cle: 'creations', valeur: stats.creations },
          ].map((s) => (
            <div className="admin-stat" key={s.cle}>
              <strong>{s.valeur}</strong>
              <span>{t.admin[s.cle as keyof typeof t.admin] as string}</span>
            </div>
          ))}
        </div>
      )}

      <form
        className="admin-recherche"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setRechercheAppliquee(recherche.trim());
        }}
      >
        <label htmlFor="admin-recherche" className="sr-only">
          {t.admin.rechercheLabel}
        </label>
        <input
          id="admin-recherche"
          type="search"
          className="form-champ"
          placeholder={t.admin.recherchePlaceholder}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <button type="submit" className="btn btn-ligne" disabled={chargement}>
          <Icone nom="magnifying-glass" /> {t.admin.rechercher}
        </button>
      </form>

      {message && (
        <p className="form-note form-info" role="status">
          <Icone nom="circle-info" /> {message}
        </p>
      )}
      {erreur && (
        <p className="form-erreur" role="alert">
          <Icone nom="circle-exclamation" /> {erreur}
        </p>
      )}

      <div className="admin-tableau-cadre">
        <table className="admin-tableau">
          <thead>
            <tr>
              <th scope="col">{t.admin.colonnesUtilisateur}</th>
              <th scope="col">{t.admin.colonnesCree}</th>
              <th scope="col">{t.admin.colonnesEtat}</th>
              <th scope="col">{t.admin.colonnesSessions}</th>
              <th scope="col">{t.admin.colonnesActions}</th>
            </tr>
          </thead>
          <tbody>
            {liste?.utilisateurs.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-vide">
                  {t.admin.aucunResultat}
                </td>
              </tr>
            )}
            {liste?.utilisateurs.map((u) => (
              <tr key={u.id} className={u.banni ? 'admin-ligne-suspendue' : undefined}>
                <td>
                  <strong>{u.email}</strong>
                  {u.nom && <span className="admin-nom">{u.nom}</span>}
                </td>
                <td>{dateLisible(u.cree, lang, t.admin.jamais)}</td>
                <td>
                  <span className="admin-badges">
                    {u.banni && <em className="admin-badge admin-badge-danger">{t.admin.banni}</em>}
                    {u.emailVerifie ? (
                      <em className="admin-badge">{t.admin.verifie}</em>
                    ) : (
                      <em className="admin-badge admin-badge-faible">{t.admin.nonVerifie}</em>
                    )}
                    {u.googleLie && <em className="admin-badge">{t.admin.googleLie}</em>}
                  </span>
                </td>
                <td>{u.sessions}</td>
                <td>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn-ligne admin-btn"
                      onClick={async () => {
                        const d = await api.adminUtilisateur(u.id);
                        if (d.ok) {
                          setDetail(d.donnees);
                          setMessage(null);
                          setErreur(null);
                        } else setErreur(d.erreur);
                      }}
                    >
                      {t.admin.voir}
                    </button>
                    {u.banni ? (
                      <button
                        type="button"
                        className="btn-ligne admin-btn"
                        disabled={action === 'envoi'}
                        onClick={() => void agir(() => api.adminDebannir(u.id), t.admin.faitDebanni)}
                      >
                        {t.admin.debannir}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-ligne admin-btn admin-btn-danger"
                        disabled={action === 'envoi'}
                        onClick={async () => {
                          const d = await api.adminUtilisateur(u.id);
                          if (d.ok) {
                            setDetail(d.donnees);
                            setConfirmation('');
                            setMotif('');
                          }
                        }}
                      >
                        {t.admin.bannir}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {liste && liste.pages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn-ligne"
            disabled={page <= 1 || chargement}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t.admin.precedent}
          </button>
          <span>
            {t.admin.page} {liste.page} / {liste.pages}
          </span>
          <button
            type="button"
            className="btn-ligne"
            disabled={page >= liste.pages || chargement}
            onClick={() => setPage((p) => p + 1)}
          >
            {t.admin.suivant}
          </button>
        </div>
      )}

      {detail && (
        <section className="admin-detail" aria-labelledby="admin-detail-titre">
          <div className="admin-detail-entete">
            <h2 id="admin-detail-titre">{t.admin.detailTitre}</h2>
            <button
              type="button"
              className="btn-ligne admin-btn"
              onClick={() => {
                setDetail(null);
                setConfirmation('');
                setMotif('');
              }}
            >
              {t.admin.fermer}
            </button>
          </div>
          <p className="admin-detail-adresse">{detail.utilisateur.email}</p>
          <p className="corps">
            {t.admin.activite} · {t.admin.conversations} : {detail.activite.conversations} ·{' '}
            {t.admin.messages} : {detail.activite.messages} · {t.admin.creations} :{' '}
            {detail.activite.creations}
          </p>

          <h3>{t.admin.sessionsTitre}</h3>
          {detail.sessions.length === 0 ? (
            <p className="corps">{t.admin.sessionsTitre} · 0</p>
          ) : (
            <ul className="sessions-liste">
              {detail.sessions.map((s) => (
                <li key={s.id} className="session-ligne">
                  <div>
                    <strong>{s.agent ?? t.admin.appareil}</strong>
                    <span className="session-date">
                      {t.admin.derniereActivite} · {dateLisible(String(s.derniereActivite), lang, t.admin.jamais)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="admin-danger">
            <h3>{t.admin.bannirTitre}</h3>
            <label htmlFor="admin-motif">{t.admin.motifLabel}</label>
            <input
              id="admin-motif"
              type="text"
              className="form-champ"
              maxLength={200}
              placeholder={t.admin.motifPlaceholder}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
            <div className="admin-danger-actions">
              {detail.utilisateur.banni ? (
                <button
                  type="button"
                  className="btn btn-ligne"
                  disabled={action === 'envoi'}
                  onClick={() =>
                    void agir(() => api.adminDebannir(detail.utilisateur.id), t.admin.faitDebanni)
                  }
                >
                  {t.admin.debannir}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ligne admin-btn-danger"
                  disabled={action === 'envoi'}
                  onClick={() =>
                    void agir(() => api.adminBannir(detail.utilisateur.id, motif), t.admin.faitBanni)
                  }
                >
                  {t.admin.bannirConfirmer}
                </button>
              )}
              <button
                type="button"
                className="btn btn-ligne"
                disabled={action === 'envoi'}
                onClick={() =>
                  void agir(
                    () => api.adminRevoquerSessions(detail.utilisateur.id),
                    t.admin.faitSessions,
                  )
                }
              >
                {t.admin.revoquer}
              </button>
            </div>
          </div>

          <div className="admin-danger">
            <h3>{t.admin.supprimerTitre}</h3>
            <p className="corps">{t.admin.supprimerAide}</p>
            <label htmlFor="admin-confirmation">{detail.utilisateur.email}</label>
            <input
              id="admin-confirmation"
              type="text"
              className="form-champ"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ligne admin-btn-danger"
              disabled={action === 'envoi' || confirmation.trim().toLowerCase() !== detail.utilisateur.email}
              onClick={() =>
                void agir(
                  () => api.adminSupprimer(detail.utilisateur.id, confirmation),
                  t.admin.faitSupprime,
                )
              }
            >
              {t.admin.supprimerConfirmer}
            </button>
          </div>
        </section>
      )}

      <section className="admin-journal" aria-labelledby="admin-journal-titre">
        <h2 id="admin-journal-titre">{t.admin.journalTitre}</h2>
        {journal.length === 0 ? (
          <p className="corps">{t.admin.journalVide}</p>
        ) : (
          <ul className="admin-journal-liste">
            {journal.map((e) => (
              <li key={e.id}>
                <strong>{e.action}</strong> · {e.cible} ·{' '}
                <span>{dateLisible(e.le, lang, t.admin.jamais)}</span> · {e.par}
                {e.motif ? ` — ${e.motif}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};
