package com.vertexdev.familytask.dto.report;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class WeeklyReportResponse {

    private LocalDate weekStart;
    private LocalDate weekEnd;

    // ── Tareas ───────────────────────────────────────────────────────────────
    private int tasksCompleted;
    private int tasksPending;
    private int tasksInProgress;
    private int tasksInReview;
    /** (tasksCompleted / total tareas activas) × 100, redondeado a 1 decimal. */
    private double taskCompletionRate;

    // ── Hábitos ──────────────────────────────────────────────────────────────
    private int habitsCompleted;
    /** Número de asignaciones de hábitos activas en la familia (o miembro). */
    private int habitsActive;

    // ── Tendencia diaria (Lunes → Domingo) ──────────────────────────────────
    private List<DailyActivity> dailyTrend;

    // ── Resumen por miembro ───────────────────────────────────────────────────
    private List<MemberWeeklyStats> members;

    // ── Nested types ─────────────────────────────────────────────────────────

    @Getter
    @Builder
    public static class DailyActivity {
        private LocalDate date;
        private int tasksCompleted;
        private int habitsCompleted;
    }

    @Getter
    @Builder
    public static class MemberWeeklyStats {
        private Long memberId;
        private String memberName;
        private String pictureUrl;
        private int tasksCompleted;
        private int habitsCompleted;
    }
}
