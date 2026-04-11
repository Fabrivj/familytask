import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RedeemRewardRequest, RedemptionResponse } from '../models/redemption.model';

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
}
