import { signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Composable that encapsulates the isLoading + error signal pair used
 * in every feature component. Replaces the copy-pasted subscribe pattern.
 *
 * Usage:
 *   private readonly ls = injectLoadingState();
 *   readonly isLoading = this.ls.isLoading;
 *   readonly error     = this.ls.error;
 *
 *   submit(): void {
 *     this.ls.run(this.service.create(value), {
 *       next: (result) => this.router.navigate(['/next']),
 *     });
 *   }
 */
export function injectLoadingState() {
  const isLoading = signal(false);
  const error = signal<string | null>(null);

  function run<T>(
    obs$: Observable<T>,
    handlers: { next: (v: T) => void; error?: (e: unknown) => void },
  ): void {
    isLoading.set(true);
    error.set(null);
    obs$.subscribe({
      next: (v) => {
        isLoading.set(false);
        handlers.next(v);
      },
      error: (e: unknown) => {
        isLoading.set(false);
        error.set((e as any)?.error?.message ?? 'Ocurrió un error. Intenta de nuevo.');
        handlers.error?.(e);
      },
    });
  }

  return { isLoading: isLoading.asReadonly(), error: error.asReadonly(), run };
}
