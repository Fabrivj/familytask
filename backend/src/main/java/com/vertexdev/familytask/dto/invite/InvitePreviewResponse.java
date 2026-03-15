package com.vertexdev.familytask.dto.invite;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvitePreviewResponse {
    private String familyName;
    private String invitedByName;
    private String invitedEmail;
    private String role;
    private LocalDateTime expirationDate;
}
