/**
 * Destination après connexion.
 *
 * Une route privée consultée sans session redirige vers `/login` en
 * conservant l'adresse demandée. Ce module décide si cette adresse est
 * réutilisable : uniquement un chemin interne, jamais une URL absolue ni un
 * protocole — une destination fournie par l'extérieur ne doit pas pouvoir
 * transformer la connexion en redirection ouverte.
 */
export const DESTINATION_ESPACE = '/app';

export function destinationApresConnexion(depuis: unknown, secours: string = DESTINATION_ESPACE): string {
  if (typeof depuis !== 'string') return secours;
  const adresse = depuis.trim();
  if (!adresse.startsWith('/')) return secours;
  // `//exemple.test` est une URL absolue déguisée, `/\exemple.test` aussi.
  if (adresse.startsWith('//') || adresse.startsWith('/\\')) return secours;
  // Revenir sur les pages d'authentification n'aurait aucun sens.
  if (adresse === '/login' || adresse.startsWith('/login?') || adresse.startsWith('/login/')) return secours;
  if (adresse === '/register' || adresse.startsWith('/register?') || adresse.startsWith('/register/')) {
    return secours;
  }
  return adresse;
}
