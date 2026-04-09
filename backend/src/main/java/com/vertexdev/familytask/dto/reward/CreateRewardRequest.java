package com.vertexdev.familytask.dto.reward;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRewardRequest {

    @NotNull(message = "El identificador de familia es obligatorio.")
    private Long familyId;

    @NotBlank(message = "El nombre de la recompensa es obligatorio.")
    @Size(min = 3, max = 60, message = "El nombre debe tener entre 3 y 60 caracteres.")
    private String name;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres.")
    private String description;

    @Size(max = 50)
    private String icon;

    @Min(value = 1, message = "El nivel mínimo debe ser mayor a 0.")
    private Integer minLevel;

    @NotNull(message = "El costo debe ser mayor a 0.")
    @Min(value = 1, message = "El costo debe ser mayor a 0.")
    private Integer cost;
}
