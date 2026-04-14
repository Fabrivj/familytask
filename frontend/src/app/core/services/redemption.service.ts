import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { RedeemRewardRequest, RedemptionResponse, UpdateRedemptionStatusRequest } from '../models/redemption.model';

@Injectable({ providedIn: 'root' })
export class RedemptionService {
  private readonly http = inject(HttpClient);

  requestRedemption(request: RedeemRewardRequest): Observable<RedemptionResponse> {
    return this.http.post<RedemptionResponse>(`${environment.apiUrl}/redemptions`, request);
  }

  getMyRedemptions(familyId: number): Observable<RedemptionResponse[]> {
    return this.http.get<RedemptionResponse[]>(`${environment.apiUrl}/redemptions`, {
      params: { familyId },
    });
  }

  updateStatus(redemptionId: number, request: UpdateRedemptionStatusRequest): Observable<RedemptionResponse> {
    return this.http.patch<RedemptionResponse>(
      `${environment.apiUrl}/redemptions/${redemptionId}/status`,
      request,
    );
  }
}
