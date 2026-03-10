package com.vertexdev.familytask.dto.invitacion;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvitacionResponse {
    private String emailInvitado;
    private String rol;
    private LocalDateTime fechaExpiracion;
    private String linkInvitacion;   // la URL completa con el token para compartir
}