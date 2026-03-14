import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, UserSession, FamilySummary } from '../models/auth.model';
import { Observable, tap, map } from 'rxjs';

const SESSION_KEY = 'ft_session';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly _session = signal<UserSession | null>(this.loadSavedSession());

  // Public read-only signal
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly families = computed(() => this._session()?.families ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Step 1: Redirect the user to Google ──────────────────────────────────
  redirectToGoogle(): void {
    const { clientId, redirectUri, scope, authEndpoint } = environment.google;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'online',
      prompt: 'select_account',
    });

    window.location.href = `${authEndpoint}?${params.toString()}`;
  }

  // ─── Step 2: Send the code to the backend ─────────────────────────────────
  processGoogleCallback(code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google/callback`, { code })
      .pipe(
        tap(response => this.saveSession(response))
      );
  }

  // ─── Convenience getters ──────────────────────────────────────────────────
  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  getActiveFamilyId(): number | null {
    return this._session()?.activeFamilyId ?? null;
  }

  setActiveFamily(familyId: number): void {
    const currentSession = this._session();
    if (!currentSession) return;

    const updated: UserSession = { ...currentSession, activeFamilyId: familyId };
    this._session.set(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/logout`, {});
  }

  clearLocalSession(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────
  private saveSession(response: AuthResponse): void {
    const session: UserSession = { ...response };
    this._session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  addFamily(family: FamilySummary): void {
    const currentSession = this._session();
    if (!currentSession) return;

    const updated: UserSession = {
      ...currentSession,
      families: [...currentSession.families, family],
    };
    this._session.set(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  refreshSession(): Observable<void> {
    return this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap(response => {
        const currentSession = this._session();
        if (!currentSession) return;
        const updated: UserSession = {
          ...currentSession,
          families: response.families,
        };
        this._session.set(updated);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }),
      map(() => void 0)
    );
  }

  private loadSavedSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
