import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateHabitRequest, HabitResponse } from '../models/habit.model';

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

  delete(habitId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/habits/${habitId}`);
  }
}
