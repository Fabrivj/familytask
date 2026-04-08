package com.vertexdev.familytask.dto.habit;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignHabitRequest {

    @NotNull(message = "El identificador de familia es obligatorio.")
    private Long familyId;

    @NotNull(message = "Debe seleccionar un miembro para asignar el hábito.")
    private Long assignedToId;
}
