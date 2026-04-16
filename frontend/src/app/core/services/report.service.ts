import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { WeeklyReportResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  getWeeklyReport(params: {
    familyId: number;
    weekStart: string;
    memberId?: number | null;
    spaceId?: number | null;
  }): Observable<WeeklyReportResponse> {
    const query: Record<string, string | number> = {
      familyId: params.familyId,
      weekStart: params.weekStart,
    };
    if (params.memberId != null) query['memberId'] = params.memberId;
    if (params.spaceId  != null) query['spaceId']  = params.spaceId;

    return this.http.get<WeeklyReportResponse>(`${environment.apiUrl}/reports/weekly`, {
      params: query,
    });
  }
}
