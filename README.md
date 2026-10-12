# YANA — Yet Another Notes App

A notes app project focused on writing, organizing notes, and keeping everyday note-taking simple.

> **Project status:** A workspace prototype with a simple plain-text editor and one locally saved draft. Markdown editing, note management, and cloud storage are planned, not implemented in this baseline.

## Overview

YANA is planned as a modern notes app inspired by the simplicity of apps such as Bear. Its detailed behavior and requirements are documented in [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md).

## Current Structure

- A topbar with a working light/dark toggle. It follows the system theme until manually changed, then saves that choice locally across restarts.
- A circular create-note button, profile icon, sidebar views, and folder-hierarchy placeholder. Note creation, the Notes/Pinned/Locked/Deleted views, and folder navigation are labeled “Coming soon”; the sidebar search is presentational.
- A title field and a plain-text content area. Text is edited as-is; Markdown syntax, formatting, previews, and a formatting toolbar are not active.
- Automatic local draft saving with a visible save state. The title and text draft survive a browser restart on this device.

The app currently saves one local draft and does not create or manage multiple notes. Markdown editing—including formatting, rendering, attachments, and wiki-link navigation—is planned future work.

## Planned Features

These goals are specified but are not implemented unless listed under Current Structure:

- **Seamless Markdown (planned):** Implement source-preserving editing and rendering for the required CommonMark/GFM features, extensions, and YANA syntax. Markdown should become the canonical note format; toolbar, attachment, safety, accessibility, and conformance work are part of that future milestone.
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
- [x] Title field and locally persisted plain-text draft
- [x] Simple plain-text content editor with automatic local saving
- [ ] Seamless Markdown editor, formatting toolbar, and required Markdown syntax
- [ ] Markdown attachment handling, safety, accessibility, and conformance validation
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
