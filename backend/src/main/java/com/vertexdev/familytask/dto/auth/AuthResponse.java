package com.vertexdev.familytask.dto.auth;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String nombre;
    private String fotoPerfil;
    private List<FamiliaResumen> familias;   // para que el front sepa a cuántas familias pertenece

    @Data
    @Builder
    public static class FamiliaResumen {
        private Long familiaId;
        private String familiaNombre;
        private String rol;
    }
}