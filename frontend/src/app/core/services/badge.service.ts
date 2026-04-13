import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BadgeResponse } from '../models/badge.model';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private readonly http = inject(HttpClient);

  getBadges(familyId: number): Observable<BadgeResponse[]> {
    return this.http.get<BadgeResponse[]>(`${environment.apiUrl}/families/${familyId}/badges`);
  }
}
