package com.vertexdev.familytask.dto.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SuggestionResponse {
    private String id;
    private String nombre;
    private String descripcion;
    private String tipo;
    private String frecuencia;
    private String complejidad;
    private int monedas;
    private int exp;
    private String mensajeMotivador;
}
