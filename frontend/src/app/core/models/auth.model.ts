export interface FamiliaResumen {
  familiaId: number;
  familiaNombre: string;
  rol: 'PADRE_TUTOR' | 'HIJO';
}

export interface AuthResponse {
  token: string;
  email: string;
  nombre: string;
  fotoPerfil: string;
  familias: FamiliaResumen[];
}

export interface UsuarioSesion {
  token: string;
  email: string;
  nombre: string;
  fotoPerfil: string;
  familias: FamiliaResumen[];
  familiaActivaId?: number;
}
