package com.vertexdev.familytask.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SuggestionRequest {

    @NotNull(message = "El identificador de familia es obligatorio.")
    private Long familyId;

    @NotBlank(message = "Selecciona una categoría para recibir sugerencias.")
    private String category;

    @NotNull(message = "El miembro seleccionado es obligatorio.")
    private Long memberUserId;

    private List<String> excludedSuggestionNames;
}
