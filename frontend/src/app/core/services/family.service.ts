import { Injectable, inject } from '@angular/core';
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
  private readonly http = inject(HttpClient);

  create(request: CreateFamilyRequest): Observable<FamilyResponse> {
    return this.http.post<FamilyResponse>(
      `${environment.apiUrl}/families`,
      request
    );
  }

  updateName(familyId: number, request: CreateFamilyRequest): Observable<FamilyResponse> {
    return this.http.patch<FamilyResponse>(
      `${environment.apiUrl}/families/${familyId}`,
      request
    );
  }

  updateMemberRole(familyId: number, userId: number, role: 'PARENT' | 'CHILD'): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}/role`,
      { role }
    );
  }

  removeMember(familyId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}`
    );
  }
}
