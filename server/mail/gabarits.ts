/**
 * Modèles d'e-mails AURA — français et anglais.
 *
 * Direction artistique respectée : ivoire, encre, lime. Mise en page en
 * tableaux et styles en ligne (les clients de messagerie n'appliquent pas
 * les feuilles de style externes), aucune image distante, aucun script.
 * Le nom du fournisseur d'envoi n'apparaît jamais.
 */
import type { MessageMail } from './adaptateur.js';

export type LangueMail = 'fr' | 'en';

const COULEURS = {
  ivoire: '#FBFAF5',
  encre: '#12211B',
  lime: '#A5E838',
  vert: '#43BC2C',
  gris: '#5A6B62',
  ligne: '#E2E0D6',
};

export function langueDepuis(valeur: unknown, secours: LangueMail = 'fr'): LangueMail {
  return valeur === 'en' ? 'en' : valeur === 'fr' ? 'fr' : secours;
}

function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Structure = {
  nom: string;
  lien: string;
  langue: LangueMail;
  titre: string;
  intro: string;
  bouton: string;
  duree: string;
  oubli: string;
  repli: string;
  pied: string;
  preheader: string;
};

function enveloppe(s: Structure): string {
  const prenom = s.nom.trim() ? echapper(s.nom.trim()) : '';
  const salutation = prenom
    ? s.langue === 'en'
      ? `Hello ${prenom},`
      : `Bonjour ${prenom},`
    : s.langue === 'en'
      ? 'Hello,'
      : 'Bonjour,';

  return `<!doctype html>
<html lang="${s.langue}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(s.titre)}</title></head>
<body style="margin:0;padding:0;background:${COULEURS.ivoire};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(s.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COULEURS.ivoire};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${COULEURS.ligne};border-radius:16px;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:.34em;font-weight:700;color:${COULEURS.encre};text-transform:uppercase;">AURA</div>
      </td></tr>
      <tr><td style="padding:22px 32px 0;">
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${COULEURS.encre};font-weight:600;">${echapper(s.titre)}</h1>
      </td></tr>
      <tr><td style="padding:16px 32px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${COULEURS.encre};">
        <p style="margin:0 0 12px;">${salutation}</p>
        <p style="margin:0 0 20px;">${echapper(s.intro)}</p>
      </td></tr>
      <tr><td align="left" style="padding:0 32px;">
        <a href="${echapper(s.lien)}" style="display:inline-block;background:${COULEURS.lime};color:${COULEURS.encre};text-decoration:none;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 26px;border-radius:999px;">${echapper(s.bouton)}</a>
      </td></tr>
      <tr><td style="padding:20px 32px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${COULEURS.gris};">
        <p style="margin:0 0 10px;">${echapper(s.duree)}</p>
        <p style="margin:0 0 10px;word-break:break-all;">${echapper(s.repli)}<br><span style="color:${COULEURS.encre};">${echapper(s.lien)}</span></p>
      </td></tr>
      <tr><td style="padding:22px 32px 0;">
        <div style="border-top:1px solid ${COULEURS.ligne};padding-top:16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${COULEURS.gris};">
          <p style="margin:0 0 8px;">${echapper(s.oubli)}</p>
          <p style="margin:0;color:${COULEURS.vert};font-weight:600;">${echapper(s.pied)}</p>
        </div>
      </td></tr>
      <tr><td style="padding:18px 32px 28px;"></td></tr>
    </table>
    <div style="max-width:520px;padding:14px 8px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${COULEURS.gris};text-align:center;">
      AURA — ${s.langue === 'en' ? 'From idea to result.' : "De l'idée au résultat."}
    </div>
  </td></tr>
</table>
</body>
</html>`;
}

export function gabaritVerification(opts: {
  nom: string;
  lien: string;
  dureeHeures: number;
  langue: LangueMail;
}): MessageMail {
  const fr = opts.langue === 'fr';
  const structure: Structure = {
    nom: opts.nom,
    lien: opts.lien,
    langue: opts.langue,
    titre: fr ? 'Confirmez votre adresse' : 'Confirm your address',
    intro: fr
      ? "Une adresse confirmée, c'est un compte que vous seul pouvez récupérer. Ce lien valide votre adresse pour AURA."
      : 'A confirmed address means an account only you can recover. This link validates your address for AURA.',
    bouton: fr ? 'Confirmer mon adresse' : 'Confirm my address',
    duree: fr
      ? `Ce lien est valable ${opts.dureeHeures} heures et ne peut servir qu'une fois.`
      : `This link is valid for ${opts.dureeHeures} hours and can be used only once.`,
    oubli: fr
      ? "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre adresse ne sera pas confirmée."
      : 'If you did not request this, ignore this email: your address will not be confirmed.',
    repli: fr ? 'Si le bouton ne fonctionne pas, ouvrez ce lien :' : 'If the button does not work, open this link:',
    pied: fr ? "De l'idée au résultat." : 'From idea to result.',
    preheader: fr ? 'Confirmez votre adresse AURA.' : 'Confirm your AURA address.',
  };

  const texte = fr
    ? `AURA — Confirmez votre adresse\n\n${structure.intro}\n\n${structure.bouton} : ${opts.lien}\n\n${structure.duree}\n\n${structure.oubli}\n\nAURA — De l'idée au résultat.`
    : `AURA — Confirm your address\n\n${structure.intro}\n\n${structure.bouton}: ${opts.lien}\n\n${structure.duree}\n\n${structure.oubli}\n\nAURA — From idea to result.`;

  return { a: '', sujet: fr ? 'Confirmez votre adresse AURA' : 'Confirm your AURA address', texte, html: enveloppe(structure) };
}

export function gabaritReinitialisation(opts: {
  nom: string;
  lien: string;
  dureeMinutes: number;
  langue: LangueMail;
}): MessageMail {
  const fr = opts.langue === 'fr';
  const structure: Structure = {
    nom: opts.nom,
    lien: opts.lien,
    langue: opts.langue,
    titre: fr ? 'Réinitialisez votre mot de passe' : 'Reset your password',
    intro: fr
      ? 'Vous avez demandé à choisir un nouveau mot de passe pour votre compte AURA. Le lien ci-dessous ouvre la page de réinitialisation.'
      : 'You asked to choose a new password for your AURA account. The link below opens the reset page.',
    bouton: fr ? 'Choisir un nouveau mot de passe' : 'Choose a new password',
    duree: fr
      ? `Ce lien est valable ${opts.dureeMinutes} minutes et ne peut servir qu'une fois. Toutes les sessions ouvertes seront fermées après le changement.`
      : `This link is valid for ${opts.dureeMinutes} minutes and can be used only once. All open sessions will be closed after the change.`,
    oubli: fr
      ? "Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe reste inchangé et aucune session n'est fermée."
      : 'If you did not ask for this, ignore this email: your password stays unchanged and no session is closed.',
    repli: fr ? 'Si le bouton ne fonctionne pas, ouvrez ce lien :' : 'If the button does not work, open this link:',
    pied: fr ? "De l'idée au résultat." : 'From idea to result.',
    preheader: fr ? 'Choisissez un nouveau mot de passe AURA.' : 'Choose a new AURA password.',
  };

  const texte = fr
    ? `AURA — Réinitialisez votre mot de passe\n\n${structure.intro}\n\n${structure.bouton} : ${opts.lien}\n\n${structure.duree}\n\n${structure.oubli}\n\nAURA — De l'idée au résultat.`
    : `AURA — Reset your password\n\n${structure.intro}\n\n${structure.bouton}: ${opts.lien}\n\n${structure.duree}\n\n${structure.oubli}\n\nAURA — From idea to result.`;

  return {
    a: '',
    sujet: fr ? 'Réinitialisez votre mot de passe AURA' : 'Reset your AURA password',
    texte,
    html: enveloppe(structure),
  };
}
