package com.vertexdev.familytask.dto.habit;

import com.vertexdev.familytask.dto.badge.BadgeResponse;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteHabitResponse {

    private Long habitId;
    private String habitTitle;
    private String assignedToName;
    private Integer xpReward;
    private Integer coinsReward;
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate completionDate;

    // Insignias ganadas al completar el hábito
    private List<BadgeResponse> earnedBadges;
}
