import { Injectable, signal } from '@angular/core';
import { SuggestionCategory, SuggestionItem } from '@core/models/suggestion.model';

@Injectable({ providedIn: 'root' })
export class SuggestionStateService {
  readonly suggestions = signal<SuggestionItem[]>([]);
  readonly prefetchedSuggestions = signal<SuggestionItem[] | null>(null);
  readonly isPrefetching = signal(false);
  readonly selectedCategory = signal<SuggestionCategory | ''>('');
  readonly selectedMemberUserId = signal<number | null>(null);
  readonly infoMessage = signal('');

  resetPrefetch(): void {
    this.prefetchedSuggestions.set(null);
    this.isPrefetching.set(false);
  }

  clearAll(): void {
    this.suggestions.set([]);
    this.prefetchedSuggestions.set(null);
    this.isPrefetching.set(false);
    this.infoMessage.set('');
  }
}
