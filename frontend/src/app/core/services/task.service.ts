import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTaskRequest, UpdateTaskRequest, TaskResponse } from '../models/task.model';

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

  update(taskId: number, request: UpdateTaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${environment.apiUrl}/tasks/${taskId}`, request);
  }
}
