import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CrearFamiliaRequest {
  nombre: string;
}

export interface FamiliaResponse {
  id: number;
  nombre: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class FamiliaService {
  constructor(private http: HttpClient) {}

  crear(request: CrearFamiliaRequest): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(
      `${environment.apiUrl}/familias`,
      request
    );
  }
}
