package com.vertexdev.familytask.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFamilyRequest {

    private static final String VALIDATION_MSG =
            "El nombre debe tener entre 3 y 50 caracteres y no puede contener caracteres inválidos.";

    @NotBlank(message = VALIDATION_MSG)
    @Size(min = 3, max = 50, message = VALIDATION_MSG)
    @Pattern(regexp = "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \\-'.]+$", message = VALIDATION_MSG)
    private String name;
}