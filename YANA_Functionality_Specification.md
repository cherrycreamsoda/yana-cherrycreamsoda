# YANA — Yet Another Notes App

**Document:** Functionality Specification  
**Version:** 0.1  
**Status:** Draft  
**Author:** Hamza Zain
**Last Updated:** 2026-10-12

# YANA — Functionality Overview

> **Product name:** **YANA**, short for *Yet Another Notes App*
> **Positioning:** A fresh take on note-taking, built to compete with **Bear** (bear.app).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Experience: Markdown, File-like Structure & Toolbar](#2-core-experience-markdown-file-like-structure--toolbar)
3. [Sidebar & Folder Structure](#3-sidebar--folder-structure)
4. [Authentication (Firebase)](#4-authentication-firebase)
5. [Loading States & Styling](#5-loading-states--styling)
6. [Notes: CRUD Operations](#6-notes-crud-operations)
7. [Pin & Lock Notes](#7-pin--lock-notes)
8. [Calendar & Note Dates](#8-calendar--note-dates)
9. [Search, Sort & Filter](#9-search-sort--filter)
10. [Appearance: Light Mode / Dark Mode](#10-appearance-light-mode--dark-mode)
11. [Export Options](#11-export-options)
12. [Topbar, Notifications & Account](#12-topbar-notifications--account)
13. [To-Do & Open Items](#13-to-do--open-items)
14. [Source Coverage Checklist](#14-source-coverage-checklist)
15. [Interpretation Notes](#15-interpretation-notes)

---

## Mind Map at a Glance

```
1. YANA, Yet Another Notes App (competes with Bear / bear.app)
│
├── 2. Core Experience
│   ├── Seamless Markdown
│   ├── File-like structure for notes
│   │   └── Shown in the sidebar (see 3)
│   ├── Editor toolbar (in the content area)
│   │   ├── All formatting options
│   │   └── Lock button
│   └── Editor area (the content area shows one note at a time)
│       ├── Title, user-added date, tags (tags listed on top, x removes a tag)
│       └── Pin (also in the sidebar)
│
├── 3. Sidebar & Folder Structure
│   ├── Left-side sidebar with two items: the Search bar and the Folders Tree
│   ├── Create folder and Create file buttons
│   ├── Select (remembered between sessions) and delete folders and files; bulk delete; copy and paste notes (pasting a note into a user-created folder links it; pasting into a default folder is not possible)
│   ├── Default folders = hardcoded filters (compulsory, undeletable, not renamable, fixed order)
│   │   ├── Notes (all notes that are not soft deleted)
│   │   ├── Pinned Notes
│   │   ├── Locked Notes
│   │   └── Deleted Notes (soft-deleted notes; hidden from Notes and folders)
│   ├── User-created folders (after the defaults; renamable, no nesting)
│   ├── User-created folders hold links to notes, not copies: a list of Note IDs, stored in the folder only (tied together by Folder ID)
│   ├── Creating a note: linked only if a user-created folder is selected, otherwise it lands in Notes
│   ├── Default names: New Folder, New Folder 1, 2, 3 ... (same for notes); duplicates allowed
│   └── Folder row: icon, name, "x notes", > closed / v open
│
├── 4. Authentication (powered by Firebase)
│   ├── Google
│   ├── Apple
│   ├── Facebook
│   ├── Twitter / X
│   ├── GitHub
│   ├── Email
│   ├── Phone number
│   └── Every provider is its own separate account; sign out from the account icon
│
├── 5. Loading States
│   ├── Beautiful, professional, attractive, with their own stylings
│   └── Note-list placeholders match the expected result count (strategy pending)
│
├── 6. Notes CRUD (stored in the Firebase backend)
│   ├── Create (new Note ID; unpinned, unlocked, not deleted; empty content shows "Enter your note")
│   ├── Read
│   ├── Update
│   ├── Delete (soft delete to Deleted Notes)
│   ├── Restore from Deleted Notes (back to Notes and its folders; a locked note stays locked)
│   └── Permanent delete (HTTP DELETE) / Empty Deleted Notes, with confirmation (provisional)
│
├── 7. Pin & Lock
│   ├── Pin notes (pin icon: gray on hover, yellow when pinned; also in the content area; pinned notes show on top of lists)
│   └── Lock notes (per note, six-digit numeric passcode)
│       ├── Set with the lock button in the content area
│       ├── "Enter a password" → "Enter again" to confirm; a mismatch runs the setter again
│       ├── Esc (keyboard) or a cross button (touch) cancels
│       ├── Wrong passcode: unlimited retries (for now)
│       ├── Locking and unlocking are manual: an unlocked note stays unlocked (also across reloads and sign-outs) until the lock button locks it again
│       ├── Setting the lock hides the content at once; the locked-state look of the editor area is still to be defined
│       ├── Content hidden and encrypted; title and other properties stay visible
│       └── The lock cannot be changed, removed or recovered; delete the note instead
│
├── 8. Calendar
│   └── Calendar on the note date → user-added date on notes
│
├── 9. Search / Sort / Filter — by:
│   ├── User-added date
│   ├── Last edited date
│   ├── Created date
│   ├── Title
│   ├── Tags
│   ├── Pinned notes (filter; also the Pinned Notes folder)
│   ├── Locked notes (filter; also the Locked Notes folder)
│   ├── Deleted notes (filter; also the Deleted Notes folder)
│   ├── Sort direction: ascending or descending; date filter is a range
│   ├── Note content is not searched (for now)
│   └── 9.2 Persisted selections
│       └── Saved per signed-in user across app restarts (search, filter, sort, open folders, selection and the open note)
│
├── 10. Light mode / Dark mode (follows the system setting; switch in the topbar)
│
├── 11. Export as
│   ├── TXT
│   ├── MD
│   ├── HTML
│   ├── PDF
│   ├── JPG
│   ├── DOCX
│   ├── A locked note must be unlocked before export
│   └── Deleted notes can be exported
│
├── 12. Topbar
│   ├── Theme switch
│   ├── Notifications island (a new notification stays until closed, then goes to the history; the history survives restarts)
│   └── Account icon (rightmost) → sign out
│
└── 13. To-Do & Open Items (open problems, still to define, pending docs work, future maybes)
```

---

## 1. Product Overview

**YANA** stands for **Yet Another Notes App**. It is built as a direct competitor to **Bear (bear.app)**. It delivers **super functionalities** on top of a clean writing experience, with two defining strengths:

- **Seamless Markdown** support.
- A **file-like structure** for notes.

Around that core, the app provides an editor toolbar with all the formatting options and a lock button, an editor area for a note's title, user-added date and tags, a left sidebar (search bar and folders tree) for navigating folders and notes, multi-provider login through Firebase, polished loading states, full note management (including soft deletion to Deleted Notes and confirmed permanent deletion), pinning and per-note six-digit passcode locking, calendar-based dates, persistent search, sort, filter, selection and open-note state, light and dark themes that follow the system setting, export to six formats, and a topbar that holds the theme switch, a notifications island and the account icon.

---

## 2. Core Experience: Markdown, File-like Structure & Toolbar

### 2.1 Seamless Markdown (MD)

- Notes are written in **Markdown** with a **seamless** experience: writing and formatting happen in one flow, with no clunky switch between "edit" and "preview" modes.
- Markdown is a first-class citizen across the app, which is also why **MD** is one of the export formats (see [Section 11](#11-export-options)).
- Formatting is applied from the editor toolbar (see [Section 2.3](#23-editor-toolbar)), which keeps every formatting option within reach while writing.

### 2.2 File-like Structure for Notes

- Notes are organized with a **file-like structure**: each note behaves like a file, and notes can be arranged the way files are arranged on a computer.
- This gives users a familiar, predictable way to store, navigate, and manage their notes.
- The structure is shown in the **left sidebar** as folders and files (notes); see [Section 3](#3-sidebar--folder-structure). One of the four default folders, **Deleted Notes**, holds soft-deleted notes. Moving a note there preserves it; users can restore it (back to Notes and its folders) or permanently delete it (see [Section 6](#6-notes-crud-operations)). Deleted Notes is an app folder, not an operating-system folder. It is also reachable as a filter option (see [Section 9.1](#91-behavior)).

### 2.3 Editor Toolbar

- The editor has a **toolbar** that holds **all the formatting options**: every Markdown formatting option the app supports (such as headings, bold, italic, lists, links, and code).
- The toolbar also holds the **lock button**, which starts the note-locking flow (see [Section 7.2](#72-lock-notes)). The lock button always lives in the **content area**, in this toolbar.
- Formatting options and the lock button share the same toolbar.

### 2.4 The Editor Area

- The **content area** shows **one note at a time**. Opening another note **closes** the note that was open. Closing a note does not change its lock state (see [Section 7.2](#72-lock-notes)).
- The input or editor area is where the user enters the things that belong to the note: the **title**, the **user-added date** (chosen with the calendar, see [Section 8](#8-calendar--note-dates)), the **tags**, and the Markdown content itself.
- A new note's content is empty, so the content area shows the placeholder **"Enter your note"** (see [Section 6.2](#62-creating-a-note)). When a note is locked its content is hidden; how the editor area looks in that locked state is still to be defined (see [Section 13.2](#132-still-to-define)).
- **Tags** work as follows:
  - A tag can be **created on the spot**, or **chosen from tags that already exist**.
  - Each tag in the editor has an **x button** next to its name; pressing it removes that tag from the note.
  - Tags are shown **inside the editor only**, as a **list on top** of the note.
  - Tags are **not** shown on every note in the sidebar lists, because that would clutter the lists fast. Tags can still be filtered from the sidebar (see [Section 9.1](#91-behavior)); when filtering by tag, it is already clear which tag is being filtered.
- **Pin** is available in the content area as well as in the sidebar (see [Section 7.1](#71-pin-notes)).

---

## 3. Sidebar & Folder Structure

The **sidebar** sits on the **left side** of the app. It shows the folder and file (note) structure and is used mainly for **navigation between files and folders**. It is where the file-like structure from [Section 2.2](#22-file-like-structure-for-notes) is put into practice.

### 3.1 Sidebar

- The sidebar is on the **left side** of the app.
- Its main job is **navigation** between folders and files (notes).
- The sidebar has **two items**:
  - The **Search bar**. Deep filtering and sorting will live under the search bar and will be defined later (see [Section 13.2](#132-still-to-define)).
  - The **Folders Tree**: the default folders followed by the user-created folders. Opening a folder reveals the notes it shows. In this document, **the notes list** means the notes shown under an opened folder in the Folders Tree. Filtering by state is already defined by the default folders (see [Section 3.2](#32-default-folders)).
- It also holds these controls and actions:

| Control / action | What it does |
|------------------|--------------|
| **Create folder** button | Creates a new folder (see [Section 3.3](#33-user-created-folders)) |
| **Create file** button | Creates a new note (a "file" is a note). If a user-created folder is selected, the new note is linked to that folder automatically. If Notes, Pinned Notes, Locked Notes or Deleted Notes is selected, the note is created in Notes and no folder link is made (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)) |
| **Select** | Select folders and files; the selection is remembered between sessions (see [Section 3.7](#37-selection-and-bulk-actions) and [Section 9.2](#92-persisting-selected-states)) |
| **Delete** | Delete folders and files |
| **Copy / paste** | Copy and paste notes; pasting a note into a user-created folder links the same note there instead of duplicating it. Pasting into a default folder is not possible, because default folders are filters (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)) |

- Deleting a note from the sidebar is the regular delete action from [Section 6](#6-notes-crud-operations): the note is soft deleted and moves to Deleted Notes. Deleting a note from inside a user-created folder soft-deletes the note everywhere; there is no way yet to remove a note from just one folder, which stays an open problem (see [Section 13.1](#131-open-problems)).
- Deleting a user-created folder removes the folder and its links to notes. The notes themselves stay in Notes. The four default folders cannot be deleted (see [Section 3.2](#32-default-folders)).
- Folders cannot be copied and pasted, because folders do not nest. Copy and paste applies to notes only.

### 3.2 Default Folders

Four default folders are always present, in this fixed order. They are also called **state folders**.

| Order | Folder | What it contains | Hardcoded filter (illustrative) |
|:-----:|--------|------------------|---------------------------------|
| 1 | **Notes** | Every note that is not soft deleted, including pinned and locked notes | not soft deleted |
| 2 | **Pinned Notes** | The pinned notes | `pinned: true`, not soft deleted |
| 3 | **Locked Notes** | The locked notes | locked, not soft deleted |
| 4 | **Deleted Notes** | The soft-deleted notes | soft deleted |

- All four are **compulsory**, **cannot be deleted or renamed**, and always stay in this order, ahead of any user-created folder.
- All four are **hardcoded filters**: each has a fixed rule for which notes it shows, computed from the notes' own state. None of them stores links.
- **Notes** is the main folder: logically it holds all the notes. It simply filters out the soft-deleted ones, which are shown and filtered into **Deleted Notes** instead.
- **Pinned Notes**, **Locked Notes**, and **Deleted Notes** show only the notes in that state (pinned, locked, or soft deleted).
- Soft-deleted notes are **not visible in Notes** or in any other folder. They still exist, and so do their links in user-created folders, but they are filtered out and appear only in Deleted Notes, in the same way that Locked Notes shows only the filtered locked notes.

### 3.3 User-created Folders

- Users create their own folders with the **Create folder** button. A new folder gets a default name (see [Section 3.6](#36-default-names-duplicates-and-order)).
- User-created folders appear **after the four default folders**.
- User-created folders can be **renamed**. A folder's contents do not depend on its name, because each folder has a unique **Folder ID** (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)).
- Folders **do not nest** (for now): a folder holds notes, never other folders.
- A folder is a place to put notes. It looks like it contains the notes, and they appear placed inside it, but underneath it holds links (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)).

An example sidebar outline:

```
Notes
Pinned Notes
Locked Notes
Deleted Notes
My Projects
My Routines
Study Material 2026
```

The first four are the default folders. The last three (My Projects, My Routines, Study Material 2026) are user-created folders.

### 3.4 How Folders Show Notes: Filters and Links

- Every note exists **once**, as a single note with its own **Note ID**. Folders never hold copies of a note.
- The **default folders** are **hardcoded filters**. They store nothing and show whichever notes match their rule. For example, Pinned Notes is computed from a note's state (`pinned: true`), so a note appears there as soon as it is pinned and leaves as soon as it is unpinned.
- The **user-created folders** hold **links** to the notes that are supposed to be in them: a list of Note IDs (for example `containsNotes: noteIDForNote0001, noteIDForNote0002, ...`; the field name is illustrative). What appears inside such a folder is a link to the real note. The links live **in the folder only**: a note does not store the IDs of the folders that list it.
- A note can be linked from **several user-created folders** at once. Because every link points to the same note, an edit made through one folder shows up in all the others.
- Each folder has a unique **Folder ID**, and the links inside it are Note IDs, so a folder's contents stay intact when the folder is renamed.
- User-created folders fill with the notes the user puts in them: by pasting a note into the folder, or by creating a note while the folder is selected. **A link is made only when a user-created folder is the target.** A note created while Notes, Pinned Notes, Locked Notes or Deleted Notes is selected is created in Notes, with no folder link. Pasting a note into a default folder is not possible.
- Soft deletion hides a note from Notes and from every folder but **keeps its links** in user-created folders, so Restore can show it again in Notes and in those folders (see [Section 6](#6-notes-crud-operations)).
- **Permanent deletion removes the note's ID from every folder that lists it, together with the note itself**, so no link is left orphaned (see [Section 6](#6-notes-crud-operations)).
- Deleting a user-created folder removes that folder and its links to notes. The notes stay in Notes, and in any other folder that links to them.

### 3.5 Folder Row Layout

Each folder is one row in the sidebar:

```
[icon]  Folder Name                 x notes   >      (folder closed)
[icon]  Folder Name                 x notes   v      (folder open)
```

| Part | Meaning |
|------|---------|
| **Icon** | An icon for the folder, shown at the left of the row. Users choose their folder icons; how they choose is defined later (see [Section 13.1](#131-open-problems)) |
| **Folder name** | The name of the folder, such as My Projects |
| **x notes** | How many notes the folder shows, where x is the number (soft-deleted notes are not counted in any folder except Deleted Notes); a folder with exactly one note shows `1 note` |
| **>** or **v** | `>` when the folder is closed, `v` when the folder is open |

- Opening a folder reveals the notes it shows. Each note row shows the note's title, with the pin icon at its end (see [Section 7.1](#71-pin-notes)).

### 3.6 Default Names, Duplicates and Order

- A new folder is named **New Folder**, then **New Folder 1**, **New Folder 2**, **New Folder 3**, and so on. A new note follows the same pattern: **New Note**, **New Note 1**, **New Note 2**, and so on.
- **Duplicate names can exist.** Notes and folders are identified by their **Note ID** and **Folder ID**, so duplicate names are not a problem.
- By default, notes are ordered by **creation time**. They can also be sorted by **last edited** time (see [Section 9.1](#91-behavior)). **Pinned notes are shown on top** in user-created folders, Notes, Deleted Notes and Locked Notes (see [Section 7.1](#71-pin-notes)). User-created folders sit after the default folders.
- Reordering folders and files by hand is not defined yet (see [Section 13.2](#132-still-to-define)).

### 3.7 Selection and Bulk Actions

- **Select** works on folders and notes (see [Section 3.1](#31-sidebar)). The selection **is remembered** between sessions, together with the open note (see [Section 9.2](#92-persisting-selected-states)).
- The only bulk action is **Delete**:
  - Selected notes that are not deleted are **soft deleted**.
  - Selected notes that are in Deleted Notes are **permanently deleted**. Permanent deletion still requires confirmation (see [Section 6](#6-notes-crud-operations)).
  - If a selection mixes a deleted note and a not-deleted note, the deleted note is permanently deleted and the not-deleted note is soft deleted.
  - Selected user-created folders are deleted as described in [Section 3.1](#31-sidebar).

---

## 4. Authentication (Firebase)

Login is **simple** and is powered by **Firebase** authentication.

### 4.1 Supported Login Methods

| # | Method | Description |
|---|--------|-------------|
| 1 | **Google** | Sign in with a Google account |
| 2 | **Apple** | Sign in with an Apple account |
| 3 | **Facebook** | Sign in with a Facebook account |
| 4 | **Twitter / X** | Sign in with a Twitter / X account |
| 5 | **GitHub** | Sign in with a GitHub account |
| 6 | **Email** | Sign in with an email address |
| 7 | **Phone number** | Sign in with a phone number |

### 4.2 Behavior

- All seven methods are handled through **Firebase**, so the login experience is consistent no matter which one the user picks.
- Each user's notes belong to their own account and are stored in the app's Firebase backend (see [Section 6](#6-notes-crud-operations)).
- Signing out is done from the account icon in the topbar (see [Section 12.3](#123-account-icon-and-sign-out)).
- A failed sign-in is an error and is reported through the notifications island (see [Section 12.2](#122-notifications-island)).

### 4.3 Accounts

- Every sign-in method creates its **own separate account**. If the same person signs in with two different providers, or with email and a provider, those are **two separate accounts**, and their notes are not shared.
- **Merging accounts** is not in scope for the current version (see [Section 13.4](#134-future-maybes)).
- **Deleting an account** does not exist in the current version (see [Section 13.4](#134-future-maybes)).

---

## 5. Loading States & Styling

The app has **beautiful, professional, attractive loading states**, each with **its own styling**.

- Loading states appear wherever the app is waiting on something (for example signing in, loading the notes list, opening a note, searching, or exporting).
- Every loading state is **designed**, not generic: it has a distinct visual style that matches the app's overall look.
- Loading styles adapt to both **light mode** and **dark mode** (see [Section 10](#10-appearance-light-mode--dark-mode)).
- For a loading notes list, show exactly as many placeholder items as the expected number of results for the active query. The loading state must have that expected count available rather than use a fixed, guessed number. *Provisional: the strategy for knowing that count in advance is not chosen yet (see [Section 13.1](#131-open-problems)).*

---

## 6. Notes: CRUD Operations

Users have full **CRUD** control over their notes.

| Operation | What the user can do |
|-----------|----------------------|
| **Create** | Add a new note (written in Markdown); see [Section 6.2](#62-creating-a-note) |
| **Read** | Open and view any note, rendered with its Markdown formatting |
| **Update** | Edit a note's content, title, and tags; the **last edited date** updates automatically |
| **Delete** | **Soft delete**: move the note to the **Deleted Notes** folder without erasing it. Notes and every other folder stop showing it, but its folder links are kept so Restore can bring it back (see [Section 3.2](#32-default-folders) and [Section 3.4](#34-how-folders-show-notes-filters-and-links)) |
| **Restore** | Clear the note's Deleted state: it reappears in Notes and in every user-created folder it is linked to (the links were kept while the note was deleted), and in Pinned Notes or Locked Notes if it is pinned or locked. A locked note stays locked after restore |
| **Permanent delete** | From Deleted Notes, permanently erase a note by sending an HTTP `DELETE` request to the Firebase backend. The note's ID is removed from every folder that lists it, so no link is left orphaned. Require confirmation before sending the request |
| **Empty Deleted Notes** | Permanently erase every note currently in Deleted Notes, in the same way (HTTP `DELETE`, the notes' IDs removed from the folders that list them); require confirmation before proceeding |

**Soft vs permanent deletion.** They are separate operations. The regular delete action only changes the note's Deleted state, so the record and its folder links are kept and Restore can bring the note back. Permanent deletion is only available through the explicit permanent-delete or Empty Deleted Notes action, and it removes the note's record from the backend. Permanent-delete and Empty Deleted Notes controls use a dark red button style. Deleting several notes at once is covered in [Section 3.7](#37-selection-and-bulk-actions). *Provisional: the permanent-delete behavior and the name "Empty Deleted Notes" are pending the author's explanation (see [Section 13.1](#131-open-problems)).*

**Storage:** Notes are stored in the app's Firebase backend under the signed-in user's account.

### 6.1 What a Note Holds

| Property | Purpose |
|----------|---------|
| **Note ID** | A unique ID generated when the note is created; it identifies the note, so duplicate titles are not a problem (see [Section 3.6](#36-default-names-duplicates-and-order)) |
| **Title** | The note's name; used for display, search, sort, and filter. Entered in the editor area (see [Section 2.4](#24-the-editor-area)). Stays visible when the note is locked |
| **Content** | Markdown body of the note. Empty (`""`) when the note is created, so the placeholder "Enter your note" can show. Hidden, and stored encrypted, while the note is locked (see [Section 7.2](#72-lock-notes)) |
| **Tags** | Labels attached to a note; used for search, sort, and filter. Created on the spot or chosen from existing tags, and removed with the x button (see [Section 2.4](#24-the-editor-area)) |
| **Pinned state** | Whether the note is pinned (see [Section 7.1](#71-pin-notes)). Drives the Pinned Notes folder |
| **Locked state** | Whether the note is currently locked; set to true with the toolbar lock button, and kept across reloads and sign-outs (see [Section 7.2](#72-lock-notes)). Drives the Locked Notes folder |
| **Passcode** | The note's own six-digit numeric passcode, set when the note is locked; stored only in a securely verifiable form, never as plaintext; cannot be changed, removed or recovered (see [Section 7.2](#72-lock-notes)) |
| **Deleted state** | Whether the note has been soft deleted and is currently in Deleted Notes |
| **Created date** | When the note was created (set automatically) |
| **Last edited date** | When the note was last changed (set automatically) |
| **User-added date** | A date the user adds to the note via the calendar (see [Section 8](#8-calendar--note-dates)) |

A note does not hold folder IDs: the links live in the folders themselves, as lists of Note IDs (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)).

### 6.2 Creating a Note

1. A new **Note ID** is generated for the note.
2. The note starts **unpinned**, **unlocked** and **not deleted**. Its created date is set automatically.
3. It gets a default title (**New Note**, **New Note 1**, ...; see [Section 3.6](#36-default-names-duplicates-and-order)) and **empty content** (`""`), so the content area can show the placeholder **"Enter your note"**. The user then fills in the title, user-added date, tags and content in the editor area (see [Section 2.4](#24-the-editor-area)).
4. If a **user-created folder** is selected, the note is linked to it. In any other case (Notes, Pinned Notes, Locked Notes or Deleted Notes selected) the note is created in **Notes** with no folder link (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)).

---

## 7. Pin & Lock Notes

### 7.1 Pin Notes

- Users can **pin** any note, and **unpin** it again.
- Users can filter the notes list to show pinned notes (see [Section 9](#9-search-sort--filter)), so important notes are easy to reach.
- Pinned notes are also listed in the **Pinned Notes** folder in the sidebar, which shows every note whose state is pinned (see [Section 3.2](#32-default-folders)).
- Pinned notes are shown **on top** of the list in user-created folders, Notes, Deleted Notes and Locked Notes. (In Pinned Notes every note is pinned, so nothing is lifted.)
- Pin is available in two places: the **sidebar** and the **content area**.
- **Pin icon in the sidebar** (at the end of each note's name):
  - **Not pinned:** the icon is hidden.
  - **Hovering over a note** in the list: a **gray, disabled-looking pin icon** appears, to show that the note can be pinned. Clicking it pins the note.
  - **Pinned:** the icon shows as a **yellow pin**. Clicking the yellow pin **unpins** the note.

### 7.2 Lock Notes

- Users can **lock** any note, and each note has **its own passcode**; passcodes are never shared between notes.
- Locking is started with the **lock button in the editor toolbar**, which is in the content area (see [Section 2.3](#23-editor-toolbar)). The same lock button is used to lock the note again later (see "Locking and unlocking are manual" below).
- A locked note is protected: it must be unlocked before it can be opened.
- Unlocking requires the note's **six-digit numeric passcode**.
- Show six unfilled circles (`○○○○○○`) when no digits are entered; fill one circle for each numeric digit as the user types. Accept digits only, up to six, and mask the digits rather than displaying them as text.
- The note stays locked until all six digits have been entered and verified.
- Locked notes are also listed in the **Locked Notes** folder in the sidebar (see [Section 3.2](#32-default-folders)) and can be filtered (see [Section 9](#9-search-sort--filter)).

#### Locking flow (setting the passcode)

1. The user presses the **lock button** in the toolbar.
2. The same six unfilled circles appear with the prompt **"Enter a password"**, and the user enters six digits.
3. The six circles appear again with the prompt **"Enter again"**, and the user re-enters the same six digits to confirm.
4. If the second entry matches the first, the note is **locked**: its locked state is set to true and its content is hidden at once.
5. If it does not match, the note is not locked and the **password setter runs again**, from step 2, with a message that the confirmation password does not match. The message tells the user to enter a new password, or to try the same password again and, this time, type the same password they set in the first step. *The exact message text is not final.*

#### Cancelling a passcode prompt

- On **keyboard devices**, **Esc** cancels, and the screen says so ("Esc to cancel") somewhere on the prompt. On **touch devices**, a **cross button** cancels.
- This applies to every passcode prompt: setting the passcode, unlocking a note, and the unlock that precedes an export (see [Section 11](#11-export-options)).
- Cancelling the locking flow **aborts locking**, and the note stays unlocked.

#### Locking and unlocking are manual

- The system never locks or unlocks a note by itself. Once a note is **unlocked**, it **stays unlocked**: closing it (which happens when another note is opened, see [Section 2.4](#24-the-editor-area)), reloading the app, or signing out does not lock it again.
- After setting a passcode, the same lock button manually changes the note's locked state: it locks an unlocked note immediately, or begins the passcode prompt for unlocking a locked note. The passcode remains set while the note is unlocked; unlocking does not remove the lock or passcode.
- A locked note likewise stays locked across reloads and sign-outs. Successfully unlocking a note for export also leaves it unlocked until the user locks it again manually (see [Section 11](#11-export-options)).
- **Unlocking** needs the note's six-digit passcode. A wrong passcode gives the user **unlimited retries**. This is weak practice and is accepted for now (see [Section 13.1](#131-open-problems)).
- How the editor area looks for a locked note is still to be defined (see [Section 13.2](#132-still-to-define)).

#### What locking hides and what stays visible

- Locking hides the **content only**. It is not just an access check: the content is **encrypted** and stays locked until the note is unlocked.
- Other properties stay visible, such as the **title**, the pinned state and the ID.
- Locked notes appear in the sidebar lists with their titles and in search, where only their titles are shown (see [Section 9.1](#91-behavior)).
- A locked note **cannot be exported without unlocking** it first (see [Section 11](#11-export-options)).
- Restoring a locked note from Deleted Notes **keeps it locked** (see [Section 6](#6-notes-crud-operations)).

#### No change, no removal, no recovery

- A passcode **cannot be changed or recovered**, and the **lock can never be removed** from a note: the passcode stays on the note for good, even while the note is unlocked (see [Section 13.1](#131-open-problems) for the details still to be confirmed).
- If a passcode is forgotten, the only solution is **deleting the note itself**. A locked note can be deleted without entering its passcode (see [Section 6](#6-notes-crud-operations)).

---

## 8. Calendar & Note Dates

- A **calendar** is available on each note's date.
- It lets the user set the **user-added date**: a date the user chooses and attaches to a note. The user-added date is entered in the editor area (see [Section 2.4](#24-the-editor-area)).
- Every note therefore carries **three separate dates**:

| Date | Who sets it | Meaning |
|------|-------------|---------|
| **User-added date** | The user, via the calendar | A date the user assigns to the note |
| **Created date** | The app, automatically | When the note was first created |
| **Last edited date** | The app, automatically | When the note was last modified |

- All three dates can be used for search, sort, and filter (see [Section 9](#9-search-sort--filter)).

---

## 9. Search, Sort & Filter

Search, sort, and filter are available for the criteria where each operation is meaningful:

| # | Criterion | Search | Sort | Filter |
|---|-----------|:------:|:----:|:------:|
| 1 | **User-added date** | ✅ | ✅ | ✅ |
| 2 | **Last edited date** | ✅ | ✅ | ✅ |
| 3 | **Created date** | ✅ | ✅ | ✅ |
| 4 | **Title** | ✅ | ✅ | ✅ |
| 5 | **Tags** | ✅ | ✅ | ✅ |
| 6 | **Pinned state** (also the Pinned Notes folder) | — | — | ✅ |
| 7 | **Locked state** (also the Locked Notes folder) | — | — | ✅ |
| 8 | **Deleted state** (also the Deleted Notes folder) | — | — | ✅ |

**Where these tools live.** The sidebar has two items, the search bar and the folders tree (see [Section 3.1](#31-sidebar)). Filtering by state is already defined by the default folders. Deep filtering and sorting will sit under the search bar and will be defined later (see [Section 13.2](#132-still-to-define)).

### 9.1 Behavior

- **Search:** match text in note titles and tags, and match entered dates against the three date fields. **Note content is not searched** in this version; if the author later decides that content will be searched, it will be added (see [Section 13.4](#134-future-maybes)). Pinned, locked, and deleted are states, not searchable text. Locked notes appear in search results, and only their titles are shown.
- **Sort:** order notes by user-added date, last edited date, created date, title, or tag. The **sort direction is selectable**: ascending or descending. By default notes are ordered by creation time (see [Section 3.6](#36-default-names-duplicates-and-order)). Pinned notes are shown on top (see [Section 7.1](#71-pin-notes)). Pinned, locked, and deleted are filterable states, not sort keys.
- **Filter:** narrow the list by date, title, or tag criteria, or show only pinned, only locked, or only deleted notes. A **date filter is a range**. Tags can be filtered from the sidebar; the lists do not show each note's tags (see [Section 2.4](#24-the-editor-area)).
- **Deleted Notes access (two ways, by design):** Deleted notes are available both as a **dedicated folder** (**Deleted Notes** in the sidebar) and as a **filter option**. The overlap is intentional, so users can reach their deleted notes quickly from wherever they are. Both show the same notes, and deleted notes are never mixed into the regular notes list.
- **Pinned and locked views:** The **Pinned Notes** and **Locked Notes** folders (see [Section 3.2](#32-default-folders)) are built-in views of those two states. Each is also a filter option here, the same way deleted notes are.
- These tools can be combined, for example filtering to a tag and then sorting by last edited date.

### 9.2 Persisting Selected States

- Persist these per signed-in user, so one account's state does not carry over to another account, and restore them when the user closes and reopens the app, applying the saved selections to the notes list:
  - the current **search query**,
  - the selected **filter** and **sort** options,
  - which folders are **open** (the opened state),
  - the **selection** made with Select (see [Section 3.7](#37-selection-and-bulk-actions)),
  - which **note is open** in the content area.
- The search is restored in one go: the saved text is put back into the search bar **and** the matching keyword filter is applied at the same time. The notes list therefore always matches what the search bar shows, so the user is never left wondering where their notes went.

---

## 10. Appearance: Light Mode / Dark Mode

- The app offers both **Light mode** and **Dark mode**.
- The user can switch between the two at any time, with the **theme switch in the topbar** (see [Section 12.1](#121-the-topbar)).
- Every screen, including the **loading states** (see [Section 5](#5-loading-states--styling)), is styled for both modes.
- The theme follows the **system setting** (light or dark). How the manual switch interacts with it is not defined yet (see [Section 13.2](#132-still-to-define)).

---

## 11. Export Options

Any note can be **exported** in the following formats:

| # | Format | Description |
|---|--------|-------------|
| 1 | **TXT** | Plain text file |
| 2 | **MD** | Markdown file |
| 3 | **HTML** | Web page file |
| 4 | **PDF** | Portable Document Format |
| 5 | **JPG** | Image file |
| 6 | **DOCX** | Microsoft Word document |

> The original list named **PDF** twice. It is a single format here (see [Section 15](#15-interpretation-notes)).

**Exporting a locked note.** A locked note cannot be exported without unlocking it. Choosing to export prompts the unlock sequence from [Section 7.2](#72-lock-notes), with unlimited tries, and Esc (keyboard) or the cross button (touch) cancels it. Successfully unlocking for export changes the note to **unlocked**, and it stays unlocked until the user locks it again manually. A failed export is an error and is reported through the notifications island (see [Section 12.2](#122-notifications-island)). **Deleted notes can be exported.** Where the export control sits is not defined yet (see [Section 13.2](#132-still-to-define)).

---

## 12. Topbar, Notifications & Account

### 12.1 The Topbar

- The **topbar** is the bar across the top of the app. It is not the editor toolbar (see [Section 2.3](#23-editor-toolbar)).
- It holds the **theme switch** (see [Section 10](#10-appearance-light-mode--dark-mode)), the **notifications island** and the **account icon**, and it is where many more things will be added later.

### 12.2 Notifications Island

- The topbar has a **notifications island**. It combines two separate things: **notifications** that drop to the user, and the **notification history**.
- **All errors** (for example a failed sign-in or a failed export) arrive as notifications, and each one is saved with the **time** it happened.
- By default the island says **"x notifications"**, where x is the number of notifications in the history.
- When a **new notification drops in**, it shows as **one line** with a **cross button** and **stays until the user presses the cross** to close it.
- Pressing the cross **closes** the notification and puts it **into the history**. The island goes back to saying how many notifications are available ("x notifications available").
- Clicking the island **expands** it to show the **history** as a list, and it can be **collapsed** again. Each notification in the history has its own cross, and pressing it **deletes** that notification from the history.
- The history **survives a restart**.

### 12.3 Account Icon and Sign-out

- The **user account icon** is shown at the **rightmost** side of the topbar.
- Clicking it offers the option to **sign out**.
- There is no delete-account option in the current version (see [Section 13.4](#134-future-maybes)).
- Every sign-in provider is a separate account (see [Section 4.3](#43-accounts)).

---

## 13. To-Do & Open Items

Everything the author has not decided yet is recorded here, so nothing is lost. Items are grouped by what kind of decision they need.

### 13.1 Open Problems

1. **Removing a note from a single folder.** Today, deleting a note inside a user-created folder soft-deletes it everywhere, and there is no "remove from this folder" or move action. The author will define an option for this soon; the problem stays open (see [Section 3.1](#31-sidebar)).
2. **Permanent delete.** Provisional until the author explains how it should work. The name "Empty Deleted Notes" is also the author's to choose (see [Section 6](#6-notes-crud-operations)).
3. **Folder icon mechanism.** How users choose their folder icons is "defined later" (see [Section 3.5](#35-folder-row-layout)).
4. **Exact-count placeholders.** Section 5 requires an exact placeholder count with no strategy yet. Options suggested so far, none chosen: save the last count; run a count query; cap the placeholders at a screenful; show a generic loader when the count is unknown (see [Section 5](#5-loading-states--styling)).
5. **Passcode hardening.** Unlimited retries are accepted for now, and attempt limiting should be revisited. The encryption design also needs deciding: a six-digit code has only one million possible values, so if the encryption key is derived from the passcode alone, the content can be tried against all of them offline, with or without a retry limit. Also, because an unlocked note stays unlocked across reloads and sign-outs, its content has to be readable without the passcode while it is unlocked, so the encryption only protects a note while it is locked (see [Section 7.2](#72-lock-notes)).

### 13.2 Still to Define

- **Search bar tools:** the deep filtering and sorting under the search bar, where search results appear, and whether they act on the open folder or on all notes (see [Section 3.1](#31-sidebar) and [Section 9](#9-search-sort--filter)).
- **Reordering** folders and files by hand (see [Section 3.6](#36-default-names-duplicates-and-order)).
- **Export:** where the export control sits (see [Section 11](#11-export-options)).
- **Empty states:** what an empty folder and a search with no results show.
- **Theme switch:** how a manual choice with the switch interacts with the system setting, for example whether it overrides the system setting and is remembered (see [Section 10](#10-appearance-light-mode--dark-mode)).
- **Platform and small screens:** whether the app is web, desktop or mobile, and how the sidebar behaves on small screens. Both keyboard and touch devices are already referred to in [Section 7.2](#72-lock-notes).
- **Tag rules:** allowed characters, letter case, duplicates, and what happens to a tag no note uses (see [Section 2.4](#24-the-editor-area)).
- **Locked-state look:** how the editor area looks for a locked note, including where the unlock prompt appears (see [Section 7.2](#72-lock-notes)).
- **Locked notes in search:** only titles are stated; whether tags and dates of a locked note also match is not (see [Section 9.1](#91-behavior)).
- **Lock message wording:** the exact text of the mismatch message and the "Esc to cancel" hint (see [Section 7.2](#72-lock-notes)).

### 13.3 Pending Documentation Work

- An **Implementation Notes** section is proposed but not written yet.
- **Three Mermaid diagrams** are proposed but not built yet.

### 13.4 Future Maybes

These are outside the current version and may be added later.

- **Delete account** (see [Section 12.3](#123-account-icon-and-sign-out)).
- **Merging accounts** that signed in through different providers or email (see [Section 4.3](#43-accounts)).
- **Searching note content**, if the author decides to (see [Section 9.1](#91-behavior)).

---

## 14. Source Coverage Checklist

Every point from the original brief, plus the specification points added afterwards (rows 36 onward), mapped to where it appears in this document. Rows 67 onward record the latest round of specifications.

| # | Source point | Covered in |
|---|------------------|------------|
| 1 | "yet another notes app" | [Section 1](#1-product-overview) |
| 2 | "competing with bear.app" | [Section 1](#1-product-overview) |
| 3 | "super functionalities" | [Section 1](#1-product-overview) |
| 4 | "seamless md" | [Section 2.1](#21-seamless-markdown-md) |
| 5 | "file-like structure for notes" | [Section 2.2](#22-file-like-structure-for-notes) and [Section 3](#3-sidebar--folder-structure) |
| 6 | "Simple functionalities like login" | [Section 4](#4-authentication-firebase) |
| 7 | Login via **Google** | [Section 4.1](#41-supported-login-methods) |
| 8 | Login via **Apple** | [Section 4.1](#41-supported-login-methods) |
| 9 | Login via **Facebook** | [Section 4.1](#41-supported-login-methods) |
| 10 | Login via **Twitter/X** | [Section 4.1](#41-supported-login-methods) |
| 11 | Login via **GitHub** | [Section 4.1](#41-supported-login-methods) |
| 12 | Login via **Email** | [Section 4.1](#41-supported-login-methods) |
| 13 | Login via **Number** | [Section 4.1](#41-supported-login-methods) |
| 14 | "by firebase" | [Section 4](#4-authentication-firebase) |
| 15 | "beautiful professional attractive loading states with their stylings" | [Section 5](#5-loading-states--styling) |
| 16 | "CRUD Options on notes" | [Section 6](#6-notes-crud-operations) |
| 17 | "pin notes" | [Section 7.1](#71-pin-notes) |
| 18 | "lock notes" | [Section 7.2](#72-lock-notes) |
| 19 | "calendar on notes date for user added date on notes" | [Section 8](#8-calendar--note-dates) |
| 20 | "Search, sort, filter functionality on notes" | [Section 9](#9-search-sort--filter) |
| 21 | …by **user added date** | [Section 9](#9-search-sort--filter) |
| 22 | …by **last edited date** | [Section 9](#9-search-sort--filter) |
| 23 | …by **created date** | [Section 9](#9-search-sort--filter) |
| 24 | …by **title** | [Section 9](#9-search-sort--filter) |
| 25 | …by **tags** | [Section 9](#9-search-sort--filter) |
| 26 | …by **pinned notes** (filter only) | [Section 9](#9-search-sort--filter) |
| 27 | …by **soft deleted notes** (filter only; also the Deleted Notes folder) | [Section 9](#9-search-sort--filter) |
| 28 | "Light mode" | [Section 10](#10-appearance-light-mode--dark-mode) |
| 29 | "dark mode" | [Section 10](#10-appearance-light-mode--dark-mode) |
| 30 | Export as **txt** | [Section 11](#11-export-options) |
| 31 | Export as **md** | [Section 11](#11-export-options) |
| 32 | Export as **HTML** | [Section 11](#11-export-options) |
| 33 | Export as **PDF** (listed twice) | [Section 11](#11-export-options) |
| 34 | Export as **JPG** | [Section 11](#11-export-options) |
| 35 | Export as **DOCX** | [Section 11](#11-export-options) |
| 36 | Per-note six-digit numeric passcode and six-circle entry UI | [Section 7.2](#72-lock-notes) |
| 37 | Permanent delete via HTTP `DELETE` to the Firebase backend, and confirmed Empty Deleted Notes | [Section 6](#6-notes-crud-operations) |
| 38 | Deleted Notes folder for soft-deleted notes | [Section 3.2](#32-default-folders) |
| 39 | Exact-count note-list loading placeholders | [Section 5](#5-loading-states--styling) |
| 40 | Persist search, sort, filter, Select selection, open folders and open note per signed-in user across app restarts | [Section 9.2](#92-persisting-selected-states) |
| 41 | Restore a note from Deleted Notes back to Notes and its folders | [Section 6](#6-notes-crud-operations) |
| 42 | Editor toolbar with all the formatting options | [Section 2.3](#23-editor-toolbar) |
| 43 | Lock button inside the toolbar | [Section 2.3](#23-editor-toolbar) and [Section 7.2](#72-lock-notes) |
| 44 | Locking flow: "Enter a password", then "Enter again" to confirm; locks only if both entries match | [Section 7.2](#72-lock-notes) |
| 45 | Esc aborts locking (refined by row 79) | [Section 7.2](#72-lock-notes) |
| 46 | Passcode is per note and cannot be changed or recovered; deleting the note is the only solution (refined by row 78) | [Section 7.2](#72-lock-notes) |
| 47 | Notes stored in the Firebase backend (target of the HTTP `DELETE` request) | [Section 6](#6-notes-crud-operations) |
| 48 | Folder links kept while a note is in Deleted Notes, so Restore can bring it back to its folders | [Section 6.1](#61-what-a-note-holds) |
| 49 | Deleted notes available both as a folder and as a filter option | [Section 9.1](#91-behavior) |
| 50 | Left-side sidebar used mainly for navigation between files and folders | [Section 3.1](#31-sidebar) |
| 51 | Create folder button and create file button in the sidebar | [Section 3.1](#31-sidebar) |
| 52 | Sidebar actions: select and delete folders and files; copy and paste notes | [Section 3.1](#31-sidebar) |
| 53 | Four compulsory default folders (undeletable, not renamable) in fixed order: Notes, Pinned Notes, Locked Notes, Deleted Notes (refined by row 69) | [Section 3.2](#32-default-folders) |
| 54 | Notes holds all notes; soft-deleted notes are filtered out of Notes and shown only in Deleted Notes (refined by row 69) | [Section 3.2](#32-default-folders) |
| 55 | User-created folders placed after the defaults (for example My Projects, My Routines, Study Material 2026) | [Section 3.3](#33-user-created-folders) |
| 56 | Folders hold links to notes, not copies | [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 57 | Folder row layout: icon, folder name, "x notes", `>` when closed and `v` when open | [Section 3.5](#35-folder-row-layout) |
| 58 | Locked notes available as a filter option, as well as the Locked Notes folder | [Section 9](#9-search-sort--filter) |
| 59 | Deleting a note hides it from Notes and from every folder while its folder links are kept | [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 60 | Pasting a note into folders links the same note, so an edit shows everywhere | [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 61 | Create file with a folder selected links the new note to that folder (refined by row 70) | [Section 3.1](#31-sidebar) |
| 62 | Folders do not nest (for now); user-created folders can be renamed; Folder ID ties notes to folders | [Section 3.3](#33-user-created-folders) |
| 63 | Users choose folder icons (how they choose is defined later) | [Section 3.5](#35-folder-row-layout) |
| 64 | Folder row shows `1 note` for a single note | [Section 3.5](#35-folder-row-layout) |
| 65 | Deleting a user-created folder removes its links; the notes stay in Notes | [Section 3.1](#31-sidebar) and [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 66 | Folders cannot be copied and pasted (they do not nest); copy/paste applies to notes | [Section 3.1](#31-sidebar) |
| 67 | Product name is YANA, Yet Another Notes App (replaces the "Notes App" placeholder) | [Section 1](#1-product-overview) |
| 68 | Default folders ("state folders") are hardcoded filters computed from note state (for example `pinned: true`); user-created folders hold links, a list of Note IDs | [Section 3.2](#32-default-folders) and [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 69 | Notes (default folder) logically holds all notes; it only filters out soft-deleted notes, which Deleted Notes shows (refines rows 53 and 54) | [Section 3.2](#32-default-folders) |
| 70 | A created note is linked only when a user-created folder is selected; with Notes, Pinned Notes, Locked Notes or Deleted Notes selected it is created in Notes with no link (refines row 61) | [Section 3.1](#31-sidebar), [Section 3.4](#34-how-folders-show-notes-filters-and-links) and [Section 6.2](#62-creating-a-note) |
| 71 | Permanent deletion removes the note ID from every user-created folder that lists it, so no orphan links remain | [Section 3.4](#34-how-folders-show-notes-filters-and-links) and [Section 6](#6-notes-crud-operations) |
| 72 | Removing a note from a single folder: an option is coming; problem kept open | [Section 3.1](#31-sidebar) and [Section 13.1](#131-open-problems) |
| 73 | Note content is not searched for now; may be added later | [Section 9.1](#91-behavior) and [Section 13.4](#134-future-maybes) |
| 74 | The sidebar has two items, the search bar and the folders tree; deep filtering and sorting under the search bar are defined later; "the notes list" is defined | [Section 3.1](#31-sidebar), [Section 9](#9-search-sort--filter) and [Section 13.2](#132-still-to-define) |
| 75 | A locking mismatch runs the password setter again with a "does not match" message | [Section 7.2](#72-lock-notes) |
| 76 | Wrong passcode: unlimited retries for now | [Section 7.2](#72-lock-notes) and [Section 13.1](#131-open-problems) |
| 77 | Lock state changes only manually and persists when a note closes, the app reloads or the user signs out; the content area shows one note at a time | [Section 2.4](#24-the-editor-area) and [Section 7.2](#72-lock-notes) |
| 78 | The lock can never be removed (refines row 46) | [Section 7.2](#72-lock-notes) |
| 79 | Esc to cancel on keyboard devices (written on screen) and a cross button on touch devices (refines row 45) | [Section 7.2](#72-lock-notes) |
| 80 | Locked note titles stay visible; locked notes appear in search with titles only | [Section 7.2](#72-lock-notes) and [Section 9.1](#91-behavior) |
| 81 | Exporting a locked note prompts the unlock sequence, with unlimited tries | [Section 11](#11-export-options) |
| 82 | Restoring a locked note keeps it locked | [Section 6](#6-notes-crud-operations) and [Section 7.2](#72-lock-notes) |
| 83 | Locking hides content only: the content is encrypted; other properties such as pinned state and ID stay visible | [Section 7.2](#72-lock-notes) and [Section 15.2](#152-technical-assumptions) |
| 84 | A new note gets a new Note ID and starts unpinned, unlocked and not deleted | [Section 6.2](#62-creating-a-note) |
| 85 | The editor area holds the title, user-added date and tags | [Section 2.4](#24-the-editor-area) |
| 86 | Tags are created on the spot or chosen from existing ones, removed with the x button, and shown only in the editor as a list on top | [Section 2.4](#24-the-editor-area) |
| 87 | Tags are filterable in the sidebar but not shown on each note in the lists | [Section 2.4](#24-the-editor-area) and [Section 9.1](#91-behavior) |
| 88 | Pin icon at the end of each note name in the sidebar: hidden unless pinned, gray on hover, yellow when pinned; clicking pins or unpins | [Section 7.1](#71-pin-notes) |
| 89 | Pin is available in both the sidebar and the content area | [Section 7.1](#71-pin-notes) |
| 90 | The lock button is always in the content area | [Section 2.3](#23-editor-toolbar) and [Section 7.2](#72-lock-notes) |
| 91 | Sort direction is selectable (ascending or descending); the date filter is a range | [Section 9.1](#91-behavior) |
| 92 | Topbar at the top of the app (not the toolbar), holding the theme switch | [Section 10](#10-appearance-light-mode--dark-mode) and [Section 12.1](#121-the-topbar) |
| 93 | Notifications island in the topbar: expandable list, error history with time, one line with a cross | [Section 12.2](#122-notifications-island) |
| 94 | Account icon at the rightmost side of the topbar, with sign-out | [Section 12.3](#123-account-icon-and-sign-out) |
| 95 | No delete account for now; goes to the future maybes | [Section 12.3](#123-account-icon-and-sign-out) and [Section 13.4](#134-future-maybes) |
| 96 | Each provider (and email) is a separate account; merging accounts is out of scope | [Section 4.3](#43-accounts) and [Section 13.4](#134-future-maybes) |
| 97 | Default names New Folder and New Note with numbering; duplicate names allowed and told apart by IDs; sorted by creation time (can be sorted by last edited) | [Section 3.6](#36-default-names-duplicates-and-order) |
| 98 | Reordering folders and files by hand is a to-do | [Section 3.6](#36-default-names-duplicates-and-order) and [Section 13.2](#132-still-to-define) |
| 99 | The only bulk action is Delete: soft delete, or permanent delete for Deleted Notes; a mixed selection does both | [Section 3.7](#37-selection-and-bulk-actions) |
| 100 | Search, filter, sort, selection, open folders and the open note persist per signed-in user across app restarts | [Section 3.7](#37-selection-and-bulk-actions) and [Section 9.2](#92-persisting-selected-states) |
| 101 | Search persists as typed text and its keyword filter is applied at the same time | [Section 9.2](#92-persisting-selected-states) |
| 102 | Permanent delete explanation, folder icon mechanism and exact-count placeholder strategy are recorded as to-dos | [Section 13.1](#131-open-problems) |
| 103 | Implementation Notes section and three Mermaid diagrams are proposed, not built; recorded as to-dos | [Section 13.3](#133-pending-documentation-work) |
| 104 | Errors (for example a failed sign-in or export) are reported through the notifications island | [Section 4.2](#42-behavior), [Section 11](#11-export-options) and [Section 12.2](#122-notifications-island) |
| 105 | The notification island shows a count by default and keeps a newly dropped notification visible until dismissed | [Section 12.2](#122-notifications-island) |
| 106 | Pasting into a default folder is not possible; pasting a note into a user-created folder links the existing note | [Section 3.1](#31-sidebar) and [Section 3.4](#34-how-folders-show-notes-filters-and-links) |
| 107 | User-created folders store Note IDs; notes do not store Folder IDs | [Section 3.4](#34-how-folders-show-notes-filters-and-links) and [Section 6.1](#61-what-a-note-holds) |
| 108 | A new note has empty content (`""`) so the "Enter your note" placeholder appears | [Section 2.4](#24-the-editor-area), [Section 6.1](#61-what-a-note-holds) and [Section 6.2](#62-creating-a-note) |
| 109 | Pinned notes are shown above other notes in the specified lists; manual reordering is not defined | [Section 3.6](#36-default-names-duplicates-and-order) and [Section 7.1](#71-pin-notes) |
| 110 | Theme follows the system setting; deleted notes can be exported | [Section 10](#10-appearance-light-mode--dark-mode) and [Section 11](#11-export-options) |
| 111 | Notifications and notification history are distinct parts of the island; closed notifications enter persistent history and can be deleted there | [Section 12.2](#122-notifications-island) |
| 112 | Lock state changes manually, remains across closing/reloading/sign-out, and locking hides content immediately | [Section 7.2](#72-lock-notes) |

---

## 15. Interpretation Notes

This section records how loosely worded points in the original brief, and the later specification rounds, are read in this document.

### 15.1 Reading of the wording

- **"Number"** (login) is read as phone-number sign-in and is named **Phone number** in the supported-method list.
- **"Celender"** is read as **calendar**.
- **"PDF"**, listed twice in the export formats, is read as one PDF export option.
- **"Twitter/X"** is read as a single sign-in provider, shown as **Twitter / X**.
- **"Seamless md"** is read as writing and formatting Markdown in one flow, with no separate edit and preview modes (see [Section 2.1](#21-seamless-markdown-md)).
- **"File-like structure"** is read as an in-app hierarchy where notes are organized and navigated like files. It does not mean files on the user's operating system (see [Section 2.2](#22-file-like-structure-for-notes) and [Section 3](#3-sidebar--folder-structure)).
- **"All the formatting options"** (toolbar) is read as every Markdown formatting option the app supports (see [Section 2.3](#23-editor-toolbar)).
- **"User added date"** is read as a third date, chosen by the user through the calendar and separate from the automatic created and last edited dates (see [Section 8](#8-calendar--note-dates)).
- **"Loading states with their stylings"** is read as each loading state having its own visual style (see [Section 5](#5-loading-states--styling)).
- **"Soft deleted notes"** is read as the **Deleted Notes** folder: deleting a note moves it there instead of erasing it (see [Section 6](#6-notes-crud-operations) and [Section 3.2](#32-default-folders)).
- **"Search, sort, filter … by [list]"** is read as follows: pinned, locked, and deleted are yes/no states, so they work as filters only, while search and sort apply to the other criteria. Each of the three is also a built-in sidebar folder. This narrows the literal brief, which lists all seven criteria for all three tools, and adds locked notes as a filter (see [Section 9](#9-search-sort--filter)).
- **"File"** in the sidebar (the Create file button) is read as a note.
- **Folders as "a link to the files"** is read as each note existing once, with user-created folders holding links to it instead of copies, and the default folders being filters over the note's state (see [Section 3.4](#34-how-folders-show-notes-filters-and-links)).
- **"Copy pasting files or folders"** is read as copy/paste of notes only: folders cannot be copied and pasted, because they do not nest (see [Section 3.1](#31-sidebar)).
- **"Password"** and **"passcode"** mean the same six-digit code.
- **"YANA"** is read as the product name, short for Yet Another Notes App. It replaces the placeholder "Notes App".
- **"State folders"** and **"default folders"** are the same four folders (see [Section 3.2](#32-default-folders)).
- **"The Notes folder logically contains all the notes"** is read as Notes being a hardcoded filter over every note that is not soft deleted, not as a store that holds the notes (see [Section 3.2](#32-default-folders)).
- **"The sidebar has two items"** (search bar and folders tree) is read as the sidebar's content. The Create folder, Create file, Select, Delete and Copy / paste controls are read as sidebar controls, not as a third item (see [Section 3.1](#31-sidebar)).
- **"The notes list"** is read as the notes shown under an opened folder in the Folders Tree (see [Section 3.1](#31-sidebar)).
- **"Topbar" (not toolbar)** is the bar at the top of the app, separate from the editor toolbar (see [Section 12.1](#121-the-topbar)).
- **"Content area"** is read as the area that shows the open note with its editor toolbar, so the lock button, which is in that toolbar, is in the content area (see [Section 2.3](#23-editor-toolbar)).
- **"Closing a note"** is read as opening another note, since the content area shows one note at a time. Closing a note does not change its lock state (see [Sections 2.4](#24-the-editor-area) and [7.2](#72-lock-notes)).
- **"New Folder going for New Folder 1 2 3"** is read as New Folder, then New Folder 1, 2, 3. New notes follow the same pattern (see [Section 3.6](#36-default-names-duplicates-and-order)).
- **"Sorted by time of creation (can be sorted by time of last edited)"** is read as creation time being the default order and last edited time being the alternative (see [Section 3.6](#36-default-names-duplicates-and-order)).
- **Persisted state.** The later specification clarifies that search, filters, sort, Select selection, open folders and the open note are all restored per signed-in user across app restarts (see [Section 9.2](#92-persisting-selected-states)).
- **Pinned-note ordering.** "Pinned notes will be shown on top" means pinned notes appear above unpinned notes in user-created folders, Notes, Deleted Notes and Locked Notes. Manual reordering of folders and notes is a separate, undefined feature (see [Sections 3.6](#36-default-names-duplicates-and-order) and [7.1](#71-pin-notes)).
- **Empty note content.** A newly created note stores an empty string (`""`); "Enter your note" is a UI placeholder, not initial note content (see [Section 6.2](#62-creating-a-note)).
- **System theme.** The theme follows the operating system setting. How a manual topbar switch overrides or persists beyond that setting remains undecided (see [Sections 10](#10-appearance-light-mode--dark-mode) and [13.2](#132-still-to-define)).
- **Deleted-note export.** Deleted notes are included in "any note can be exported"; the export control's location remains undecided (see [Section 11](#11-export-options)).
- **Locked notes "visible in search (only titles)"** is read as locked notes appearing in search results with only their titles shown (see [Section 9.1](#91-behavior)).
- **Esc and the cross button** are read as applying to every passcode prompt: setting, unlocking and the unlock before an export (see [Section 7.2](#72-lock-notes)).
- **"All errors"** in the notifications island is read as including failed sign-ins and failed exports, which are named as examples (see [Section 12.2](#122-notifications-island)).
- **Pasting into default folders.** Pasting is available only into user-created folders. Default folders are computed filters, not destinations (see [Sections 3.1](#31-sidebar) and [3.4](#34-how-folders-show-notes-filters-and-links)).
- **Folder-link ownership.** The Note ID list is stored in each user-created folder; the note itself does not keep a reverse list of Folder IDs. This avoids maintaining the same relationship in two places (see [Sections 3.4](#34-how-folders-show-notes-filters-and-links) and [6.1](#61-what-a-note-holds)).
- **Notifications and history.** A newly arriving notification remains visible until dismissed. Dismissing it moves it into persistent history; dismissing a history entry deletes it (see [Section 12.2](#122-notifications-island)).
- **Folder note counts.** The count shows the notes a folder shows, so soft-deleted notes are not counted in any folder except Deleted Notes. This follows from soft-deleted notes being hidden everywhere else (see [Section 3.5](#35-folder-row-layout)).

### 15.2 Technical assumptions

- The passcode must never be stored in plaintext and must be verified securely.
- Locking hides the note's content only: the content is **encrypted** and needs unlocking, while other properties (title, pinned state, ID and so on) stay visible. This replaces the earlier assumption that the passcode was only an access check (see [Section 7.2](#72-lock-notes)).
- Locking and unlocking are manual. The lock state persists across note closure, app reloads and sign-outs; setting the lock hides content immediately. The appearance of the locked editor state is still undecided (see [Section 7.2](#72-lock-notes)).
- Wrong passcode attempts are **unlimited for now**. A six-digit code has only one million possible values, which is weak, and the encryption design still has to be decided (see [Section 13.1](#131-open-problems)).
- Every sign-in provider (Google, Apple, Facebook, Twitter / X, GitHub, email, phone number) must be enabled and configured in Firebase Authentication before it works.
- Every provider is its own account (see [Section 4.3](#43-accounts)). By default Firebase Authentication links accounts that share an email address, so its account-linking setting has to be set to create a separate account per provider (worth checking in the Firebase console).
- Which Firebase product stores the notes (for example Firestore or Realtime Database) is an implementation choice.
