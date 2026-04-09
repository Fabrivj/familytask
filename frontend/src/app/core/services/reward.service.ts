import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRewardRequest, RewardResponse, UpdateRewardRequest } from '../models/reward.model';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly http = inject(HttpClient);

  getRewards(familyId: number): Observable<RewardResponse[]> {
    return this.http.get<RewardResponse[]>(`${environment.apiUrl}/rewards`, {
      params: { familyId },
    });
  }

  create(request: CreateRewardRequest): Observable<RewardResponse> {
    return this.http.post<RewardResponse>(`${environment.apiUrl}/rewards`, request);
  }

  update(rewardId: number, request: UpdateRewardRequest): Observable<RewardResponse> {
    return this.http.patch<RewardResponse>(`${environment.apiUrl}/rewards/${rewardId}`, request);
  }

  delete(rewardId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/rewards/${rewardId}`);
  }
}
