package com.vertexdev.familytask.dto.family;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateAdminRequest {

    @NotNull(message = "El estado de administrador es obligatorio.")
    private Boolean isAdmin;
}
