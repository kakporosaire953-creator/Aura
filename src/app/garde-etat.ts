/**
 * Décision de la garde des routes privées — logique pure, testable sans
 * navigateur. `gardes.tsx` ne fait que traduire cette décision en rendu.
 *
 * Règle tenue : une panne n'est jamais une déconnexion. Seul un refus
 * explicite du serveur (401) redirige vers la connexion.
 */
export type StatutGarde = 'chargement' | 'anonyme' | 'connecte' | 'indisponible';

export type DecisionGarde = 'attente' | 'panne' | 'rediriger' | 'afficher';

export function decisionGarde(statut: StatutGarde): DecisionGarde {
  switch (statut) {
    case 'connecte':
      return 'afficher';
    case 'anonyme':
      return 'rediriger';
    case 'indisponible':
      return 'panne';
    case 'chargement':
    default:
      // Tant que la session n'est pas vérifiée, on attend : jamais de
      // redirection prématurée vers la connexion.
      return 'attente';
  }
}
