package com.vertexdev.familytask.dto.familia;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamiliaResponse {
    private Long id;
    private String nombre;
    private String rol;
}