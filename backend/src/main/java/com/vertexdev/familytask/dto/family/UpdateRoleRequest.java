package com.vertexdev.familytask.dto.family;

import com.vertexdev.familytask.model.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRoleRequest {

    @NotNull(message = "El rol es obligatorio.")
    private Role role;
}
