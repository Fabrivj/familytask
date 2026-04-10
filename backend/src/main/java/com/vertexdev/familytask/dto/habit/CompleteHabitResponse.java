package com.vertexdev.familytask.dto.habit;

import lombok.*;

import java.time.LocalDate;

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
    // TODO: confirm actual XP/coins grant once reward system is implemented
}
