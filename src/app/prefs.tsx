import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CONTENT, Lang, Theme, Content } from './dictionaries';

const CLE_LANG = 'aura_lang';
const CLE_THEME = 'aura_theme';

interface Prefs {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: Content;
}

const PrefsContext = createContext<Prefs | null>(null);

function lireLang(): Lang {
  try {
    const v = localStorage.getItem(CLE_LANG);
    return v === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

function lireTheme(): Theme {
  try {
    const v = localStorage.getItem(CLE_THEME);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* stockage indisponible */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(lireLang);
  const [theme, setThemeState] = useState<Theme>(lireTheme);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = CONTENT[lang].title;
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Suit le système tant qu'aucun choix explicite n'a été fait
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystem = (e: MediaQueryListEvent) => {
      let choix: string | null = null;
      try {
        choix = localStorage.getItem(CLE_THEME);
      } catch {
        /* ignoré */
      }
      if (!choix) setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onSystem);
    return () => mq.removeEventListener('change', onSystem);
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem(CLE_LANG, l);
        } catch {
          /* ignoré */
        }
      },
      theme,
      setTheme: (th) => {
        setThemeState(th);
        try {
          localStorage.setItem(CLE_THEME, th);
        } catch {
          /* ignoré */
        }
      },
      toggleTheme: () => {
        setThemeState((prev) => {
          const suivant: Theme = prev === 'dark' ? 'light' : 'dark';
          try {
            localStorage.setItem(CLE_THEME, suivant);
          } catch {
            /* ignoré */
          }
          return suivant;
        });
      },
      t: CONTENT[lang],
    }),
    [lang, theme],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
};

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs doit être utilisé dans PrefsProvider');
  return ctx;
}

/** Raccourci : le contenu traduit de la page. */
export function useT(): Content {
  return usePrefs().t;
}
