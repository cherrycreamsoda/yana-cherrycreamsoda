# YANA — Yet Another Notes App

A notes app project focused on writing in Markdown, organizing notes, and keeping everyday note-taking simple.

> **Project status:** A workspace prototype with a CodeMirror 6 Markdown editor. The editor, toolbar, local draft saving, and device-local attachments are implemented; multi-note management, cloud storage, and broader release validation remain unfinished.

## Overview

YANA is planned as a modern notes app inspired by the simplicity of apps such as Bear. Its detailed behavior and requirements are documented in [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md).

## Current Structure

- A topbar with a working light/dark toggle. It follows the system theme until manually changed, then saves that choice locally across restarts.
- A circular create-note button, profile icon, sidebar views, and folder-hierarchy placeholder. Note creation, the Notes/Pinned/Locked/Deleted views, and folder navigation are labeled “Coming soon”; the sidebar search is presentational.
- A title field and CodeMirror 6 Markdown editor. Markdown is the editable source of truth, with inline styling and rendered block previews in the same surface. Headings retain their `#` markers; inline emphasis and code delimiters are hidden when the caret is outside them. Markdown links display their linked text and underline, and return to source form when the caret enters them. Lists, task text, and blockquotes stay in the editable source layer; task checkboxes remain independent controls.
- A formatting toolbar for headings, emphasis, lists, links, images, code, tables, attachments, and additional Markdown syntax, with common keyboard shortcuts. Rendered GFM table cells are editable; triple-click reveals the source and Tab moves between cells. In source mode, Tab/Shift-Tab navigate cells and Enter at the table end restores the rendered table through the documented two-Enter interaction.
- Inline and multiline math rendering, Mermaid diagrams, YAML frontmatter, callouts, footnotes, emoji shortcodes, hashtags, wiki-link styling, and image previews. Uploaded images fill the available editor content width; linked images keep their natural size unless constrained by the available width.
- Automatic local draft saving with a visible save state. The title and canonical Markdown source survive a browser restart on this device.

The editor currently saves one local draft; it does not yet create or manage multiple notes, so wiki-links do not navigate to other notes. Attachments are stored in this browser on this device using IndexedDB and referenced from Markdown; they are not synced or backed up. Raw HTML is sanitized before rendering, and links and image URLs are validated. The implemented editor has been exercised through browser interaction checks; exhaustive syntax conformance, accessibility, performance, and broader release acceptance remain to be completed.

The Markdown editor implementation is organized under [`src/MarkdownEditor`](./src/MarkdownEditor): CodeMirror actions and extensions, Markdown rendering, widgets, attachment storage, toolbar components, and focused style sheets are kept in separate modules.

## Planned Features

These goals are specified but are not implemented unless listed under Current Structure:

- **Seamless Markdown (mandatory):** The current CodeMirror 6 implementation provides source-preserving inline and block rendering for supported CommonMark/GFM features, extensions, and YANA syntax. Markdown remains canonical. Broader conformance and accessibility validation remain; wiki-links await real multi-note navigation. Attachment blobs are currently device-local, not managed or synced across accounts/devices.
- **Note organization:** Default views, user-created folders, and note management.
- **Pinning and locking:** Pin notes and protect selected notes with a passcode.
- **Search, sorting, and filters:** Find notes using the criteria defined in the specification.
- **Tags and dates:** Add tags and note dates to organize and filter content.
- **Deleted notes and restore:** Soft-delete, restore, or permanently delete notes.
- **Authentication and cloud storage:** Firebase sign-in and per-account note storage.
- **Appearance:** System-aware light and dark themes with a saved manual override.
- **Export and notifications:** Export notes and show feedback for actions and errors.

## Status

- [x] Initial workspace layout
- [x] System-aware light/dark theme toggle with saved manual override
- [x] Presentational sidebar search, default-view placeholders, and folder-hierarchy placeholder
- [x] Title field and locally persisted Markdown draft
- [x] CodeMirror 6 source editor with inline/block Markdown rendering, CommonMark/GFM parser, advanced syntax renderers, safe raw HTML handling, and table-cell navigation
- [x] Functional formatting and insertion toolbar with common keyboard shortcuts
- [x] Device-local attachment insertion and storage
- [x] CodeMirror 6 Markdown editor implementation
- [ ] Complete exhaustive Markdown conformance, accessibility, save/reload, attachment-lifecycle, and hands-on Bear validation (all listed Markdown features remain required)
- [ ] Note creation, data model, and persistence
- [ ] Search behavior over actual notes
- [ ] Folder hierarchy and note navigation
- [ ] Firebase authentication and cloud storage
- [ ] Pinning, locking, deletion, and restore
- [ ] Tags, dates, advanced search, filters, and sorting
- [ ] Export and notifications

This checklist is a high-level progress summary. The specification is the source of truth for detailed requirements and open decisions.

## Documentation

- [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md) — maintained product requirements, current milestone scope, and decisions

## Tech Stack

- **Vite** — development server and build tooling
- **React 19** — frontend framework
- **Backend and authentication:** Firebase is planned

The stack may evolve during implementation; dependency versions and scripts are recorded in [`package.json`](./package.json).

## Getting Started

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## Project Metadata

- **Author:** Hamza Zain
- **Repository:** [GitHub repository](https://github.com/cherrycreamsoda/yana-cherrycreamsoda)
- **Specification version:** 0.1
- **Application version:** 0.1.0

## License

No license has been selected yet. Until a license is added to the repository, reuse and redistribution permissions have not been explicitly granted.
