import { runToolbarAction } from '../editor/actions.js'

export function ToolbarButton({ action, label, title, viewRef, children }) {
  return (
    <button
      type="button"
      className="md-toolbar-button"
      aria-label={label}
      title={title ?? label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        runToolbarAction(viewRef.current, action)
        event.currentTarget.closest('details')?.removeAttribute('open')
      }}
    >
      {children ?? label}
    </button>
  )
}

export function ToolbarMenu({ title, viewRef, actions }) {
  return (
    <details className="md-toolbar-menu">
      <summary aria-label={title}>{title}<span aria-hidden="true">⌄</span></summary>
      <div className="md-toolbar-menu-panel">
        {actions.map(([action, label]) => (
          <ToolbarButton
            key={action}
            action={action}
            label={label}
            viewRef={viewRef}
          />
        ))}
      </div>
    </details>
  )
}
