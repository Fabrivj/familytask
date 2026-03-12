package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamilyResponse {
    private Long id;
    private String name;
    private String role;
}