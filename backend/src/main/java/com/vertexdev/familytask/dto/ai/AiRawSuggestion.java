package com.vertexdev.familytask.dto.ai;

import lombok.Data;

/**
 * Maps the raw JSON structure returned by the LLM for a single suggestion.
 * Points and XP are NOT trusted from the model; they are recalculated server-side.
 */
@Data
public class AiRawSuggestion {
    private String nombre;
    private String descripcion;
    private String tipo;
    private String frecuencia;
    private String complejidad;
    private String mensajeMotivador;
}
