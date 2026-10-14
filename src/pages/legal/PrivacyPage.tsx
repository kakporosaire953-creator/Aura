import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const PrivacyPage: React.FC = () => {
  const toc = [
    { id: 'responsable', label: '1. Responsable de traitement' },
    { id: 'donnees', label: '2. Données collectées' },
    { id: 'finalites', label: '3. Finalités du traitement' },
    { id: 'base-legale', label: '4. Bases légales' },
    { id: 'ia-entrainement', label: '5. Utilisation de l’IA et non-entraînement' },
    { id: 'destinataires', label: '6. Destinataires et sous-traitants' },
    { id: 'durees', label: '7. Durée de conservation' },
    { id: 'securite', label: '8. Sécurité et chiffrement' },
    { id: 'droits', label: '9. Vos droits et exercice (Export, Effacement)' },
    { id: 'dpo', label: '10. Contact DPO et réclamations' },
  ];

  return (
    <LegalLayout
      title="Politique de Confidentialité & Données Personnelles"
      subtitle="Engagements d’Aura relatifs à la collecte loyale, au traitement sécurisé, à la portabilité et à l'exercice de vos droits."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="responsable" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Responsable du traitement
        </h2>
        <p>
          Le responsable du traitement des données personnelles collectées via la plateforme Aura est :
        </p>
        <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1 font-mono text-xs">
          <div>Éditeur : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Nom de l'entité / Société éditrice]</div>
          <div>Forme juridique : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Ex. SARL, SAS, Entreprise individuelle]</div>
          <div>Siège social : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Adresse complète, Ville, Pays]</div>
          <div>Immatriculation : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Numéro RCCM ou Registre national]</div>
          <div>Contact DPO / Référent Données : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : dpo@aura-platform.com]</div>
        </div>
      </section>

      <section id="donnees" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Données personnelles collectées
        </h2>
        <p>Aura ne collecte que les données strictement nécessaires au bon fonctionnement du service (minimisation des données) :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Données de compte</strong> : nom complet, adresse e-mail, rôle/activité, mot de passe haché par algorithme cryptographique <code>scrypt</code> (le mot de passe en clair n'est jamais stocké ni transmis).</li>
          <li><strong>Données d'utilisation et contenus</strong> : conversations de chat, requêtes de recherche sourcée, code web édité, projets créés, pièces jointes téléchargées dans la bibliothèque personnelle.</li>
          <li><strong>Données techniques de session</strong> : jeton de session chiffré/signé HMAC, adresse IP, journaux d'erreurs techniques, horodatages des requêtes et décompte des quotas consommés.</li>
          <li><strong>Préférences utilisateur</strong> : langue, thème d'affichage, préférences d'animations réduites et directives de personnalisation contextuelle.</li>
        </ul>
      </section>

      <section id="finalites" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Finalités du traitement
        </h2>
        <p>Vos données sont traitées pour :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fournir les services de génération de texte, de recherche web et de studio de code.</li>
          <li>Gérer l'authentification sécurisée et isoler vos projets par rapport à ceux d'autres utilisateurs.</li>
          <li>Appliquer et réinitialiser les plafonds de consommation du plan freemium.</li>
          <li>Assurer la sécurité de l'infrastructure, prévenir les abus et détecter les tentatives d'intrusion.</li>
          <li>Vous envoyer des notifications opérationnelles relatives à la sécurité de votre compte.</li>
        </ul>
      </section>

      <section id="base-legale" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Bases légales des traitements
        </h2>
        <p>
          Les traitements reposent soit sur <strong>l’exécution du contrat de service</strong> (fourniture de la plateforme et des fonctionnalités demandées), soit sur <strong>le consentement explicite</strong> recueilli lors de l’inscription pour les communications facultatives, soit sur <strong>l’intérêt légitime</strong> de l’éditeur pour la sécurisation de son infrastructure.
        </p>
      </section>

      <section id="ia-entrainement" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Engagement strict : aucun entraînement sur vos données privées
        </h2>
        <div className="p-4 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/30 text-xs text-[#14282D] dark:text-[#F3F2EC] space-y-1.5">
          <span className="font-bold text-[#078348] dark:text-[#8CCB4A] block">
            Clause de non-entraînement de modèles tiers
          </span>
          <p className="leading-relaxed">
            Aura fait appel aux API professionnelles de fournisseurs d'IA (notamment Google Gemini via <code>@google/genai</code>). Dans le cadre de ces accords API d'entreprise, les requêtes privées de vos conversations et vos codes sources <strong>ne sont pas utilisés pour entraîner ou affiner des modèles d’IA publics</strong>.
          </p>
        </div>
      </section>

      <section id="destinataires" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Destinataires et sous-traitants techniques
        </h2>
        <p>
          Vos données ne sont ni vendues, ni louées, ni cédées à des tiers à des fins publicitaires. Elles ne sont transmises qu'aux sous-traitants techniques strictement indispensables :
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Hébergement serveur &amp; CDN</strong> : Vercel Inc. (Déploiement Serverless et hébergement Edge).</li>
          <li><strong>Base de données relationnelle</strong> : Supabase Inc. (PostgreSQL managé avec chiffrement des données au repos).</li>
          <li><strong>Moteur d’inférence d’intelligence artificielle</strong> : Google Cloud Platform / Google AI Studio (API Gemini).</li>
          <li><strong>Passerelles de paiement prévues</strong> : FedaPay, Kkiapay (Afrique de l'Ouest) ou Stripe. Aucune donnée bancaire n'est stockée sur nos serveurs.</li>
        </ul>
      </section>

      <section id="durees" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          7. Durée de conservation
        </h2>
        <p>
          Dans le cadre de l’offre Aura Free, l'historique des discussions est conservé pendant une durée indicative de <strong>30 jours</strong>, sous réserve de la capacité de stockage. Les données de compte et les projets enregistrés dans Aura Projects sont conservés tant que votre compte reste actif, ou jusqu'à ce que vous déclenchiez vous-même leur suppression.
        </p>
      </section>

      <section id="securite" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          8. Sécurité et chiffrement
        </h2>
        <p>
          Toutes les communications entre votre navigateur et les serveurs d’Aura sont chiffrées de bout en bout via le protocole sécurisé <strong>HTTPS / TLS 1.3</strong>. Les mots de passe sont protégés par un hachage unidirectionnel irréversible avec sel aléatoire (<code>scrypt</code>). Les jetons de session sont signés par HMAC-SHA256.
        </p>
      </section>

      <section id="droits" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          9. Vos droits et leur exercice (Portabilité &amp; Effacement)
        </h2>
        <p>
          Conformément aux réglementations applicables en matière de protection des données personnelles (notamment le Livre V du Code du numérique en République du Bénin et les standards internationaux de type RGPD), vous disposez des droits suivants :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Droit d'accès et de rectification</strong> : modifiez votre nom, e-mail et préférences directement dans <em>Paramètres &gt; Compte</em>.</li>
          <li><strong>Droit à la portabilité des données</strong> : téléchargez une copie complète au format JSON de toutes vos données depuis <em>Paramètres &gt; Confidentialité &gt; Exporter en JSON</em>.</li>
          <li><strong>Droit à l'effacement (« Droit à l'oubli »)</strong> : videz votre historique ou supprimez définitivement votre compte depuis <em>Paramètres &gt; Confidentialité &gt; Supprimer mon compte</em>. Cette action détruit immédiatement vos données sur le serveur.</li>
        </ul>
      </section>

      <section id="dpo" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          10. Contact DPO et réclamations
        </h2>
        <p>
          Pour toute question concernant le traitement de vos données ou pour faire valoir vos droits, vous pouvez contacter notre référent données personnelles à l'adresse suivante : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : dpo@aura-platform.com ou privacy@aura-platform.com].
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous disposez de la faculté d'introduire une réclamation auprès de l'autorité nationale de protection des données compétente [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : APDP Bénin - Autorité de Protection des Données Personnelles / Autorité compétente selon votre juridiction].
        </p>
      </section>
    </LegalLayout>
  );
};
