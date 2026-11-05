import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../app/prefs';
import { EtatChargement, EtatVide, EtatErreur } from '../components/ui/Primitives';
import * as api from '../services/api';
import type { Conversation } from '../services/types';

/**
 * Historique — toutes les conversations persistées du compte, avec
 * recherche, ouverture et suppression. Données serveur (API v1) ;
 * plus de silo localStorage comme source de vérité.
 */
export const HistoriquePage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const rafraichir = useCallback(async (q?: string) => {
    const r = await api.listerConversations({ q });
    if (r.ok) setConversations(r.donnees.conversations);
    else setErreur(r.erreur);
    setChargement(false);
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  useEffect(() => {
    const timer = setTimeout(() => void rafraichir(recherche || undefined), 250);
    return () => clearTimeout(timer);
  }, [recherche, rafraichir]);

  return (
    <div className="page-module">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.historiqueNav}</h1>
          <p className="page-module-sous">{t.historique.sous}</p>
        </div>
        <button
          type="button"
          className="btn-principal"
          onClick={() => navigate('/chat', { state: { nouveau: true } })}
        >
          <i className="fa-solid fa-plus" /> {t.ws.nouvelleConv}
        </button>
      </header>

      <input
        type="search"
        className="champ champ-recherche"
        placeholder={t.historique.recherchePlaceholder}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        aria-label={t.historique.recherchePlaceholder}
      />

      {erreur && <EtatErreur message={erreur} />}

      {chargement ? (
        <EtatChargement />
      ) : conversations.length === 0 ? (
        <EtatVide
          icone="fa-clock-rotate-left"
          titre={t.historique.vide}
          action={
            <button
              type="button"
              className="btn-principal"
              onClick={() => navigate('/chat', { state: { nouveau: true } })}
            >
              {t.ws.nouvelleConv}
            </button>
          }
        />
      ) : (
        <div className="liste-simple">
          {conversations.map((c) => (
            <div key={c.id} className="ligne-simple">
              <Link to={`/chat/${c.id}`} className="ligne-ouvrir">
                <i className="fa-solid fa-comment-dots" />
                <strong>{c.titre}</strong>
                <em>
                  {new Date(c.maj).toLocaleDateString()} · {new Date(c.maj).toLocaleTimeString()}
                </em>
              </Link>
              <button
                type="button"
                className="btn-danger-simple"
                aria-label={t.historique.supprimer}
                onClick={async () => {
                  if (!window.confirm(t.ws.supprimerConfirme)) return;
                  await api.supprimerConversation(c.id);
                  void rafraichir();
                }}
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
