package com.vertexdev.familytask.dto.invitacion;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProcesarInvitacionRequest {

    @NotBlank(message = "El token es requerido")
    private String token;
}