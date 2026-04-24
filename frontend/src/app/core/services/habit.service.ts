import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AssignHabitRequest, CompleteHabitResponse, CreateHabitRequest, HabitResponse, UpdateHabitRequest } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly http = inject(HttpClient);

  getHabits(familyId: number): Observable<HabitResponse[]> {
    return this.http.get<HabitResponse[]>(`${environment.apiUrl}/habits`, {
      params: { familyId },
    });
  }

  create(request: CreateHabitRequest): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(`${environment.apiUrl}/habits`, request);
  }

  assign(habitId: number, request: AssignHabitRequest): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(`${environment.apiUrl}/habits/${habitId}/assign`, request);
  }

  complete(habitId: number): Observable<CompleteHabitResponse> {
    return this.http.post<CompleteHabitResponse>(`${environment.apiUrl}/habits/${habitId}/complete`, {});
  }

  update(habitId: number, request: UpdateHabitRequest): Observable<HabitResponse> {
    return this.http.put<HabitResponse>(`${environment.apiUrl}/habits/${habitId}`, request);
  }

  delete(habitId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/habits/${habitId}`);
  }
}
