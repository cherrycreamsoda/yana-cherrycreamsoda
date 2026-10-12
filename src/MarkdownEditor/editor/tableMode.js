import { StateEffect } from '@codemirror/state'

export const tableSourceModeEffect = StateEffect.define()
export const tableSourceEnterEffect = StateEffect.define()

export function revealTableSource(view, range) {
  view.dispatch({
    effects: tableSourceModeEffect.of(range),
    selection: { anchor: range.from, head: range.to },
    scrollIntoView: true,
  })
  view.focus()
}
