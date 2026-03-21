package com.vertexdev.familytask.dto.task;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
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
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private Long assignedToId;
    private String assignedToName;
    private String assignedToPictureUrl;
}
