package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.habit.CreateHabitRequest;
import com.vertexdev.familytask.dto.habit.HabitResponse;
import com.vertexdev.familytask.exception.HabitException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Habit;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.HabitFrequency;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.HabitRepository;
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

    private HabitResponse toResponse(Habit habit) {
        return HabitResponse.builder()
                .id(habit.getId())
                .title(habit.getTitle())
                .description(habit.getDescription())
                .frequency(habit.getFrequency().name())
                .xpReward(habit.getXpReward())
                .coinsReward(habit.getCoinsReward())
                .createdAt(habit.getCreatedAt())
                .build();
    }
}
