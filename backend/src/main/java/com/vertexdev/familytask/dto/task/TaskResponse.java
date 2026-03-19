package com.vertexdev.familytask.dto.task;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String location;
    private Integer xpReward;
    private Integer coinsReward;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
}
