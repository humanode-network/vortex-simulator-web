export function focusCourtField(fieldId: string): void {
  window.requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
}
