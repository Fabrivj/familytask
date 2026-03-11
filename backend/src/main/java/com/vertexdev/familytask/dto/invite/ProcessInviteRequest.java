package com.vertexdev.familytask.dto.invite;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProcessInviteRequest {

    @NotBlank(message = "El token es requerido")
    private String token;
}