import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SuggestionListResponse, SuggestionRequest } from '@core/models/suggestion.model';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private readonly http = inject(HttpClient);

  getSuggestions(request: SuggestionRequest): Observable<SuggestionListResponse> {
    return this.http.post<SuggestionListResponse>(`${environment.apiUrl}/ai/suggestions`, request);
  }
}
