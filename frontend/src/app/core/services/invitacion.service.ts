import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInviteRequest,
  InviteResponse,
  ProcessInviteRequest,
} from '../models/invitacion.model';

@Injectable({ providedIn: 'root' })
export class InvitacionService {

  private readonly tokenKey = environment.invitationTokenKey;

  constructor(private http: HttpClient) {}

  crear(request: CreateInviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${environment.apiUrl}/invitaciones`,
      request
    );
  }

  procesar(request: ProcessInviteRequest): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/invitaciones/procesar`,
      request
    );
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  limpiarToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  hayTokenPendiente(): boolean {
    return !!this.obtenerToken();
  }
}
