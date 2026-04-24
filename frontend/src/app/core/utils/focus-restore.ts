/**
 * Composable that saves and restores focus to the element that triggered
 * a panel or modal. Eliminates the repeated _panelTrigger / _deleteTrigger
 * pattern across components.
 *
 * Usage:
 *   private readonly panelFocus = createFocusRestore();
 *
 *   openPanel(): void {
 *     this.panelFocus.save();
 *     // ...show panel
 *   }
 *   closePanel(): void {
 *     // ...hide panel
 *     this.panelFocus.restore();
 *   }
 */
export function createFocusRestore() {
  let trigger: HTMLElement | null = null;
  return {
    save(): void {
      trigger = document.activeElement as HTMLElement;
    },
    restore(): void {
      trigger?.focus();
      trigger = null;
    },
  };
}
