import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches, search } from '@codemirror/search';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface StudioCodeEditorProps {
  path: string;
  language: string;
  value: string;
  onChange: (next: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  dark?: boolean;
}

function languageExtension(path: string, language: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const lang = (language || ext).toLowerCase();
  if (ext === 'html' || ext === 'htm' || lang === 'html') return html({ selfClosingTags: true });
  if (ext === 'css' || lang === 'css') return css();
  if (ext === 'json' || lang === 'json') return json();
  if (ext === 'md' || lang === 'markdown') return markdown();
  if (ext === 'js' || ext === 'mjs' || lang === 'javascript') return javascript();
  if (ext === 'ts' || lang === 'typescript') return javascript({ typescript: true });
  return [];
}

/** Thème Aura : ivoire chaud / ardoise sombre, lisible, sobre. */
const auraHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#078348', fontWeight: '600' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#14282D' },
  { tag: [t.function(t.variableName), t.labelName], color: '#B45309' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#C2410C' },
  { tag: [t.definition(t.name), t.separator], color: '#14282D' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#0F766E' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#FF790D' },
  { tag: [t.meta, t.comment], color: '#8A9391', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.string, color: '#078348' },
  { tag: t.heading, fontWeight: '700', color: '#078348' },
  { tag: t.atom, color: '#C2410C' },
  { tag: t.bool, color: '#C2410C' },
  { tag: t.null, color: '#C2410C' },
]);

const baseEditorTheme = {
  '&': {
    height: '100%',
    fontSize: '12.5px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    padding: '12px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: 'rgba(7,131,72,0.05)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(7,131,72,0.16) !important',
  },
  '.cm-searchMatch': { backgroundColor: 'rgba(234,203,55,0.35)' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(255,121,13,0.35)' },
};

const auraTheme = EditorView.theme({
  ...baseEditorTheme,
  '&': { ...baseEditorTheme['&'], color: '#14282D' },
  '.cm-content': { ...baseEditorTheme['.cm-content'], caretColor: '#078348' },
  '.cm-gutters': { ...baseEditorTheme['.cm-gutters'], color: '#B4BCBA' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(7,131,72,0.06)', color: '#078348' },
  '.cm-cursor': { borderLeftColor: '#078348' },
});

const auraThemeDark = EditorView.theme({
  ...baseEditorTheme,
  '&': { ...baseEditorTheme['&'], color: '#F3F2EC' },
  '.cm-content': { ...baseEditorTheme['.cm-content'], caretColor: '#8CCB4A' },
  '.cm-gutters': { ...baseEditorTheme['.cm-gutters'], color: '#5B6664' },
  '.cm-activeLine': { backgroundColor: 'rgba(139,203,74,0.07)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(139,203,74,0.08)', color: '#8CCB4A' },
  '.cm-cursor': { borderLeftColor: '#8CCB4A' },
});

const auraHighlightDark = HighlightStyle.define([
  { tag: t.keyword, color: '#8CCB4A', fontWeight: '600' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#F3F2EC' },
  { tag: [t.function(t.variableName), t.labelName], color: '#F0B27A' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#FF790D' },
  { tag: [t.definition(t.name), t.separator], color: '#F3F2EC' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#7FD1C4' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#FF790D' },
  { tag: [t.meta, t.comment], color: '#77817F', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.string, color: '#8CCB4A' },
  { tag: t.heading, fontWeight: '700', color: '#8CCB4A' },
  { tag: t.atom, color: '#FF790D' },
  { tag: t.bool, color: '#FF790D' },
  { tag: t.null, color: '#FF790D' },
]);

export const StudioCodeEditor: React.FC<StudioCodeEditorProps> = ({
  path,
  language,
  value,
  onChange,
  onSave,
  readOnly = false,
  dark = false,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        bracketMatching(),
        highlightSelectionMatches(),
        search({ top: true }),
        syntaxHighlighting(dark ? auraHighlightDark : auraHighlight, { fallback: true }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        dark ? auraThemeDark : auraTheme,
        languageExtension(path, language),
        keymap.of([
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              onSaveRef.current?.();
              return true;
            },
          },
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate only when the edited file or theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, dark]);

  // Sync external value changes (file switch already remounts; keeps parity)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="h-full w-full overflow-hidden bg-transparent text-[#14282D] dark:text-[#F3F2EC]"
    />
  );
};
