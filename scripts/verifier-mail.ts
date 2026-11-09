/**
 * Vérification réelle de l'envoi d'e-mails — diagnostic pour l'exploitant.
 *
 *   node --import tsx scripts/verifier-mail.ts destinataire@exemple.tld
 *
 * Le script utilise EXACTEMENT le même code que le serveur
 * (`server/mail/adaptateur.ts`) : il ne duplique aucune règle. Il affiche la
 * configuration effective (sans jamais montrer la clé), tente un envoi réel,
 * et traduit le refus du fournisseur en cause probable.
 *
 * Aucun secret n'est affiché. L'adresse du destinataire n'apparaît que
 * masquée. Un seul message est envoyé.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// .env éventuel, comme les scripts npm du projet.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const brut = readFileSync(path.join(racine, '.env'), 'utf8');
  for (const ligne of brut.split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {
  /* pas de .env — variables d'environnement système */
}

const { configurationMail, envoyer, originePublique } = await import('../server/mail/adaptateur');

const destination = (process.argv[2] ?? '').trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destination)) {
  console.log('Usage : node --import tsx scripts/verifier-mail.ts destinataire@exemple.tld');
  process.exit(1);
}

function masquer(adresse: string): string {
  const [local, domaine] = adresse.split('@');
  const debut = local.slice(0, 2);
  return `${debut}${'•'.repeat(Math.max(1, local.length - 2))}@${domaine}`;
}

function domaineDe(expediteur: string): string {
  const m = expediteur.match(/@([^@>\s]+)/);
  return m ? m[1] : '(illisible)';
}

console.log('── Configuration lue sur cet environnement ──');
const etat = configurationMail();
if (!etat.ok) {
  console.log(`✗ Configuration incomplète : ${etat.raison}`);
  console.log('');
  console.log('Variables attendues (voir .env.example) :');
  console.log('  AURA_MAIL_PROVIDER=resend');
  console.log('  AURA_MAIL_API_KEY=<clé du fournisseur>');
  console.log('  AURA_MAIL_FROM="AURA <bonjour@votredomaine.tld>"');
  console.log('  AURA_PUBLIC_ORIGIN=https://votre-domaine-public');
  process.exit(1);
}

const { config } = etat;
console.log(`  fournisseur     : ${config.fournisseur}`);
console.log(`  clé             : présente (${config.cle.length} caractères, jamais affichée)`);
console.log(`  expéditeur      : ${config.expediteur}`);
console.log(`  domaine d'envoi : ${domaineDe(config.expediteur)}`);
console.log(`  réponse à       : ${config.reponse ?? '(non défini)'}`);
console.log(`  origine liens   : ${originePublique()}`);
console.log(`  point d'entrée  : ${config.base}`);
console.log(`  délai           : ${config.delaiMs} ms`);
console.log(`  destinataire    : ${masquer(destination)}`);
console.log('');

console.log('── Envoi réel ──');
const debut = Date.now();
const resultat = await envoyer({
  a: destination,
  sujet: 'Aura — test d’envoi',
  texte:
    "Ce message confirme que l'envoi d'e-mails fonctionne sur cet environnement. " +
    "Vous pouvez fermer ce message. Aucune action n'est requise.",
  html:
    '<p>Ce message confirme que l’envoi d’e-mails fonctionne sur cet environnement.</p>' +
    "<p>Vous pouvez fermer ce message. Aucune action n'est requise.</p>",
});
const duree = Date.now() - debut;
console.log(`  durée : ${duree} ms`);
console.log('');

if (resultat.ok) {
  console.log('✓ Accepté par le fournisseur.');
  console.log('  Vérifiez la boîte de réception (et les indésirables) du destinataire.');
  console.log('  Preuve d’envoi : tableau de bord du fournisseur, statut « Delivered ».');
  process.exit(0);
}

console.log(`✗ Envoi refusé — code ${resultat.code}${resultat.statut ? `, HTTP ${resultat.statut}` : ''}`);
console.log('');
console.log('Cause probable :');
if (resultat.code === 'mail-indisponible') {
  console.log('  La configuration est incomplète (voir la liste ci-dessus).');
} else if (resultat.statut === 401 || resultat.statut === 403) {
  console.log('  Le fournisseur refuse l’authentification ou l’expéditeur :');
  console.log('    · la clé API est-elle valide et active sur ce compte ?');
  console.log('    · le domaine de l’expéditeur est-il VÉRIFIÉ chez le fournisseur ?');
  console.log('    · avec un expéditeur de test (« onboarding@resend.dev »), les');
  console.log('      messages ne partent que vers l’adresse du titulaire du compte.');
  console.log('    · le destinataire est-il autorisé par le plan du fournisseur ?');
} else if (resultat.statut === 422) {
  console.log('  Requête refusée : expéditeur mal formé ou champ invalide.');
  console.log('  Format attendu : « AURA <bonjour@votredomaine.tld> ».');
} else if (resultat.statut === 429) {
  console.log('  Quota du fournisseur atteint (offre gratuite : 100 messages/jour).');
  console.log('  Attendez la réinitialisation ou augmentez l’offre.');
} else if (resultat.statut && resultat.statut >= 500) {
  console.log('  Panne côté fournisseur : réessayez plus tard.');
} else {
  console.log('  Fournisseur injoignable ou délai dépassé (réseau, pare-feu, DNS).');
}
console.log('');
console.log('Le message exact renvoyé par le fournisseur est journalisé juste au-dessus,');
console.log('avec les adresses remplacées par [adresse].');
process.exit(1);
