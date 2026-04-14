import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CompleteTaskResponse, CreateTaskRequest, UpdateTaskRequest, TaskResponse, TaskStatus } from '../models/task.model';

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

  delete(taskId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/tasks/${taskId}`);
  }

  updateStatus(taskId: number, status: TaskStatus): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${environment.apiUrl}/tasks/${taskId}/status`, { status });
  }

  complete(taskId: number): Observable<CompleteTaskResponse> {
    return this.http.post<CompleteTaskResponse>(`${environment.apiUrl}/tasks/${taskId}/complete`, {});
  }
}
