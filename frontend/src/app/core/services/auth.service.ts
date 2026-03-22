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

  /** The FamilySummary for the currently active family, if any. */
  readonly activeFamily = computed(() => {
    const activeId = this._session()?.activeFamilyId;
    return this.families().find(f => f.familyId === activeId);
  });

  /** Human-readable role label for the active family, e.g. "Padre · Admin" */
  readonly activeRoleLabel = computed(() => {
    const family = this.activeFamily();
    if (family?.role === 'PARENT') return family.isAdmin ? 'Padre · Admin' : 'Padre · Tutor';
    if (family?.role === 'CHILD') return 'Hijo/a';
    return '';
  });

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Step 1: Redirect the user to Google ──────────────────────────────────
  redirectToGoogle(invitationToken?: string): void {
    const { clientId, redirectUri, scope, authEndpoint } = environment.google;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'online',
      prompt: 'select_account',
      ...(invitationToken ? { state: invitationToken } : {}),
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

  /** Performs the full logout flow: HTTP call → clear session → navigate to login.
   *  Components subscribe only to handle the error case locally. */
  performLogout(): Observable<never> {
    return new Observable(observer => {
      this.logout().subscribe({
        next: (response) => {
          this.clearLocalSession();
          this.router.navigate(['/auth/login'], { state: { message: response.message } });
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
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

  updateFamilyName(familyId: number, newName: string): void {
    const currentSession = this._session();
    if (!currentSession) return;

    const updated: UserSession = {
      ...currentSession,
      families: currentSession.families.map(f =>
        f.familyId === familyId ? { ...f, familyName: newName } : f
      ),
    };
    this._session.set(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
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
      if (!raw) return null;
      const session: UserSession = JSON.parse(raw);
      if (this.isJwtExpired(session.token)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  private isJwtExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
