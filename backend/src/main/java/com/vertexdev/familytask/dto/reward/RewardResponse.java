package com.vertexdev.familytask.dto.reward;

import com.vertexdev.familytask.model.enums.ApprovalRule;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardResponse {

    private Long id;
    private String name;
    private String description;
    private String icon;
    private Integer cost;
    private Integer minLevel;
    private ApprovalRule approvalRule;
    private Long familyId;
    private LocalDateTime createdAt;
    private int pendingCount;
    private Boolean isEnabled;
}
