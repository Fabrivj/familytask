package com.vertexdev.familytask.dto.habit;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHabitRequest {

    @NotBlank(message = "El campo Título es obligatorio.")
    @Size(max = 100, message = "El título no puede superar los 100 caracteres.")
    private String title;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres.")
    private String description;

    @NotBlank(message = "El campo Frecuencia es obligatorio.")
    private String frequency;

    @NotNull(message = "Los puntos deben ser un número entero mayor a cero.")
    @Min(value = 1, message = "Los puntos deben ser un número entero mayor a cero.")
    private Integer xpReward;

    @NotNull(message = "Las monedas deben ser un número entero mayor a cero.")
    @Min(value = 1, message = "Las monedas deben ser un número entero mayor a cero.")
    private Integer coinsReward;

    @NotBlank(message = "El campo Zona es obligatorio.")
    private String location;

    private Long familyId;
}
