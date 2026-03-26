import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSpaceRequest, SpaceResponse } from '../models/space.model';

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/spaces`;

  getSpaces(familyId: number): Observable<SpaceResponse[]> {
    const params = new HttpParams().set('familyId', familyId);
    return this.http.get<SpaceResponse[]>(this.baseUrl, { params });
  }

  create(request: CreateSpaceRequest): Observable<SpaceResponse> {
    return this.http.post<SpaceResponse>(this.baseUrl, request);
  }
}
