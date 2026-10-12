import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching, defaultHighlightStyle, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState, Prec } from '@codemirror/state'
import { EditorView, drawSelection, highlightActiveLine, keymap, placeholder } from '@codemirror/view'
import { insertAttachments } from '../attachments/storage.js'
import { focusTracker, markdownStyles, renderedMarkdownField, yanaSyntax } from './decorations.js'
import { navigateTableCell } from './tableNavigation.js'
import { tableSourceEnterEffect, tableSourceModeEffect } from './tableMode.js'
import { runToolbarAction, insertBlockWithSelection } from './actions.js'

export function editorTheme() {
  return EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'transparent',
      color: 'var(--color-text)',
      fontSize: '15px',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
      lineHeight: '1.85',
      marginLeft: '-1px',
      paddingLeft: '1px',
      paddingBottom: '42px',
      width: 'calc(100% + 1px)',
    },
    '.cm-content': {
      minHeight: '100%',
      caretColor: 'var(--color-accent)',
      padding: '0',
    },
    '.cm-line': {
      padding: '0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-accent)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      display: 'none',
    },
    '.cm-placeholder': {
      color: 'var(--color-faint)',
    },
    '.cm-foldGutter': {
      display: 'none',
    },
  }, { dark: document.documentElement.dataset.theme === 'dark' })
}

function runToolbarShortcut(view, action) {
  const selection = view.state.selection
  window.setTimeout(() => {
    if (view.state.selection.eq(selection)) runToolbarAction(view, action)
  }, 0)
  return true
}

export function editorExtensions(onChange, onAttachmentStatus) {
  return [
    renderedMarkdownField,
    focusTracker,
    history(),
    drawSelection(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    highlightActiveLine(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    syntaxHighlighting(markdownStyles),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    yanaSyntax,
    placeholder('Enter your note'),
    editorTheme(),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': 'Markdown note content' }),
    EditorView.domEventHandlers({
      paste(view, event) {
        const files = [...(event.clipboardData?.files ?? [])]
        if (!files.length) return false
        event.preventDefault()
        insertAttachments(view, files, onAttachmentStatus, insertBlockWithSelection)
        return true
      },
      drop(view, event) {
        const files = [...(event.dataTransfer?.files ?? [])]
        if (!files.length) return false
        event.preventDefault()
        const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (position !== null) view.dispatch({ selection: { anchor: position } })
        insertAttachments(view, files, onAttachmentStatus, insertBlockWithSelection)
        return true
      },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString())
    }),
    keymap.of([
      { key: 'Mod-b', run: (view) => runToolbarShortcut(view, 'bold') },
      { key: 'Mod-i', run: (view) => runToolbarShortcut(view, 'italic') },
      { key: 'Mod-Shift-x', run: (view) => runToolbarShortcut(view, 'strike') },
      { key: 'Mod-k', run: (view) => runToolbarShortcut(view, 'link') },
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...markdownKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),
    Prec.highest(keymap.of([
      {
        key: 'Enter',
        run(view) {
          const { sourceTable, sourceTablePendingEnter } = view.state.field(renderedMarkdownField)
          if (!view.state.selection.main.empty) return false

          const cursorLine = view.state.doc.lineAt(view.state.selection.main.head)
          if (view.state.selection.main.head === cursorLine.to
            && /^([ \t]*)(?:[-*+]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?$/.test(cursorLine.text)) {
            view.dispatch({
              changes: { from: cursorLine.from, to: cursorLine.to },
              selection: { anchor: cursorLine.from },
            })
            return true
          }

          if (!sourceTable) return false
          if (
            sourceTablePendingEnter
            && cursorLine.text === ''
            && view.state.selection.main.head === sourceTable.to + 1
            && view.state.sliceDoc(sourceTable.to, sourceTable.to + 1) === '\n'
          ) {
            view.dispatch({
              changes: { from: sourceTable.to, to: sourceTable.to + 1 },
              selection: { anchor: sourceTable.to },
              effects: tableSourceModeEffect.of(null),
            })
            return true
          }

          const finalTableLine = view.state.doc.lineAt(sourceTable.to)
          if (
            cursorLine.number !== finalTableLine.number
            || view.state.selection.main.head !== cursorLine.to
          ) return false

          view.dispatch({
            changes: { from: view.state.selection.main.head, insert: '\n' },
            selection: { anchor: view.state.selection.main.head + 1 },
            effects: tableSourceEnterEffect.of(true),
          })
          return true
        },
      },
      { key: 'Tab', run: (view) => navigateTableCell(view) },
      { key: 'Shift-Tab', run: (view) => navigateTableCell(view, true) },
    ])),
    EditorState.allowMultipleSelections.of(true),
  ]
}
