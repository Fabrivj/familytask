package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FamilyActivityResponse {
    private Long id;
    private String action;
    private String performedByName;
    private String performedByPictureUrl;
    private String targetUserName;
    private String details;
    private LocalDateTime createdAt;
}
