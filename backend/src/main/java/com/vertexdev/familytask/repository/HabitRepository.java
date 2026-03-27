package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByFamilyGroupIdAndIsActiveTrue(Long familyGroupId);
}
