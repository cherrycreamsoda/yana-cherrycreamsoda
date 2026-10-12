# YANA — Yet Another Notes App

A notes app project focused on writing in Markdown, organizing notes with a file-like folder structure, and keeping everyday note-taking simple.

> **Project status:** Pre-development. The repository currently contains a cleaned Vite boilerplate with a centered “Hello World” screen. The features described below are planned, not implemented yet.

## Overview

YANA is planned as a modern notes app inspired by the simplicity of apps such as Bear. The goal is to combine a comfortable Markdown writing experience with practical tools for organizing, finding, and managing notes.

The detailed feature plan and behavior decisions are documented in [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md).

## Planned Features

The following are goals for the project and should not be considered implemented functionality.

- **Markdown notes:** Create, view, and edit notes written in Markdown.
- **Note organization:** Browse notes in a sidebar with default views and user-created folders.
- **Pinning and locking:** Pin important notes and protect selected notes with a passcode.
- **Search, sorting, and filters:** Find notes and organize the list by supported criteria.
- **Tags and dates:** Add tags and use note dates to help organize and filter content.
- **Deleted notes and restore:** Soft-delete notes, restore them, or permanently delete them when appropriate.
- **Authentication and cloud storage:** Use Firebase for sign-in and per-account note storage.
- **Appearance:** Support light and dark themes.
- **Export and notifications:** Export notes and show feedback for actions and errors.

See the specification for the detailed requirements, edge cases, and items that are still undecided.

## Current Status

- [x] Vite boilerplate created and cleaned
- [ ] App layout and navigation
- [ ] Markdown editor
- [ ] Note and folder data model
- [ ] Firebase authentication and persistence
- [ ] Search, sorting, and filtering
- [ ] Pinning, locking, deletion, and restore
- [ ] Themes, export, and notifications

This checklist is a high-level roadmap and may change as development progresses.

## Documentation

- [`YANA_Functionality_Specification.md`](./YANA_Functionality_Specification.md) — detailed product and functional specification


## Tech Stack

- **Vite** — development server and build tooling
- **Frontend framework:** To be confirmed
- **Backend and authentication:** Firebase is planned

The stack may evolve during implementation.

## Getting Started

The project is still at the boilerplate stage. To run it locally, use the package manager and scripts configured in `package.json`.

For an npm-based setup, the usual commands are:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite in the terminal.

## Project Metadata

- **Author:** Hamza Zain
- **Repository:** [GitHub repository](https://github.com/cherrycreamsoda/yana-cherrycreamsoda)
- **Specification version:** 0.1
- **Application version:** Initial development; no release version yet


## License

No license has been selected yet. Until a license is added to the repository, reuse and redistribution permissions have not been explicitly granted.