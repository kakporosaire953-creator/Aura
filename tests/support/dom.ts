/**
 * Banc de test DOM (mission 09).
 *
 * Un vrai `window`, un vrai `document`, un vrai routeur : c'est jsdom, pas un
 * navigateur. Cela exécute réellement React, les gestionnaires d'événements,
 * le routage et les appels réseau (bouchonnés) — mais ne prouve rien sur le
 * CSS, la police, le focus visible ou la CSP appliquée par un moteur de rendu.
 *
 * Ce fichier ne définit aucun test : il fournit le banc.
 */
import { JSDOM } from 'jsdom';

type Root = { render: (el: unknown) => void; unmount: () => void };

let dom: JSDOM | null = null;
let racine: Root | null = null;
let hote: HTMLElement | null = null;

/** Installe un navigateur simulé. À appeler AVANT d'importer un composant. */
export function installerNavigateur(url = 'https://aura.test/'): JSDOM {
  dom = new JSDOM('<!doctype html><html lang="fr"><body><div id="racine"></div></body></html>', {
    url,
    pretendToBeVisual: true,
  });

  const w = dom.window as unknown as Window & typeof globalThis;
  // `navigator` (entre autres) n'est qu'un getter sur globalThis en Node 22 :
  // on redéfinit proprement au lieu d'assigner.
  const poser = (nom: string, valeur: unknown) =>
    Object.defineProperty(globalThis, nom, { value: valeur, configurable: true, writable: true });

  poser('window', w);
  poser('document', w.document);
  poser('navigator', w.navigator);
  poser('HTMLElement', w.HTMLElement);
  poser('HTMLInputElement', w.HTMLInputElement);
  poser('Element', w.Element);
  poser('Node', w.Node);
  poser('Event', w.Event);
  poser('CustomEvent', w.CustomEvent);
  poser('MouseEvent', w.MouseEvent);
  poser('KeyboardEvent', w.KeyboardEvent);
  poser('getComputedStyle', w.getComputedStyle.bind(w));
  poser('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number,
  );
  poser('cancelAnimationFrame', (id: number) => clearTimeout(id));
  poser('IS_REACT_ACT_ENVIRONMENT', true);
  // jsdom n'implémente ni matchMedia ni scrollTo : on fournit le minimum
  // qu'utilisent réellement les composants (préférences réduites = false).
  const w2 = w as unknown as Record<string, unknown>;
  w2.matchMedia = (requete: string) => ({
    matches: false,
    media: requete,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
  w2.scrollTo = () => {};
  w2.scrollIntoView = () => {};



  return dom;
}

/** Change l'URL du navigateur simulé (sans rechargement), comme `replaceState`. */
export function reinitialiserUrl(url: string): void {
  if (!dom) throw new Error('Navigateur simulé non installé.');
  dom.window.history.replaceState(null, '', url);
}

/** Monte un composant React dans le document simulé. */
export async function monter(element: unknown): Promise<void> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  hote = document.getElementById('racine') as HTMLElement;
  racine = createRoot(hote) as unknown as Root;
  await React.act(async () => {
    racine!.render(element as never);
  });
}

/** Démonte le composant courant et vide le document. */
export async function demonter(): Promise<void> {
  const React = await import('react');
  if (racine) {
    await React.act(async () => {
      racine!.unmount();
    });
  }
  racine = null;
  if (hote) hote.innerHTML = '';
}

/** Saisit une valeur comme le ferait un utilisateur (événement `input`). */
export async function saisir(selecteur: string, valeur: string): Promise<void> {
  const React = await import('react');
  const el = document.querySelector(selecteur) as HTMLInputElement | null;
  if (!el) throw new Error(`Champ introuvable : ${selecteur}`);
  const setter = Object.getOwnPropertyDescriptor(
    dom!.window.HTMLInputElement.prototype,
    'value',
  )!.set!;
  await React.act(async () => {
    setter.call(el, valeur);
    el.dispatchEvent(new dom!.window.Event('input', { bubbles: true }));
  });
}

/** Envoie un formulaire (équivalent d'un clic sur « Envoyer »). */
export async function soumettre(selecteur = 'form'): Promise<void> {
  const React = await import('react');
  const form = document.querySelector(selecteur) as HTMLFormElement | null;
  if (!form) throw new Error(`Formulaire introuvable : ${selecteur}`);
  await React.act(async () => {
    form.dispatchEvent(new dom!.window.Event('submit', { bubbles: true, cancelable: true }));
  });
}

/** Clique sur un élément (bouton, lien), comme un utilisateur. */
export async function cliquer(selecteur: string): Promise<void> {
  const React = await import('react');
  const el = document.querySelector(selecteur) as HTMLElement | null;
  if (!el) throw new Error(`Élément introuvable : ${selecteur}`);
  await React.act(async () => {
    el.dispatchEvent(new dom!.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/** Attend qu'une condition devienne vraie (mises à jour asynchrones de React). */
export async function attendre(
  condition: () => boolean,
  message = 'condition non atteinte',
  timeout = 2000,
): Promise<void> {
  const React = await import('react');
  const fin = Date.now() + timeout;
  while (Date.now() < fin) {
    if (condition()) return;
    await React.act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
  throw new Error(message);
}

/** Texte visible du document (sans les espaces superflus). */
export function texte(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Ferme le navigateur simulé. */
export function fermerNavigateur(): void {
  dom?.window.close();
  dom = null;
}
