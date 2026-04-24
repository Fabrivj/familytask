package com.vertexdev.familytask.dto.redemption;

import com.vertexdev.familytask.model.enums.RedemptionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedemptionResponse {

    private Long id;
    private Long rewardId;
    private String rewardName;
    private String rewardIcon;
    private Integer coinsSpent;
    private RedemptionStatus status;
    private LocalDateTime requestedAt;
}
