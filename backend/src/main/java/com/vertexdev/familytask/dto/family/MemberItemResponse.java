package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MemberItemResponse {
    private Long id;
    private String name;
    private String email;
    private String pictureUrl;
    private String role;
    private Boolean isAdmin;
    private LocalDateTime joinedAt;
}
