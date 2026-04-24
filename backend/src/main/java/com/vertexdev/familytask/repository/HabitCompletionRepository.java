package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    boolean existsByHabitAssignmentIdAndCompletionDate(Long habitAssignmentId, LocalDate completionDate);

    boolean existsByHabitAssignmentIdAndCompletionDateBetween(Long habitAssignmentId, LocalDate start, LocalDate end);

    @Query("""
        SELECT hc FROM HabitCompletion hc
        WHERE hc.habitAssignment.habit.familyGroup.id = :familyId
          AND hc.completionDate >= :start AND hc.completionDate <= :end
          AND (:memberId IS NULL OR hc.habitAssignment.user.id = :memberId)
        """)
    List<HabitCompletion> findByFamilyAndWeek(
            @Param("familyId") Long familyId,
            @Param("start")    LocalDate start,
            @Param("end")      LocalDate end,
            @Param("memberId") Long memberId);
}
