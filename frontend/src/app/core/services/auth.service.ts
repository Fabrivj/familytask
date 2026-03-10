import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, UsuarioSesion, FamiliaResumen } from '../models/auth.model';
import { Observable, tap, map } from 'rxjs';

const SESSION_KEY = 'ft_session';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly _sesion = signal<UsuarioSesion | null>(this.cargarSesionGuardada());

  // Signal público de solo lectura
  readonly sesion = this._sesion.asReadonly();
  readonly estaAutenticado = computed(() => this._sesion() !== null);
  readonly familias = computed(() => this._sesion()?.familias ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Paso 1: Redirigir al usuario a Google ───────────────────────────────────
  redirigirAGoogle(): void {
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

  // ─── Paso 2: Enviar el código al backend ─────────────────────────────────────
  procesarGoogleCallback(code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google/callback`, { code })
      .pipe(
        tap(response => this.guardarSesion(response))
      );
  }

  // ─── Getters de conveniencia ─────────────────────────────────────────────────
  getToken(): string | null {
    return this._sesion()?.token ?? null;
  }

  getFamiliaActivaId(): number | null {
    return this._sesion()?.familiaActivaId ?? null;
  }

  setFamiliaActiva(familiaId: number): void {
    const sesionActual = this._sesion();
    if (!sesionActual) return;

    const actualizada: UsuarioSesion = { ...sesionActual, familiaActivaId: familiaId };
    this._sesion.set(actualizada);
    localStorage.setItem(SESSION_KEY, JSON.stringify(actualizada));
  }

  // ─── Cerrar sesión ───────────────────────────────────────────────────────────
  cerrarSesion(): void {
    this._sesion.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/auth/login']);
  }

  // ─── Internos ────────────────────────────────────────────────────────────────
  private guardarSesion(response: AuthResponse): void {
    const sesion: UsuarioSesion = { ...response };
    this._sesion.set(sesion);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  }

  agregarFamilia(familia: FamiliaResumen): void {
    const sesionActual = this._sesion();
    if (!sesionActual) return;

    const actualizada: UsuarioSesion = {
      ...sesionActual,
      familias: [...sesionActual.familias, familia],
    };
    this._sesion.set(actualizada);
    localStorage.setItem(SESSION_KEY, JSON.stringify(actualizada));
  }

  refrescarSesion(): Observable<void> {
    return this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap(response => {
        const sesionActual = this._sesion();
        if (!sesionActual) return;
        const actualizada: UsuarioSesion = {
          ...sesionActual,
          familias: response.familias,
        };
        this._sesion.set(actualizada);
        localStorage.setItem(SESSION_KEY, JSON.stringify(actualizada));
      }),
      map(() => void 0)
    );
  }

  private cargarSesionGuardada(): UsuarioSesion | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
