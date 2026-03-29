package com.vertexdev.familytask.dto.space;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateSpaceRequest {

    @NotNull(message = "El identificador de familia es obligatorio.")
    private Long familyId;

    @NotBlank(message = "El nombre debe tener entre 2 y 50 caracteres.")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres.")
    private String name;

    @NotBlank(message = "El tipo de espacio es obligatorio.")
    private String type;
}
