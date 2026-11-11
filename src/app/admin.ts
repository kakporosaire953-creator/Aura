/**
 * L'utilisateur courant est-il administrateur ?
 *
 * Sert uniquement à **masquer** un lien : la décision d'accès reste au
 * serveur (`AURA_ADMIN_EMAILS`), revérifiée à chaque appel. Un faux positif
 * ici n'ouvrirait donc rien — il afficherait un lien menant à un refus.
 */
import { useEffect, useState } from 'react';
import { adminEtat } from '../services/api';

export function useAdmin(): boolean {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let vivant = true;
    void adminEtat().then((r) => {
      if (vivant && r.ok) setAdmin(r.donnees.admin === true);
    });
    return () => {
      vivant = false;
    };
  }, []);

  return admin;
}
