import React, { useState } from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const LegalContactPage: React.FC = () => {
  const [subject, setSubject] = useState<'privacy' | 'abuse' | 'ip' | 'contract'>('privacy');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const toc = [
    { id: 'canaux-officiels', label: '1. Canaux officiels de contact' },
    { id: 'dpo', label: '2. Exercice des droits personnels (RGPD & Confidentialité)' },
    { id: 'signalement-abus', label: '3. Signalement d’abus et contenus illicites' },
    { id: 'securite-vulnerabilites', label: '4. Divulgation responsable de vulnérabilités' },
    { id: 'delais', label: '5. Délais de traitement et accusés de réception' },
    { id: 'formulaire', label: '6. Formulaire de contact direct' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim() || !senderEmail.includes('@') || !message.trim()) {
      setStatus({
        type: 'error',
        text: 'Veuillez saisir une adresse e-mail valide et détailler votre demande.',
      });
      return;
    }

    // Direct mailto generation for authentic, transparent submission without fake ticketing
    const targetEmail =
      subject === 'privacy'
        ? 'privacy@aura-platform.com'
        : subject === 'abuse'
        ? 'abuse@aura-platform.com'
        : subject === 'ip'
        ? 'legal@aura-platform.com'
        : 'contact@aura-platform.com';

    const mailtoSubject = encodeURIComponent(`[Demande Juridique Aura - ${subject.toUpperCase()}] ${senderName || 'Utilisateur'}`);
    const mailtoBody = encodeURIComponent(
      `Nom / Raison sociale : ${senderName}\nEmail de contact : ${senderEmail}\nObjet : ${subject}\n\nMessage :\n${message}`
    );

    setStatus({
      type: 'success',
      text: `Votre demande est prête. Cliquez ci-dessous si votre client de messagerie ne s'est pas ouvert automatiquement pour envoyer à ${targetEmail}.`,
    });

    window.location.href = `mailto:${targetEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  return (
    <LegalLayout
      title="Contact Juridique, DPO & Signalements"
      subtitle="Canaux surveillés pour l'exercice de vos droits, les signalements d'abus et les échanges juridiques officiels."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="canaux-officiels" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Canaux officiels de contact
        </h2>
        <p>
          Pour garantir un traitement rigoureux et prioritaire de chaque sollicitation, le pôle juridique et déontologique d’Aura met à disposition des adresses dédiées, relevées et surveillées par nos équipes spécialisées :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1.5">
            <div className="font-bold text-[#078348] dark:text-[#8CCB4A] flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-xs" />
              <span>Délégué aux Données (DPO)</span>
            </div>
            <p className="text-[#5A6562] dark:text-[#94A09E] text-xs">
              Exercice des droits d'accès, d'exportation, de rectification ou d'effacement définitif de compte.
            </p>
            <div className="font-mono text-xs font-semibold pt-1 text-[#14282D] dark:text-[#F3F2EC]">
              [À COMPLÉTER : dpo@aura-platform.com]
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1.5">
            <div className="font-bold text-[#FF790D] flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-xs" />
              <span>Signalement Abus & Garde-fous</span>
            </div>
            <p className="text-[#5A6562] dark:text-[#94A09E] text-xs">
              Notification de contenus contraires à la politique d'utilisation acceptable, menaces ou atteintes aux mineurs.
            </p>
            <div className="font-mono text-xs font-semibold pt-1 text-[#14282D] dark:text-[#F3F2EC]">
              [À COMPLÉTER : abuse@aura-platform.com]
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1.5">
            <div className="font-bold text-[#2563EB] flex items-center gap-2">
              <i className="fa-solid fa-copyright text-xs" />
              <span>Propriété Intellectuelle (DMCA)</span>
            </div>
            <p className="text-[#5A6562] dark:text-[#94A09E] text-xs">
              Revendication de droits d'auteur, signalements de contrefaçon de code ou d'œuvres protégées.
            </p>
            <div className="font-mono text-xs font-semibold pt-1 text-[#14282D] dark:text-[#F3F2EC]">
              [À COMPLÉTER : legal@aura-platform.com]
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1.5">
            <div className="font-bold text-[#7C3AED] flex items-center gap-2">
              <i className="fa-solid fa-lock text-xs" />
              <span>Sécurité & Vulnérabilités</span>
            </div>
            <p className="text-[#5A6562] dark:text-[#94A09E] text-xs">
              Rapports techniques de sécurité et divulgation responsable de vulnérabilités.
            </p>
            <div className="font-mono text-xs font-semibold pt-1 text-[#14282D] dark:text-[#F3F2EC]">
              [À COMPLÉTER : security@aura-platform.com]
            </div>
          </div>
        </div>
      </section>

      <section id="dpo" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Exercice des droits personnels (RGPD &amp; Confidentialité)
        </h2>
        <p>
          Vous bénéficiez à tout moment de la possibilité d’exercer vos droits fondamentaux garantis par la réglementation :
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Droit d'accès et de portabilité :</strong> vous pouvez directement exporter l'intégralité de vos données au format JSON structuré depuis la rubrique <a href="/app/settings" className="text-[#078348] dark:text-[#8CCB4A] underline font-medium">Paramètres &gt; Confidentialité &amp; Données</a>.</li>
          <li><strong>Droit à l'effacement (« Droit à l'oubli ») :</strong> vous pouvez supprimer l'historique complet de vos conversations ou engager la suppression définitive et irréversible de votre compte directement en ligne, sans intervention humaine obligatoire.</li>
          <li><strong>Droit d'opposition et de rectification :</strong> pour toute demande particulière non automatisée, transmettez votre justificatif d'identité au DPO.</li>
        </ul>
      </section>

      <section id="signalement-abus" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Signalement d’abus et contenus illicites
        </h2>
        <p>
          En cas d’urgence absolue (menace imminente contre l'intégrité d'une personne, exploitation sexuelle de mineurs, incitation directe à des actes terroristes), toute communication transmise à notre cellule d'alerte fait l'objet d'un examen immédiat par nos équipes d'astreinte, d'un blocage conservatoire immédiat et d'un signalement aux autorités judiciaires compétentes.
        </p>
      </section>

      <section id="securite-vulnerabilites" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Divulgation responsable de vulnérabilités
        </h2>
        <p>
          Aura encourage les chercheurs en cybersécurité à nous signaler toute faiblesse technique identifiée dans le cadre d'une démarche responsable (<em>coordinated vulnerability disclosure</em>). Nous nous engageons à ne pas engager de poursuites judiciaires à l'encontre des chercheurs agissant de bonne foi, sans altération de données de production ni déni de service.
        </p>
      </section>

      <section id="delais" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Délais de traitement et accusés de réception
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Signalements d'abus critiques :</strong> prise en charge sous 4 heures ouvrées.</li>
          <li><strong>Signalements de sécurité et vulnérabilités :</strong> accusé de réception sous 24 heures ouvrées.</li>
          <li><strong>Demandes DPO / Droits des personnes :</strong> réponse sous un mois calendaire maximum.</li>
          <li><strong>Questions contractuelles générales :</strong> réponse sous 48 à 72 heures ouvrées.</li>
        </ul>
      </section>

      <section id="formulaire" className="space-y-4 pt-2">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Formulaire de contact direct
        </h2>
        <p className="text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E]">
          Ce formulaire prépare votre transmission vers les canaux officiels monitorés d’Aura. Aucune donnée n'est stockée dans un outil de télémesure non consenti.
        </p>

        {status && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] border border-[#078348]/25'
                : 'bg-[#FEF2F2] dark:bg-[#2C1517] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FECACA]'
            }`}
          >
            <i className={`fa-solid ${status.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#FFFDF9] dark:bg-[#152023] p-5 sm:p-6 rounded-2xl border border-[#EAE6DC] dark:border-[#243337]">
          <div>
            <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
              Nature de la demande juridique
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as any)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FAF8F2] dark:bg-[#10181A] text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#078348]"
            >
              <option value="privacy">DPO &amp; Protection des Données Personnelles (RGPD)</option>
              <option value="abuse">Signalement d’Abus ou Contenu Inapproprié</option>
              <option value="ip">Propriété Intellectuelle &amp; Droit d’auteur (DMCA)</option>
              <option value="contract">Question Contractuelle ou Partenariat</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                Nom complet ou organisme
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex. Jane Doe / Société XYZ"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FAF8F2] dark:bg-[#10181A] text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#078348]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                Adresse e-mail de réponse *
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="votre.email@domaine.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FAF8F2] dark:bg-[#10181A] text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#078348]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
              Détails de la demande ou description des faits *
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Veuillez décrire précisément les faits, URLs concernées, dates ou références requises pour instruire votre dossier..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E0DBD0] dark:border-[#2B3A3E] bg-[#FAF8F2] dark:bg-[#10181A] text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#078348]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#77817F]">
              * Champs obligatoires pour instruction légale.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#078348] hover:bg-[#066f3d] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <i className="fa-regular fa-paper-plane text-xs" />
              <span>Transmettre aux juristes Aura</span>
            </button>
          </div>
        </form>
      </section>
    </LegalLayout>
  );
};
