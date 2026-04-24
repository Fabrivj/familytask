package com.vertexdev.familytask.dto.redemption;

import com.vertexdev.familytask.model.enums.RedemptionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedemptionHistoryResponse {

    private Long id;
    private String rewardName;
    private String rewardIcon;
    private Integer rewardCost;
    private Long redeemedByUserId;
    private String redeemedByName;
    private RedemptionStatus status;
    private LocalDateTime redeemedAt;
}
