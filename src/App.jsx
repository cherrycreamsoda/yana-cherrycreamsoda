import { useEffect, useState } from 'react'
import { MarkdownEditor } from './MarkdownEditor/MarkdownEditor.jsx'
import './App.css'

const THEME_STORAGE_KEY = 'yana-theme'
const DRAFT_STORAGE_KEY = 'yana-markdown-draft-v1'
const NOTE_VIEWS = [
  {
    label: 'Notes',
    icon: <><path d="M6 3.75h8l4 4v12.5H6z" /><path d="M14 3.75v4h4M9 12h6m-6 3.5h6" /></>,
  },
  {
    label: 'Pinned Notes',
    icon: <><path d="m9 4 6 6m-8-2 8 8m-3-11 5 5-3 1-3 3-1 3-5-5 3-1 3-3zM5 19l4-4" /></>,
  },
  {
    label: 'Locked Notes',
    icon: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" /></>,
  },
  {
    label: 'Deleted Notes',
    icon: <><path d="M4 7h16m-14 0 1 13h10l1-13M9 7V4h6v3m-4 4v5m3-5v5" /></>,
  },
]

function getInitialDraft() {
  try {
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!savedDraft) return { title: '', content: '' }

    const draft = JSON.parse(savedDraft)
    return {
      title: typeof draft.title === 'string' ? draft.title : '',
      content: typeof draft.content === 'string' ? draft.content : '',
    }
  } catch (error) {
    console.error('Unable to read the saved Markdown draft.', error)
    return { title: '', content: '' }
  }
}

function getInitialAppearance() {
  let savedTheme = null

  try {
    savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch (error) {
    console.error('Unable to read the saved theme preference.', error)
  }

  const hasSavedTheme = savedTheme === 'light' || savedTheme === 'dark'
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

  return {
    theme: hasSavedTheme ? savedTheme : systemTheme,
    hasSavedTheme,
  }
}

function App() {
  const [appearance, setAppearance] = useState(getInitialAppearance)
  const [draft, setDraft] = useState(getInitialDraft)
  const [saveStatus, setSaveStatus] = useState('Saved locally')

  useEffect(() => {
    document.documentElement.dataset.theme = appearance.theme
  }, [appearance.theme])

  useEffect(() => {
    if (appearance.hasSavedTheme) {
      return undefined
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = (event) => {
      setAppearance({ theme: event.matches ? 'dark' : 'light', hasSavedTheme: false })
    }

    systemTheme.addEventListener('change', updateTheme)
    return () => systemTheme.removeEventListener('change', updateTheme)
  }, [appearance.hasSavedTheme])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSaveStatus('Saving…')
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        setSaveStatus('Saved locally')
      } catch (error) {
        console.error('Unable to save the Markdown draft locally.', error)
        setSaveStatus('Could not save locally — copy your Markdown before leaving')
      }
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [draft])

  function toggleTheme() {
    setAppearance((current) => {
      const theme = current.theme === 'dark' ? 'light' : 'dark'

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
      } catch (error) {
        console.error('Unable to save the theme preference.', error)
      }

      return { theme, hasSavedTheme: true }
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="create-note-button"
          type="button"
          aria-label="Create new note (coming soon)"
          aria-disabled="true"
          title="Create new note — coming soon"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="create-note-tooltip" role="tooltip">Create new note · Coming soon</span>
        </button>

        <div className="topbar-actions">
          <button
            className="icon-button theme-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${appearance.theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${appearance.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {appearance.theme === 'dark' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.7 8.7 0 1 0 20.2 15.3Z" />
              </svg>
            )}
          </button>
          <button className="icon-button profile-button" type="button" aria-label="Profile: coming soon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
            <span className="tooltip" role="tooltip">Coming soon</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar" aria-label="Notes">
          <label className="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input type="search" placeholder="Search notes" aria-label="Search notes" />
          </label>
          <nav className="sidebar-nav" aria-label="Note views">
            {NOTE_VIEWS.map(({ label, icon }) => (
              <button
                className="sidebar-nav-item"
                type="button"
                key={label}
                aria-disabled="true"
              >
                <span className="sidebar-nav-label">
                  <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                  <span>{label}</span>
                </span>
                <span className="coming-soon-label">Coming soon</span>
              </button>
            ))}
          </nav>
          <section className="folder-section" aria-label="Folder hierarchy">
            <h2>Folders</h2>
            <p>Folder hierarchy coming soon</p>
          </section>
        </aside>

        <section className="editor" aria-label="Editor">
          <div className="editor-fields">
            <div className="editor-title-canvas">
              <input
                className="title-input"
                type="text"
                placeholder="Untitled"
                aria-label="Note title"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <MarkdownEditor
              value={draft.content}
              onChange={(content) => setDraft((current) => ({ ...current, content }))}
              status={saveStatus}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
