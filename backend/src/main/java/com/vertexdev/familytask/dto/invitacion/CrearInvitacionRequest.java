package com.vertexdev.familytask.dto.invitacion;

import com.vertexdev.familytask.model.enums.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CrearInvitacionRequest {

    @NotBlank
    @Email(message = "Formato de email inválido")
    private String emailInvitado;

    @NotNull(message = "El rol es requerido")
    private Rol rol;

    @NotNull(message = "El ID de familia es requerido")
    private Long familiaId;
}