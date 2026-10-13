# Markdown Editor

The editor keeps Markdown as the document and CodeMirror 6 as the live editing
surface. Its modules are grouped by what a developer needs to change: toolbar
controls, source-formatting commands, rendering, editor behavior, attachments,
and styles. The public React component remains at the root.

## Folder Map

```text
src/MarkdownEditor/
  MarkdownEditor.jsx
  README.md
  plan.md
  Toolbar/
    MarkdownToolbar.jsx
  Formatting/
    FormattingActionRouter.js
    MarkdownSourceEditing.js
    InlineTextFormatting.js
    BlockFormatting.js
    LinkFormatting.js
    MathFormatting.js
    CodeBlockFormatting.js
    ExtendedFormatting.js
  MarkdownRendering/
    MarkdownRenderer.js
    InlineSyntaxDecorations.js
    InlineWidgets.js
    RenderedMarkdown.js
    TableEditing.js
  EditorBehavior/
    EditorExtensions.js
  Attachments/
    AttachmentActions.js
    AttachmentStorage.js
  Styles/
    MarkdownEditor.css
```

## Where to Start

| Change | Start here |
| --- | --- |
| React props, editor mounting, change callback, cleanup | [`MarkdownEditor.jsx`](./MarkdownEditor.jsx) |
| Toolbar controls, menus, shortcut help | [`Toolbar/MarkdownToolbar.jsx`](./Toolbar/MarkdownToolbar.jsx) |
| Connect a toolbar or shortcut action name | [`Formatting/FormattingActionRouter.js`](./Formatting/FormattingActionRouter.js) |
| Change Markdown insertion or selection placement | The matching module in [`Formatting/`](./Formatting) |
| Change HTML output, plugins, safe links, wiki-links, hashtags, callouts, or Mermaid markup | [`MarkdownRendering/MarkdownRenderer.js`](./MarkdownRendering/MarkdownRenderer.js) |
| Change inline source display or task checkboxes | [`MarkdownRendering/InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js) |
| Change inline math/link/emoji/image/task widgets | [`MarkdownRendering/InlineWidgets.js`](./MarkdownRendering/InlineWidgets.js) |
| Change rendered block previews or focus/source switching | [`MarkdownRendering/RenderedMarkdown.js`](./MarkdownRendering/RenderedMarkdown.js) |
| Change table navigation or source editing | [`MarkdownRendering/TableEditing.js`](./MarkdownRendering/TableEditing.js) |
| Change keymaps, editor theme, paste/drop, or extension wiring | [`EditorBehavior/EditorExtensions.js`](./EditorBehavior/EditorExtensions.js) |
| Change local file insertion or browser storage | [`Attachments/AttachmentActions.js`](./Attachments/AttachmentActions.js), [`Attachments/AttachmentStorage.js`](./Attachments/AttachmentStorage.js) |
| Change any editor, widget, preview, table, or toolbar styling | [`Styles/MarkdownEditor.css`](./Styles/MarkdownEditor.css) |

## Core Concepts and Data Flow

**Markdown source** is the text stored in CodeMirror's document. A formatting
command changes it by dispatching a transaction; a preview or widget only
changes how part of that source looks. The parent receives document changes
through `onChange`.

```text
MarkdownEditor.jsx
  ├─ mounts CodeMirror using EditorBehavior/EditorExtensions.js
  ├─ connects Toolbar/MarkdownToolbar.jsx to the same editor view
  └─ forwards editor document changes to the parent

Toolbar or keyboard shortcut
  └─ FormattingActionRouter.js
       └─ feature command ──> MarkdownSourceEditing.js ──> source transaction

CodeMirror syntax tree ──> InlineSyntaxDecorations / RenderedMarkdown
Markdown-it ─────────────> preview HTML ──> rendered widget
AttachmentActions ───────> Markdown attachment URI + AttachmentStorage
```

The `value` prop seeds the document when the component mounts and is used to
calculate the displayed word count. Later `value` prop changes do not replace
the live CodeMirror document. Keep that contract unless a separate controlled
value behavior is designed. The component retains the latest `onChange`
callback, gives the toolbar a reference to the same editor view, and destroys
the editor and pending attachment-status timer during cleanup.

### Two distinct Markdown paths

These mechanisms are not interchangeable:

1. **CodeMirror's Markdown syntax tree** identifies Markdown structures and
   exact character positions in editable source. Decorations, task checkboxes,
   selection-aware source changes, block classification, and table editing
   rely on this path.
2. **Markdown-it** converts Markdown to HTML for inline link widgets and whole
   block previews. `MarkdownRenderer.js` configures its plugins and custom
   wiki-link, hashtag, callout, safe-link, and Mermaid behavior.

### Useful editor terms

- **Extension:** a CodeMirror add-on that provides behavior or appearance,
  such as history, Markdown parsing, or paste handling.
- **Keymap:** rules that connect keys such as `Mod-b` or `Tab` to editor
  actions.
- **Decoration:** a visual treatment or replacement applied to a source range
  without changing the stored Markdown.
- **Widget:** a rendered element placed in the editor in place of source text,
  such as a task checkbox or a table preview.
- **Source range:** a pair of character positions in the Markdown document;
  ranges let a visual control edit the correct underlying text.

## Feature-to-File Map

Features can have separate insertion, recognition, and display code. Change
each layer only when that part of the feature needs to change.

| Feature | Insert/change source | Recognize or display | Toolbar/editor connection |
| --- | --- | --- | --- |
| Bold, italic, strikethrough, highlight, inline code | [`InlineTextFormatting.js`](./Formatting/InlineTextFormatting.js) and shared [`MarkdownSourceEditing.js`](./Formatting/MarkdownSourceEditing.js) | [`InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js) | [`FormattingActionRouter.js`](./Formatting/FormattingActionRouter.js), [`MarkdownToolbar.jsx`](./Toolbar/MarkdownToolbar.jsx) |
| Headings, lists, task lists, blockquotes, horizontal rules | [`BlockFormatting.js`](./Formatting/BlockFormatting.js) | CodeMirror Markdown syntax; task checkbox decoration in [`InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js) | Router, toolbar, and [`EditorExtensions.js`](./EditorBehavior/EditorExtensions.js) |
| Links, images, wiki-links, file-embed placeholder | [`LinkFormatting.js`](./Formatting/LinkFormatting.js) | [`MarkdownRenderer.js`](./MarkdownRendering/MarkdownRenderer.js), [`InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js), [`InlineWidgets.js`](./MarkdownRendering/InlineWidgets.js) | Router and toolbar; local file links use [`Attachments/`](./Attachments) |
| Inline and display math | [`MathFormatting.js`](./Formatting/MathFormatting.js) | Inline source in [`InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js), paired-line display blocks in [`RenderedMarkdown.js`](./MarkdownRendering/RenderedMarkdown.js), math widget in [`InlineWidgets.js`](./MarkdownRendering/InlineWidgets.js), Markdown-it math in [`MarkdownRenderer.js`](./MarkdownRendering/MarkdownRenderer.js) | Router and toolbar |
| Fenced code and Mermaid | [`CodeBlockFormatting.js`](./Formatting/CodeBlockFormatting.js) | [`MarkdownRenderer.js`](./MarkdownRendering/MarkdownRenderer.js) and [`RenderedMarkdown.js`](./MarkdownRendering/RenderedMarkdown.js) | Router, toolbar, and [`EditorExtensions.js`](./EditorBehavior/EditorExtensions.js) |
| Subscript, superscript, hashtags, callouts, emoji | [`ExtendedFormatting.js`](./Formatting/ExtendedFormatting.js) | [`MarkdownRenderer.js`](./MarkdownRendering/MarkdownRenderer.js), [`InlineSyntaxDecorations.js`](./MarkdownRendering/InlineSyntaxDecorations.js), [`InlineWidgets.js`](./MarkdownRendering/InlineWidgets.js) | Router and toolbar |
| Tables | Table insertion in [`BlockFormatting.js`](./Formatting/BlockFormatting.js); source cell edits in [`TableEditing.js`](./MarkdownRendering/TableEditing.js) | Table preview and source-mode state in [`RenderedMarkdown.js`](./MarkdownRendering/RenderedMarkdown.js) | [`EditorExtensions.js`](./EditorBehavior/EditorExtensions.js), toolbar, and table widget interactions |
| Attachments | [`AttachmentActions.js`](./Attachments/AttachmentActions.js) | [`AttachmentStorage.js`](./Attachments/AttachmentStorage.js), [`InlineWidgets.js`](./MarkdownRendering/InlineWidgets.js), [`RenderedMarkdown.js`](./MarkdownRendering/RenderedMarkdown.js) | Toolbar file picker and editor paste/drop handlers |

`FormattingActionRouter.js` is the only action-name dispatch table. Toolbar
buttons and keyboard shortcuts should call it rather than duplicating command
selection. `MarkdownSourceEditing.js` contains reusable source-selection
operations, not toolbar actions or feature-specific parsing.

## Important Interaction Rules

- **Inline source remains editable.** When the cursor enters decorated
  formatting, the Markdown syntax is revealed. CodeMirror's syntax tree and
  decorations avoid treating code examples or already-rendered blocks as live
  syntax.
- **Block preview returns to source on focus/selection.** Tables, code, HTML,
  horizontal rules, and paired-line display math can be previewed in place.
  Selection-aware state controls when the original Markdown is shown.
- **Tables edit the source.** Rendered table cells update their corresponding
  Markdown ranges on blur. Arrow keys, triple-click, Tab/Shift-Tab, and Enter
  connect rendered cells to source navigation and row insertion. At the end of
  a source table, the first Enter opens a temporary line; a second Enter
  restores the preview without retaining an extra newline.
- **Task checkboxes edit the marker.** Toggling a checkbox changes `[ ]` or
  `[x]` in the Markdown source; Markdown-it does not render task checkboxes.
- **Toolbar mouse-down preserves selection.** This leaves the CodeMirror
  selection available for the action when a toolbar button is clicked.
- **Attachment blobs stay on this device.** The editor stores files in
  IndexedDB and inserts stable `yana-attachment:<id>` references. Attachments
  are not synced or backed up.

## Rendering and Safety Boundaries

- `MarkdownRenderer.js` validates link protocols before Markdown-it emits
  links.
- `InlineWidgets.js` and `RenderedMarkdown.js` sanitize generated HTML with
  DOMPurify and apply resource URL rules before attaching content to the DOM.
- Mermaid runs with strict security settings, and returned SVG is sanitized.
- KaTeX rendering uses `trust: false`.
- Attachment loading and saving failures are surfaced through the editor's
  status callback or an explicit console error; do not hide them behind an
  empty success-shaped preview.

## How to Change or Add a Formatting Feature

1. Put the source transformation in the existing feature module or add a
   descriptive feature module under `Formatting/` if it has a distinct
   responsibility.
2. Reuse `MarkdownSourceEditing.js` for selection wrapping, block insertion,
   or cursor placement rather than duplicating those mechanics.
3. Add one action-name mapping to `FormattingActionRouter.js`; connect toolbar
   controls in `MarkdownToolbar.jsx` and keyboard behavior in
   `EditorExtensions.js` only if the feature needs them.
4. Add recognition/display logic in the relevant rendering module. Inline
   source display belongs in `InlineSyntaxDecorations.js`; a rendered inline
   replacement belongs in `InlineWidgets.js`; a whole-block preview belongs
   in `RenderedMarkdown.js`; Markdown-it HTML rules belong in
   `MarkdownRenderer.js`.
5. Preserve source selection behavior and exclude code or rendered ranges
   where appropriate. Keep table navigation in `TableEditing.js` and file
   persistence in `AttachmentStorage.js`.
6. Update the opening comments, relevant section comments, this map, and any
   behavior notes when ownership or user-visible behavior changes.

## Styles and Validation

[`Styles/MarkdownEditor.css`](./Styles/MarkdownEditor.css) is the single
stylesheet for the editor frame, source syntax, widgets, rendered previews,
tables, toolbar, and responsive states. JSX, widget DOM, and sanitized preview
HTML apply the class names it styles. Keep selectors grouped by visual
responsibility and continue using the app's CSS custom properties for theme
colors and typography.

Run the repository checks after a change:

```bash
npm run lint
npm run build
```

There is no dedicated Markdown editor test script in `package.json`. For
interactive changes, also check insertion/cursor placement, source reveal,
table navigation, attachment persistence/error paths, and mount/unmount
behavior in the browser.

## Current Scope

The editor includes CommonMark/GFM parsing, inline and block math, Mermaid,
callouts, a small emoji shortcode set, hashtags, wiki-link styling, image
previews, and local attachments. A feature rendering in a block preview does
not necessarily mean it has a dedicated inline source interaction. Reference
and angle-bracket links, expanded emoji coverage and insertion, definition
list scope, and other syntax acceptance work are tracked in
[Section 13.3 of the functionality specification](../../YANA_Functionality_Specification.md#133-remaining-acceptance-work);
this refactor does not claim those items are complete.
