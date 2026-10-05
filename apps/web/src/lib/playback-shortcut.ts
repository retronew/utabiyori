export function canTogglePlayback(
  event: Pick<
    KeyboardEvent,
    | 'key'
    | 'repeat'
    | 'isComposing'
    | 'keyCode'
    | 'defaultPrevented'
    | 'altKey'
    | 'ctrlKey'
    | 'metaKey'
    | 'shiftKey'
  >,
  blocked: boolean,
) {
  return (
    event.key === ' ' &&
    !blocked &&
    !event.repeat &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  )
}

export const shortcutExcluded =
  'input, textarea, select, button, a[href], audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="button"], [role="slider"], [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], [role="tab"], [role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]'
