package com.vertexdev.familytask.dto.invite;

import com.vertexdev.familytask.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateInviteRequest {

    @NotBlank(message = "El correo ingresado no es válido.")
    @Email(message = "El correo ingresado no es válido.")
    private String invitedEmail;

    @NotNull(message = "El rol es requerido")
    private Role role;

    @NotNull(message = "El ID de familia es requerido")
    private Long familyId;
}