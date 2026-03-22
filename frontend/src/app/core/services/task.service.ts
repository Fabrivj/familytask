import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateTaskRequest, FamilyMembersResponse, MemberItemResponse, TaskResponse } from '../models/task.model';
import { SKIP_AUTH_REDIRECT_ON_403 } from '../interceptors/skip-auth-redirect.token';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  private skipRedirectContext(): HttpContext {
    return new HttpContext().set(SKIP_AUTH_REDIRECT_ON_403, true);
  }

  getTasks(familyId: number): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${environment.apiUrl}/tasks`, {
      params: { familyId: familyId.toString() },
      context: this.skipRedirectContext(),
    });
  }

  create(request: CreateTaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${environment.apiUrl}/tasks`, request, {
      context: this.skipRedirectContext(),
    });
  }

  getMembers(familyId: number): Observable<MemberItemResponse[]> {
    return this.http.get<FamilyMembersResponse>(
      `${environment.apiUrl}/families/${familyId}/members`,
      { context: this.skipRedirectContext() },
    ).pipe(map(res => res.members));
  }
}
