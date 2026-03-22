import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FamilyMembersResponse } from '../models/member.model';

// Único punto de contacto con el endpoint de miembros de familia.
// Tanto FamilyService (gestión) como TaskService (asignaciones) lo usan.
@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);

  getMembers(familyId: number): Observable<FamilyMembersResponse> {
    return this.http.get<FamilyMembersResponse>(
      `${environment.apiUrl}/families/${familyId}/members`
    );
  }
}
