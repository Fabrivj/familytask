import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CreateInviteRequest,
  InviteDetailsResponse,
  InviteResponse,
  ProcessInviteRequest,
} from '../models/invitation.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {

  private readonly tokenKey = environment.invitationTokenKey;

  constructor(private http: HttpClient) {}

  create(request: CreateInviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${environment.apiUrl}/invitations`,
      request
    );
  }

  /** Obtiene detalles de la invitación para preview (sin JWT). */
  getDetails(token: string): Observable<InviteDetailsResponse> {
    return this.http.get<InviteDetailsResponse>(
      `${environment.apiUrl}/invitations/preview`,
      { params: { token } }
    );
  }

  cancel(token: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/invitations/${token}`
    );
  }

  process(request: ProcessInviteRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/invitations/process`,
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
