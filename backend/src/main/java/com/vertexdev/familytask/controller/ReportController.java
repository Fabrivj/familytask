package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.report.WeeklyReportResponse;
import com.vertexdev.familytask.exception.HabitException;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final WeeklyReportService weeklyReportService;

    /**
     * Generates a weekly activity report for a family.
     * Accessible to any active member (PARENT or CHILD).
     *
     * GET /api/reports/weekly
     *   ?familyId=1
     *   &weekStart=2026-04-13   (ISO date, required — any day accepted; report always covers 7 days from that date)
     *   &memberId=5             (optional)
     *   &spaceId=2              (optional — category filter for tasks)
     */
    @GetMapping("/weekly")
    public ResponseEntity<WeeklyReportResponse> getWeeklyReport(
            @RequestParam Long familyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal User authenticatedUser) {

        if (weekStart == null) {
            throw new HabitException("INVALID_DATE_RANGE", "Rango de fechas inválido.", 400);
        }

        return ResponseEntity.ok(
                weeklyReportService.getWeeklyReport(familyId, weekStart, memberId, spaceId, authenticatedUser));
    }
}
