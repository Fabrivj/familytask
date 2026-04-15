import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateSpaceRequest, SpaceResponse, UpdateSpaceRequest } from '../models/space.model';

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

  update(spaceId: number, request: UpdateSpaceRequest): Observable<SpaceResponse> {
    return this.http.put<SpaceResponse>(`${this.baseUrl}/${spaceId}`, request);
  }

  delete(spaceId: number, familyId: number, targetSpaceId?: number): Observable<void> {
    let params = new HttpParams().set('familyId', familyId);
    if (targetSpaceId != null) {
      params = params.set('targetSpaceId', targetSpaceId);
    }
    return this.http.delete<void>(`${this.baseUrl}/${spaceId}`, { params });
  }
}
