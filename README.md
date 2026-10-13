# YANA — Yet Another Notes App

A notes app project focused on writing in Markdown, organizing notes, and keeping everyday note-taking simple.

> **Project status:** A workspace prototype with a CodeMirror 6 Markdown editor. The editor, toolbar, local draft saving, and device-local attachments are implemented; multi-note management, cloud storage, and broader release validation remain unfinished.

## Overview

YANA is planned as a modern notes app inspired by the simplicity of apps such as Bear. Its detailed behavior and requirements are documented in [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md).

## Current Structure

- A topbar with a working light/dark toggle. It follows the system theme until manually changed, then saves that choice locally across restarts.
- A circular create-note button, profile icon, sidebar views, and folder-hierarchy placeholder. Note creation, the Notes/Pinned/Locked/Deleted views, and folder navigation are labeled “Coming soon”; the sidebar search is presentational.
- A CodeMirror 6 Markdown editor with a formatting toolbar, source-preserving inline and block previews, table editing, and device-local attachments. See the [Markdown editor guide](./src/MarkdownEditor/README.md) for its architecture, behavior, safety boundaries, and extension points.
- Automatic local draft saving with a visible save state. The title and canonical Markdown source survive a browser restart on this device.

The prototype still persists one local draft rather than managing multiple notes; wiki-links do not navigate between notes. Attachments are device-local and are not synced or backed up. Broader Markdown conformance and release validation remain in progress.

## Planned Features

These goals are specified but are not implemented unless listed under Current Structure:

- **Seamless Markdown (mandatory):** Markdown remains canonical in the CodeMirror 6 editor. Required CommonMark/GFM, extension, and YANA syntax remains acceptance scope; broader conformance and accessibility validation remain. Wiki-links await multi-note navigation. See the [Markdown editor guide](./src/MarkdownEditor/README.md) for current implementation behavior.
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
- [x] CodeMirror 6 Markdown editor and formatting toolbar (see the [editor guide](./src/MarkdownEditor/README.md))
- [ ] Complete exhaustive Markdown conformance, accessibility, save/reload, attachment-lifecycle, and hands-on Bear validation (all listed Markdown features remain required)
- [ ] Resolve the Markdown behavior gaps found in syntax testing, expand emoji support with an insertion picker, and decide definition-list scope ([acceptance TODOs](./YANA_Functionality_Specification.md#133-remaining-acceptance-work))
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
