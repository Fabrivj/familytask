package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    boolean existsByHabitAssignmentIdAndCompletionDate(Long habitAssignmentId, LocalDate completionDate);

    boolean existsByHabitAssignmentIdAndCompletionDateBetween(Long habitAssignmentId, LocalDate start, LocalDate end);
}
