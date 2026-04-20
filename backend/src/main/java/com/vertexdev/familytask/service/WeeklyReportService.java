package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.report.WeeklyReportResponse;
import com.vertexdev.familytask.dto.report.WeeklyReportResponse.DailyActivity;
import com.vertexdev.familytask.dto.report.WeeklyReportResponse.MemberWeeklyStats;
import com.vertexdev.familytask.exception.HabitException;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.HabitCompletion;
import com.vertexdev.familytask.model.TaskCompletion;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.TaskStatus;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.HabitAssignmentRepository;
import com.vertexdev.familytask.repository.HabitCompletionRepository;
import com.vertexdev.familytask.repository.TaskAssignmentRepository;
import com.vertexdev.familytask.repository.TaskCompletionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportService {

    private final FamilyGroupRepository       familyGroupRepository;
    private final FamilyMemberRepository      familyMemberRepository;
    private final TaskCompletionRepository    taskCompletionRepository;
    private final TaskAssignmentRepository    taskAssignmentRepository;
    private final HabitCompletionRepository   habitCompletionRepository;
    private final HabitAssignmentRepository   habitAssignmentRepository;

    @Transactional(readOnly = true)
    public WeeklyReportResponse getWeeklyReport(
            Long familyId,
            LocalDate weekStart,
            Long memberId,
            Long spaceId,
            User requester) {

        familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new HabitException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        if (weekStart == null) {
            throw new HabitException("INVALID_DATE_RANGE", "Rango de fechas inválido.", 400);
        }

        LocalDate weekEnd = weekStart.plusDays(6);
        LocalDateTime startDt = weekStart.atStartOfDay();
        LocalDateTime endDt   = weekEnd.atTime(LocalTime.MAX);

        // ── Tareas completadas en la semana ──────────────────────────────────
        List<TaskCompletion> taskCompletions = taskCompletionRepository
                .findByFamilyAndWeek(familyId, startDt, endDt, memberId, spaceId);

        int tasksCompleted   = taskCompletions.size();
        long tasksPending    = taskAssignmentRepository.countByFamilyAndStatuses(
                familyId, List.of(TaskStatus.PENDING), memberId, spaceId);
        long tasksInProgress = taskAssignmentRepository.countByFamilyAndStatuses(
                familyId, List.of(TaskStatus.IN_PROGRESS), memberId, spaceId);
        long tasksInReview   = taskAssignmentRepository.countByFamilyAndStatuses(
                familyId, List.of(TaskStatus.IN_REVIEW), memberId, spaceId);

        long totalActiveTasks = tasksCompleted + tasksPending + tasksInProgress + tasksInReview;
        double taskRate = totalActiveTasks > 0
                ? Math.round((tasksCompleted * 1000.0 / totalActiveTasks)) / 10.0
                : 0.0;

        // ── Hábitos completados en la semana ─────────────────────────────────
        List<HabitCompletion> habitCompletions = habitCompletionRepository
                .findByFamilyAndWeek(familyId, weekStart, weekEnd, memberId);

        int habitsCompleted = habitCompletions.size();
        long habitsActive   = habitAssignmentRepository.countActiveByFamily(familyId, memberId);

        // ── Tendencia diaria ─────────────────────────────────────────────────
        Map<LocalDate, Long> tasksByDay = taskCompletions.stream()
                .collect(Collectors.groupingBy(
                        tc -> tc.getCompletedAt().toLocalDate(), Collectors.counting()));

        Map<LocalDate, Long> habitsByDay = habitCompletions.stream()
                .collect(Collectors.groupingBy(HabitCompletion::getCompletionDate, Collectors.counting()));

        List<DailyActivity> dailyTrend = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = weekStart.plusDays(i);
            dailyTrend.add(DailyActivity.builder()
                    .date(day)
                    .tasksCompleted(tasksByDay.getOrDefault(day, 0L).intValue())
                    .habitsCompleted(habitsByDay.getOrDefault(day, 0L).intValue())
                    .build());
        }

        // ── Resumen por miembro (solo si no hay filtro de miembro) ────────────
        List<MemberWeeklyStats> members = new ArrayList<>();
        if (memberId == null) {
            Map<Long, Long> tasksByMember = taskCompletions.stream()
                    .collect(Collectors.groupingBy(
                            tc -> tc.getTaskAssignment().getUser().getId(), Collectors.counting()));

            Map<Long, Long> habitsByMember = habitCompletions.stream()
                    .collect(Collectors.groupingBy(
                            hc -> hc.getHabitAssignment().getUser().getId(), Collectors.counting()));

            familyMemberRepository.findByFamilyGroupIdAndIsActiveTrue(familyId)
                    .forEach(m -> {
                        Long uid = m.getUser().getId();
                        members.add(MemberWeeklyStats.builder()
                                .memberId(uid)
                                .memberName(m.getUser().getName())
                                .pictureUrl(m.getUser().getPictureUrl())
                                .tasksCompleted(tasksByMember.getOrDefault(uid, 0L).intValue())
                                .habitsCompleted(habitsByMember.getOrDefault(uid, 0L).intValue())
                                .build());
                    });
        }

        log.info("Weekly report generated for family {} week {}/{} by {}", familyId, weekStart, weekEnd, requester.getEmail());

        return WeeklyReportResponse.builder()
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .tasksCompleted(tasksCompleted)
                .tasksPending((int) tasksPending)
                .tasksInProgress((int) tasksInProgress)
                .tasksInReview((int) tasksInReview)
                .taskCompletionRate(taskRate)
                .habitsCompleted(habitsCompleted)
                .habitsActive((int) habitsActive)
                .dailyTrend(dailyTrend)
                .members(members)
                .build();
    }
}
