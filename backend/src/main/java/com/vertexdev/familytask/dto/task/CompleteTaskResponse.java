package com.vertexdev.familytask.dto.task;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CompleteTaskResponse {

    private Long taskId;
    private String taskTitle;
    private String assignedToName;
    private Integer xpReward;
    private Integer coinsReward;
    private LocalDateTime completedAt;

    // TODO: cuando se implemente el otorgamiento de puntos y monedas,
    // agregar aquí los campos confirming the actual grant (e.g. newTotalXp, newTotalCoins)
}
