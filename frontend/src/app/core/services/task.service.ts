import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateTaskRequest, FamilyMembersResponse, MemberItemResponse, TaskResponse } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  getTasks(familyId: number): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${environment.apiUrl}/tasks`, {
      params: { familyId: familyId.toString() },
    });
  }

  create(request: CreateTaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${environment.apiUrl}/tasks`, request);
  }

  getMembers(familyId: number): Observable<MemberItemResponse[]> {
    return this.http.get<FamilyMembersResponse>(
      `${environment.apiUrl}/families/${familyId}/members`
    ).pipe(map(res => res.members));
  }
}
