export interface CrearInvitacionRequest {
  emailInvitado: string;
  rol: 'PADRE_TUTOR' | 'HIJO';
  familiaId: number;
}

export interface InvitacionResponse {
  emailInvitado: string;
  rol: string;
  fechaExpiracion: string;
  linkInvitacion: string;
}

export interface ProcesarInvitacionRequest {
  token: string;
}
