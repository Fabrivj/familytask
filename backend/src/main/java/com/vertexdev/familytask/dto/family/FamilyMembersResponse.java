package com.vertexdev.familytask.dto.family;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FamilyMembersResponse {
    private List<MemberItemResponse> members;
    private List<PendingInvitationResponse> pendingInvitations;
}
