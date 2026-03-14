import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInviteRequest,
  InviteResponse,
  ProcessInviteRequest,
} from '../models/invitation.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {

  private readonly tokenKey = environment.invitationTokenKey;

  constructor(private http: HttpClient) {}

  create(request: CreateInviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${environment.apiUrl}/invitaciones`,
      request
    );
  }

  process(request: ProcessInviteRequest): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/invitaciones/procesar`,
      request
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  hasPendingToken(): boolean {
    return !!this.getToken();
  }
}
