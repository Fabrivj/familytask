import { AbstractControl } from '@angular/forms';

/**
 * Returns the first matching validation error message for a form control.
 * Replaces the repetitive `getXxxError()` getter pattern across components.
 *
 * Usage:
 *   getTitleError = () => fieldError(this.titleCtrl, {
 *     required: 'El campo Título es obligatorio.',
 *     maxlength: 'Máximo 100 caracteres.',
 *   });
 */
export function fieldError(
  ctrl: AbstractControl,
  rules: Record<string, string>,
): string {
  for (const [key, msg] of Object.entries(rules)) {
    if (ctrl.hasError(key)) return msg;
  }
  return '';
}
