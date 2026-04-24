package com.vertexdev.familytask.dto.task;

import com.vertexdev.familytask.dto.badge.BadgeResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CompleteTaskResponse {

    private Long taskId;
    private String taskTitle;
    private String assignedToName;
    private Integer xpReward;
    private Integer coinsReward;
    private LocalDateTime completedAt;

    // Resultado del otorgamiento de XP y monedas
    private Integer newTotalXp;
    private Integer newTotalCoins;
    private Integer newLevel;
    private Integer previousLevel;
    private Boolean leveledUp;
    private Integer xpToNextLevel;

    // Insignias ganadas al completar la tarea
    private List<BadgeResponse> earnedBadges;
}
