package com.vertexdev.familytask.dto.auth;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private String pictureUrl;
    private List<FamilySummary> families;   // para que el front sepa a cuántas familias pertenece

    @Data
    @Builder
    public static class FamilySummary {
        private Long familyId;
        private String familyName;
        private String role;
    }
}