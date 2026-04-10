package com.vertexdev.familytask.dto.habit;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitResponse {

    private Long id;
    private String title;
    private String description;
    private String frequency;
    private Integer xpReward;
    private Integer coinsReward;
    private LocalDateTime createdAt;
    private Long assignedToId;
    private String assignedToName;
    private String assignedToPictureUrl;
    private Integer currentStreak;
    private Integer longestStreak;
    private Boolean completedInCurrentPeriod;
}
