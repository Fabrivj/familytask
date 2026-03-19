package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PendingInvitationResponse {
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime expirationDate;
}
