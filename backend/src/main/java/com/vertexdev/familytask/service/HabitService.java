package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.habit.AssignHabitRequest;
import com.vertexdev.familytask.dto.habit.CompleteHabitResponse;
import com.vertexdev.familytask.dto.habit.CreateHabitRequest;
import com.vertexdev.familytask.dto.habit.HabitResponse;
import com.vertexdev.familytask.exception.HabitException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Habit;
import com.vertexdev.familytask.model.HabitAssignment;
import com.vertexdev.familytask.model.HabitCompletion;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.HabitFrequency;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.HabitAssignmentRepository;
import com.vertexdev.familytask.repository.HabitCompletionRepository;
import com.vertexdev.familytask.repository.HabitRepository;
import com.vertexdev.familytask.repository.UserRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HabitService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final HabitRepository habitRepository;
    private final HabitAssignmentRepository habitAssignmentRepository;
    private final HabitCompletionRepository habitCompletionRepository;
    private final UserRepository userRepository;
    private final FamilyPermissions familyPermissions;
    private final BadgeService badgeService;
    private final ExperienceService experienceService;

    @Transactional
    public HabitResponse createHabit(CreateHabitRequest request, User creator) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new HabitException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), creator.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        HabitFrequency frequency;
        try {
            frequency = HabitFrequency.valueOf(request.getFrequency().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new HabitException("INVALID_FREQUENCY", "El campo Frecuencia es obligatorio.", 400);
        }

        try {
            Habit habit = Habit.builder()
                    .familyGroup(familyGroup)
                    .createdBy(creator)
                    .title(request.getTitle().trim())
                    .description(request.getDescription() != null ? request.getDescription().trim() : null)
                    .frequency(frequency)
                    .xpReward(request.getXpReward())
                    .coinsReward(request.getCoinsReward())
                    .build();

            habitRepository.save(habit);
            log.info("Habit '{}' created by user {} in family {}", habit.getTitle(), creator.getEmail(), familyGroup.getName());

            return toResponse(habit);
        } catch (HabitException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating habit: {}", e.getMessage());
            throw new HabitException("HABIT_CREATION_FAILED", "Ocurrió un error al crear el hábito. Por favor, intente nuevamente.", 500);
        }
    }

    @Transactional
    public MessageResponse deleteHabit(Long habitId, User requester) {
        Habit habit = habitRepository.findById(habitId)
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .orElseThrow(() -> new HabitException("HABIT_NOT_FOUND", "Hábito no encontrado.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(habit.getFamilyGroup().getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        habit.setIsActive(false);
        habitRepository.save(habit);
        log.info("Habit '{}' deleted by user {}", habit.getTitle(), requester.getEmail());
        return new MessageResponse("Hábito eliminado correctamente.");
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> getHabits(Long familyId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new HabitException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            return habitRepository.findByFamilyGroupIdAndIsActiveTrue(familyGroup.getId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch habits for family {}: {}", familyId, e.getMessage());
            throw new HabitException("FETCH_FAILED", "Error al cargar los hábitos. Por favor, intente nuevamente.", 500);
        }
    }

    @Transactional
    public HabitResponse assignHabit(Long habitId, AssignHabitRequest request, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new HabitException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        Habit habit = habitRepository.findById(habitId)
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .orElseThrow(() -> new HabitException("HABIT_NOT_FOUND", "Hábito no encontrado.", 404));

        if (!habit.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new HabitException("ACCESS_DENIED", "El hábito no pertenece a esta familia.", 403);
        }

        User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new HabitException("USER_NOT_FOUND", "El usuario asignado no existe.", 404));

        boolean isMember = familyMemberRepository
                .findByFamilyGroupIdAndIsActiveTrue(familyGroup.getId())
                .stream()
                .anyMatch(m -> m.getUser().getId().equals(assignedTo.getId()));
        if (!isMember) {
            throw new HabitException("NOT_A_MEMBER", "El miembro seleccionado no pertenece al grupo familiar activo.", 400);
        }

        try {
            HabitAssignment existing = habitAssignmentRepository.findByHabitId(habitId).orElse(null);

            if (existing != null) {
                existing.setUser(assignedTo);
                existing.setIsActive(true);
                habitAssignmentRepository.save(existing);
            } else {
                HabitAssignment assignment = HabitAssignment.builder()
                        .habit(habit)
                        .user(assignedTo)
                        .build();
                habitAssignmentRepository.save(assignment);
                habit.setAssignment(assignment);
            }

            log.info("Habit '{}' assigned to user {} by {}", habit.getTitle(), assignedTo.getEmail(), requester.getEmail());
            return toResponse(habit);
        } catch (HabitException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to assign habit {} to user {}: {}", habitId, assignedTo.getEmail(), e.getMessage());
            throw new HabitException("ASSIGN_FAILED", "No se pudo asignar el hábito. Por favor, intente nuevamente.", 500);
        }
    }

    @Transactional
    public CompleteHabitResponse completeHabit(Long habitId, User requester) {
        Habit habit = habitRepository.findById(habitId)
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .orElseThrow(() -> new HabitException("HABIT_NOT_FOUND", "Hábito no encontrado.", 404));

        HabitAssignment assignment = habitAssignmentRepository.findByHabitId(habitId)
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .orElseThrow(() -> new HabitException("NOT_ASSIGNED", "Este hábito no está asignado.", 400));

        if (!assignment.getUser().getId().equals(requester.getId())) {
            throw new HabitException("ACCESS_DENIED", "Acceso no autorizado.", 403);
        }

        LocalDate today = LocalDate.now();
        HabitFrequency frequency = habit.getFrequency();

        validateDayOfWeek(frequency, today);

        if (alreadyCompletedInPeriod(assignment.getId(), frequency, today)) {
            throw new HabitException("ALREADY_COMPLETED", "Ya completaste este hábito en el periodo actual.", 400);
        }

        try {
            habitCompletionRepository.save(
                HabitCompletion.builder()
                    .habitAssignment(assignment)
                    .completionDate(today)
                    .build()
            );

            updateStreak(assignment, frequency, today);
            habitAssignmentRepository.save(assignment);

            FamilyMember member = familyMemberRepository
                    .findByFamilyGroupIdAndUserId(habit.getFamilyGroup().getId(), requester.getId())
                    .orElseThrow(() -> new HabitException("MEMBER_NOT_FOUND",
                            "No se encontró el perfil del miembro en esta familia.", 404));

            double multiplier = calculateStreakMultiplier(assignment.getCurrentStreak());
            int xpActual    = (int) Math.round((habit.getXpReward()    != null ? habit.getXpReward()    : 0) * multiplier);
            int coinsActual = (int) Math.round((habit.getCoinsReward() != null ? habit.getCoinsReward() : 0) * multiplier);

            ExperienceService.AwardResult award = experienceService.awardXpAndCoins(member, xpActual, coinsActual);

            log.info("Habit '{}' completed by user {} on {} | streak={} multiplier={}x +{}XP +{}coins → level {}{}",
                    habit.getTitle(), requester.getEmail(), today,
                    assignment.getCurrentStreak(), String.format("%.2f", multiplier),
                    xpActual, coinsActual, award.newLevel(),
                    award.leveledUp() ? " (LEVEL UP!)" : "");

            var earnedBadges = badgeService.evaluateAndAwardBadges(
                    requester, habit.getFamilyGroup().getId());

            return CompleteHabitResponse.builder()
                    .habitId(habit.getId())
                    .habitTitle(habit.getTitle())
                    .assignedToName(requester.getName())
                    .xpReward(habit.getXpReward())
                    .coinsReward(habit.getCoinsReward())
                    .currentStreak(assignment.getCurrentStreak())
                    .longestStreak(assignment.getLongestStreak())
                    .completionDate(today)
                    .streakMultiplier(multiplier)
                    .xpActuallyAwarded(xpActual)
                    .coinsActuallyAwarded(coinsActual)
                    .newTotalXp(award.newTotalXp())
                    .newTotalCoins(award.newTotalCoins())
                    .newLevel(award.newLevel())
                    .previousLevel(award.previousLevel())
                    .leveledUp(award.leveledUp())
                    .xpToNextLevel(award.xpToNextLevel())
                    .earnedBadges(earnedBadges)
                    .build();
        } catch (HabitException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to complete habit {} for user {}: {}", habitId, requester.getEmail(), e.getMessage());
            throw new HabitException("COMPLETE_FAILED", "No se pudo registrar el hábito. Por favor, intente nuevamente.", 500);
        }
    }

    private void validateDayOfWeek(HabitFrequency frequency, LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        if (frequency == HabitFrequency.WEEKDAYS && isWeekend) {
            throw new HabitException("INVALID_DAY", "Este hábito solo se puede completar en días de semana.", 400);
        }
        if (frequency == HabitFrequency.WEEKENDS && !isWeekend) {
            throw new HabitException("INVALID_DAY", "Este hábito solo se puede completar en fines de semana.", 400);
        }
    }

    private boolean alreadyCompletedInPeriod(Long assignmentId, HabitFrequency frequency, LocalDate today) {
        return switch (frequency) {
            case DAILY, WEEKDAYS, WEEKENDS ->
                habitCompletionRepository.existsByHabitAssignmentIdAndCompletionDate(assignmentId, today);
            case WEEKLY -> {
                LocalDate monday = today.with(WeekFields.ISO.dayOfWeek(), 1);
                LocalDate sunday = monday.plusDays(6);
                yield habitCompletionRepository.existsByHabitAssignmentIdAndCompletionDateBetween(assignmentId, monday, sunday);
            }
            case MONTHLY -> {
                LocalDate start = today.withDayOfMonth(1);
                LocalDate end = today.withDayOfMonth(today.lengthOfMonth());
                yield habitCompletionRepository.existsByHabitAssignmentIdAndCompletionDateBetween(assignmentId, start, end);
            }
        };
    }

    private void updateStreak(HabitAssignment assignment, HabitFrequency frequency, LocalDate today) {
        LocalDate last = assignment.getLastActivity();
        int newStreak;

        if (last == null || !isConsecutivePeriod(frequency, last, today)) {
            newStreak = 1;
        } else {
            newStreak = assignment.getCurrentStreak() + 1;
        }

        assignment.setCurrentStreak(newStreak);
        assignment.setLastActivity(today);
        if (newStreak > assignment.getLongestStreak()) {
            assignment.setLongestStreak(newStreak);
        }
    }

    private boolean isConsecutivePeriod(HabitFrequency frequency, LocalDate last, LocalDate today) {
        return switch (frequency) {
            case DAILY -> last.plusDays(1).equals(today);
            case WEEKLY -> {
                LocalDate prevMonday = today.with(WeekFields.ISO.dayOfWeek(), 1).minusWeeks(1);
                LocalDate prevSunday = prevMonday.plusDays(6);
                yield !last.isBefore(prevMonday) && !last.isAfter(prevSunday);
            }
            case WEEKDAYS -> {
                LocalDate prevWeekday = today.minusDays(1);
                while (prevWeekday.getDayOfWeek() == DayOfWeek.SATURDAY
                        || prevWeekday.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    prevWeekday = prevWeekday.minusDays(1);
                }
                yield last.equals(prevWeekday);
            }
            case WEEKENDS -> {
                LocalDate prevWeekendDay = today.minusDays(1);
                while (prevWeekendDay.getDayOfWeek() != DayOfWeek.SATURDAY
                        && prevWeekendDay.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    prevWeekendDay = prevWeekendDay.minusDays(1);
                }
                yield last.equals(prevWeekendDay);
            }
            case MONTHLY -> {
                LocalDate firstOfThisMonth = today.withDayOfMonth(1);
                LocalDate firstOfLastMonth = firstOfThisMonth.minusMonths(1);
                LocalDate lastOfLastMonth = firstOfThisMonth.minusDays(1);
                yield !last.isBefore(firstOfLastMonth) && !last.isAfter(lastOfLastMonth);
            }
        };
    }

    /**
     * Multiplicador de racha: min(2.5, 1.0 + (streak - 1) × 0.05)
     * Día 1 → 1.00x, Día 2 → 1.05x, Día 10 → 1.45x, Día 21+ → 2.50x (tope)
     */
    private double calculateStreakMultiplier(int streak) {
        return Math.min(2.5, 1.0 + (streak - 1) * 0.05);
    }

    private HabitResponse toResponse(Habit habit) {
        HabitAssignment assignment = habit.getAssignment();
        Boolean completedInCurrentPeriod = null;
        if (assignment != null && Boolean.TRUE.equals(assignment.getIsActive())) {
            LocalDate today = LocalDate.now();
            completedInCurrentPeriod = alreadyCompletedInPeriod(
                assignment.getId(), habit.getFrequency(), today
            );
        }
        return HabitResponse.builder()
                .id(habit.getId())
                .title(habit.getTitle())
                .description(habit.getDescription())
                .frequency(habit.getFrequency().name())
                .xpReward(habit.getXpReward())
                .coinsReward(habit.getCoinsReward())
                .createdAt(habit.getCreatedAt())
                .assignedToId(assignment != null ? assignment.getUser().getId() : null)
                .assignedToName(assignment != null ? assignment.getUser().getName() : null)
                .assignedToPictureUrl(assignment != null ? assignment.getUser().getPictureUrl() : null)
                .currentStreak(assignment != null ? assignment.getCurrentStreak() : null)
                .longestStreak(assignment != null ? assignment.getLongestStreak() : null)
                .completedInCurrentPeriod(completedInCurrentPeriod)
                .build();
    }
}
