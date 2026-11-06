/**
 * Connecteurs de recherche — architecture indépendante du modèle de
 * génération. Un connecteur renvoie des sources RÉELLES (URLs extraites
 * d'un moteur), jamais des liens inventés par le modèle.
 *
 * Connecteurs :
 *  - `gemini-grounding` : grounding Google Search via l'API Gemini
 *    configurée. Les URLs proviennent des métadonnées de grounding.
 *
 * Sans connecteur disponible, l'API déclare la recherche indisponible et
 * l'interface n'affiche aucun résultat simulé.
 */
import { FournisseurGemini } from '../ai/gemini';

export type SourceReelle = { titre: string; url: string; extrait: string };
export type ResultatRecherche = {
  connecteur: string;
  synthese: string;
  sources: SourceReelle[];
  sansResultat: boolean;
};

export interface ConnecteurRecherche {
  readonly id: string;
  disponible(): Promise<{ ok: boolean; raison?: string }>;
  rechercher(question: string, opts: { langue: 'fr' | 'en' }): Promise<ResultatRecherche>;
}

class ConnecteurGeminiGrounding implements ConnecteurRecherche {
  readonly id = 'gemini-grounding';
  private readonly gemini = new FournisseurGemini();

  async disponible(): Promise<{ ok: boolean; raison?: string }> {
    return this.gemini.checkAvailability();
  }

  async rechercher(question: string, opts: { langue: 'fr' | 'en' }): Promise<ResultatRecherche> {
    const system =
      opts.langue === 'en'
        ? "You are Aura's research assistant. Answer using up-to-date information from web search results. Cite nothing that is not in the search results. If information is uncertain or time-sensitive, say so explicitly. Answer in the user's language."
        : "Tu es l'assistant de recherche d'Aura. Réponds à partir des résultats de recherche web à jour. Ne cite rien qui ne figure pas dans les résultats. Si une information est incertaine ou dépendante de la date, signale-le explicitement. Réponds dans la langue de l'utilisateur.";
    const { texte, sources } = await this.gemini.rechercherAvecSources(question, system);
    return {
      connecteur: this.id,
      synthese: texte,
      sources,
      sansResultat: sources.length === 0,
    };
  }
}

const connecteurs: ConnecteurRecherche[] = [new ConnecteurGeminiGrounding()];

export async function choisirConnecteur(): Promise<ConnecteurRecherche | null> {
  for (const c of connecteurs) {
    const d = await c.disponible();
    if (d.ok) return c;
  }
  return null;
}

export function listeConnecteurs(): Array<{ id: string }> {
  return connecteurs.map((c) => ({ id: c.id }));
}
