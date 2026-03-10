package com.vertexdev.familytask.dto.invitacion;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InviteResponse {
    private String invitedEmail;
    private String role;
    private LocalDateTime expirationDate;
    private String inviteLink;   // la URL completa con el token para compartir
}