import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateFamilyRequest {
  name: string;
}

export interface FamilyResponse {
  id: number;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  constructor(private http: HttpClient) {}

  create(request: CreateFamilyRequest): Observable<FamilyResponse> {
    return this.http.post<FamilyResponse>(
      `${environment.apiUrl}/familias`,
      request
    );
  }
}
