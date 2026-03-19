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

export interface MemberItem {
  id: number;
  name: string;
  email: string;
  pictureUrl: string;
  role: 'PARENT' | 'CHILD';
  joinedAt: string;
}

export interface PendingInvitation {
  email: string;
  role: 'PARENT' | 'CHILD';
  token: string;
  createdAt: string;
  expirationDate: string;
}

export interface FamilyMembersResponse {
  members: MemberItem[];
  pendingInvitations: PendingInvitation[];
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

  getMembers(familyId: number): Observable<FamilyMembersResponse> {
    return this.http.get<FamilyMembersResponse>(
      `${environment.apiUrl}/families/${familyId}/members`
    );
  }
}
