package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.habit.AssignHabitRequest;
import com.vertexdev.familytask.dto.habit.CreateHabitRequest;
import com.vertexdev.familytask.dto.habit.HabitResponse;
import com.vertexdev.familytask.exception.HabitException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Habit;
import com.vertexdev.familytask.model.HabitAssignment;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.HabitFrequency;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.HabitAssignmentRepository;
import com.vertexdev.familytask.repository.HabitRepository;
import com.vertexdev.familytask.repository.UserRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HabitService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final HabitRepository habitRepository;
    private final HabitAssignmentRepository habitAssignmentRepository;
    private final UserRepository userRepository;
    private final FamilyPermissions familyPermissions;

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

    private HabitResponse toResponse(Habit habit) {
        HabitAssignment assignment = habit.getAssignment();
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
                .build();
    }
}
