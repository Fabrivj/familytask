package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamilyMemberDto {
    private Long userId;
    private String name;
    private String pictureUrl;
    private String role;
}
