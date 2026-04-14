import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { RedemptionHistoryParams, RedemptionHistoryResponse } from '../models/redemption.model';

@Injectable({ providedIn: 'root' })
export class RedemptionHistoryService {
  private readonly http = inject(HttpClient);

  getHistory(params: RedemptionHistoryParams): Observable<RedemptionHistoryResponse[]> {
    let httpParams = new HttpParams().set('familyId', params.familyId);
    if (params.memberId != null) httpParams = httpParams.set('memberId', params.memberId);
    if (params.status   != null) httpParams = httpParams.set('status',   params.status);
    if (params.dateFrom != null) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo   != null) httpParams = httpParams.set('dateTo',   params.dateTo);

    return this.http.get<RedemptionHistoryResponse[]>(
      `${environment.apiUrl}/redemptions/history`,
      { params: httpParams }
    );
  }
}
