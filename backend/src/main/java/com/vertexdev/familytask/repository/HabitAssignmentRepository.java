package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.HabitAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HabitAssignmentRepository extends JpaRepository<HabitAssignment, Long> {

    Optional<HabitAssignment> findByHabitId(Long habitId);

    List<HabitAssignment> findByUserIdAndHabitFamilyGroupId(Long userId, Long familyGroupId);

    void deleteByHabitId(Long habitId);

    @Modifying
    @Query("DELETE FROM HabitAssignment a WHERE a.user.id = :userId AND a.habit.familyGroup.id = :familyGroupId")
    void deleteByUserIdAndFamilyGroupId(@Param("userId") Long userId, @Param("familyGroupId") Long familyGroupId);
}
