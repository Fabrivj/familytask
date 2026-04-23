import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface CreateFamilyRequest {
  name: string;
}

export interface FamilyResponse {
  id: number;
  name: string;
  role: string;
  rankingEnabled?: boolean;
}

export interface FamilyActivityResponse {
  id: number;
  action: string;
  performedByName: string;
  performedByPictureUrl: string;
  targetUserName: string | null;
  details: string;
  createdAt: string;
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

  updateMemberAdmin(familyId: number, userId: number, isAdmin: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}/admin`,
      { isAdmin }
    );
  }

  removeMember(familyId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}`
    );
  }

  getFamilyConfig(familyId: number): Observable<FamilyResponse> {
    return this.http.get<FamilyResponse>(
      `${environment.apiUrl}/families/${familyId}/settings`
    );
  }

  updateSettings(familyId: number, rankingEnabled: boolean): Observable<FamilyResponse> {
    return this.http.patch<FamilyResponse>(
      `${environment.apiUrl}/families/${familyId}/settings`,
      { rankingEnabled }
    );
  }

  getActivityLog(familyId: number, page = 0, size = 20): Observable<FamilyActivityResponse[]> {
    return this.http.get<FamilyActivityResponse[]>(
      `${environment.apiUrl}/families/${familyId}/activity`,
      { params: { page: page.toString(), size: size.toString() } }
    );
  }
}
