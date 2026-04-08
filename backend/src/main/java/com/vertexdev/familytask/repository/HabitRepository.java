package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    @Query("SELECT h FROM Habit h LEFT JOIN FETCH h.assignment a LEFT JOIN FETCH a.user WHERE h.familyGroup.id = :familyGroupId AND h.isActive = true")
    List<Habit> findByFamilyGroupIdAndIsActiveTrue(@Param("familyGroupId") Long familyGroupId);
}
