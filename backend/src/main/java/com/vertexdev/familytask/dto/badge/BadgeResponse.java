package com.vertexdev.familytask.dto.badge;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BadgeResponse {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String conditionType;
    private Integer conditionValue;
    private Integer currentProgress;
    private Boolean earned;
    private LocalDateTime earnedAt;
}
