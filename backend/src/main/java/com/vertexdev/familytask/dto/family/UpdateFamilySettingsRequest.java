package com.vertexdev.familytask.dto.family;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFamilySettingsRequest {

    @NotNull(message = "El campo rankingEnabled es obligatorio.")
    private Boolean rankingEnabled;
}
