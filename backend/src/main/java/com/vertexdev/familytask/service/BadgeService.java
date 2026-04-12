package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.badge.BadgeResponse;
import com.vertexdev.familytask.exception.BadgeException;
import com.vertexdev.familytask.exception.FamilyException;
import com.vertexdev.familytask.model.*;
import com.vertexdev.familytask.model.enums.ConditionType;
import com.vertexdev.familytask.model.enums.TaskStatus;
import com.vertexdev.familytask.repository.*;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final HabitAssignmentRepository habitAssignmentRepository;
    private final FamilyPermissions familyPermissions;

    public List<BadgeResponse> getBadgesForUser(Long familyId, User user) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new FamilyException("FAMILY_NOT_FOUND", "Grupo familiar no encontrado.", 404));

        FamilyMember member = familyMemberRepository.findByFamilyGroupIdAndUserId(familyId, user.getId())
                .filter(m -> familyPermissions.isActiveMember(m, familyId))
                .orElseThrow(() -> new BadgeException("ACCESS_DENIED", "No tienes acceso a esta familia.", 403));

        if (!familyPermissions.isActiveChild(member)) {
            throw new BadgeException("ACCESS_DENIED", "Las insignias solo están disponibles para los hijos.", 403);
        }

        try {
            List<Badge> allBadges = badgeRepository.findAll();
            List<UserBadge> earnedUserBadges = userBadgeRepository.findByUserIdAndFamilyGroupId(user.getId(), familyId);
            Map<Long, UserBadge> earnedMap = earnedUserBadges.stream()
                    .collect(Collectors.toMap(ub -> ub.getBadge().getId(), ub -> ub));

            long completedTasks = taskAssignmentRepository.countByUserIdAndFamilyGroupIdAndStatus(
                    user.getId(), familyId, TaskStatus.COMPLETED);
            int maxStreak = habitAssignmentRepository.findByUserIdAndHabitFamilyGroupId(user.getId(), familyId)
                    .stream().mapToInt(HabitAssignment::getLongestStreak).max().orElse(0);
            int currentLevel = member.getCurrentLevel();

            List<BadgeResponse> responses = allBadges.stream()
                    .map(badge -> {
                        UserBadge ub = earnedMap.get(badge.getId());
                        boolean earned = ub != null;
                        int progress = getProgress(badge.getConditionType(), completedTasks, maxStreak, currentLevel);
                        return toBadgeResponse(badge, earned, earned ? ub.getEarnedAt() : null, progress);
                    })
                    .sorted(Comparator
                            .comparing(BadgeResponse::getEarned).reversed()
                            .thenComparing(r -> r.getEarned() ? r.getEarnedAt() : LocalDateTime.MIN,
                                    Comparator.reverseOrder())
                            .thenComparing(BadgeResponse::getConditionValue))
                    .toList();

            return responses;
        } catch (BadgeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al obtener las insignias: {}", e.getMessage(), e);
            throw new BadgeException("BADGE_FETCH_FAILED", "Error al obtener las insignias.", 500);
        }
    }

    @Transactional
    public List<BadgeResponse> evaluateAndAwardBadges(User user, Long familyId) {
        try {
            List<Badge> allBadges = badgeRepository.findAll();
            FamilyMember member = familyMemberRepository.findByFamilyGroupIdAndUserId(familyId, user.getId())
                    .orElse(null);
            if (member == null) return Collections.emptyList();

            FamilyGroup familyGroup = member.getFamilyGroup();

            long completedTasks = taskAssignmentRepository.countByUserIdAndFamilyGroupIdAndStatus(
                    user.getId(), familyId, TaskStatus.COMPLETED);
            int maxStreak = habitAssignmentRepository.findByUserIdAndHabitFamilyGroupId(user.getId(), familyId)
                    .stream().mapToInt(HabitAssignment::getLongestStreak).max().orElse(0);
            int currentLevel = member.getCurrentLevel();

            List<BadgeResponse> newBadges = new ArrayList<>();

            for (Badge badge : allBadges) {
                if (userBadgeRepository.existsByUserIdAndBadgeIdAndFamilyGroupId(user.getId(), badge.getId(), familyId)) {
                    continue;
                }

                boolean met = switch (badge.getConditionType()) {
                    case TASKS_COMPLETED -> completedTasks >= badge.getConditionValue();
                    case STREAK_DAYS -> maxStreak >= badge.getConditionValue();
                    case LEVEL_REACHED -> currentLevel >= badge.getConditionValue();
                };

                if (met) {
                    try {
                        UserBadge userBadge = UserBadge.builder()
                                .user(user)
                                .badge(badge)
                                .familyGroup(familyGroup)
                                .earnedAt(LocalDateTime.now())
                                .build();
                        userBadgeRepository.save(userBadge);
                        int progress = getProgress(badge.getConditionType(), completedTasks, maxStreak, currentLevel);
                        newBadges.add(toBadgeResponse(badge, true, userBadge.getEarnedAt(), progress));
                    } catch (DataIntegrityViolationException e) {
                        // Otro hilo ya otorgo este badge — ignorar
                    }
                }
            }

            return newBadges;
        } catch (Exception e) {
            log.error("Error al evaluar insignias: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public void seedBadges() {
        Set<String> existing = badgeRepository.findAll().stream()
                .map(Badge::getName)
                .collect(Collectors.toSet());

        List<Badge> seeds = List.of(
                Badge.builder().name("Primera misión").description("Completa tu primera tarea para desbloquear este logro.").icon("assignment_turned_in")
                        .conditionType(ConditionType.TASKS_COMPLETED).conditionValue(1).build(),
                Badge.builder().name("Explorador").description("Completa 10 tareas y demuestra tu compromiso.").icon("explore")
                        .conditionType(ConditionType.TASKS_COMPLETED).conditionValue(10).build(),
                Badge.builder().name("Guerrero").description("Completa 50 tareas y conviértete en leyenda.").icon("military_tech")
                        .conditionType(ConditionType.TASKS_COMPLETED).conditionValue(50).build(),
                Badge.builder().name("Racha semanal").description("Mantén una racha de 7 días seguidos.").icon("local_fire_department")
                        .conditionType(ConditionType.STREAK_DAYS).conditionValue(7).build(),
                Badge.builder().name("Racha mensual").description("Mantén una racha de 30 días seguidos.").icon("whatshot")
                        .conditionType(ConditionType.STREAK_DAYS).conditionValue(30).build(),
                Badge.builder().name("Nivel 5").description("Alcanza el nivel 5 ganando experiencia.").icon("star")
                        .conditionType(ConditionType.LEVEL_REACHED).conditionValue(5).build(),
                Badge.builder().name("Nivel 10").description("Alcanza el nivel 10 y domina el juego.").icon("emoji_events")
                        .conditionType(ConditionType.LEVEL_REACHED).conditionValue(10).build()
        );

        List<Badge> toInsert = seeds.stream()
                .filter(b -> !existing.contains(b.getName()))
                .toList();

        if (!toInsert.isEmpty()) {
            badgeRepository.saveAll(toInsert);
            log.info("Se insertaron {} insignias predefinidas.", toInsert.size());
        }
    }

    private int getProgress(ConditionType type, long completedTasks, int maxStreak, int currentLevel) {
        return switch (type) {
            case TASKS_COMPLETED -> (int) completedTasks;
            case STREAK_DAYS -> maxStreak;
            case LEVEL_REACHED -> currentLevel;
        };
    }

    private BadgeResponse toBadgeResponse(Badge badge, boolean earned, LocalDateTime earnedAt, int progress) {
        return BadgeResponse.builder()
                .id(badge.getId())
                .name(badge.getName())
                .description(badge.getDescription())
                .icon(badge.getIcon())
                .conditionType(badge.getConditionType().name())
                .conditionValue(badge.getConditionValue())
                .currentProgress(progress)
                .earned(earned)
                .earnedAt(earnedAt)
                .build();
    }
}
