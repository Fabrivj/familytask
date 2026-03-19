package com.vertexdev.familytask.dto.task;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "El campo Título es obligatorio.")
    @Size(max = 100, message = "El título no puede superar los 100 caracteres.")
    private String title;

    @NotBlank(message = "El campo Descripción es obligatorio.")
    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres.")
    private String description;

    @NotNull(message = "El campo Prioridad es obligatorio.")
    private String priority;

    @NotNull(message = "Los puntos deben ser un número entero mayor a cero.")
    @Min(value = 1, message = "Los puntos deben ser un número entero mayor a cero.")
    private Integer xpReward;

    @NotNull(message = "Las monedas deben ser un número entero mayor a cero.")
    @Min(value = 1, message = "Las monedas deben ser un número entero mayor a cero.")
    private Integer coinsReward;

    @NotBlank(message = "El campo Ubicación es obligatorio.")
    private String location;

    private Long familyId;

    private LocalDateTime dueDate;
}
