package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.familyGroup.id = :familyGroupId AND t.deletedAt IS NULL")
    List<Task> findActiveByFamilyGroupId(@Param("familyGroupId") Long familyGroupId);

    @Query("SELECT t FROM Task t WHERE t.familyGroup.id = :familyId AND t.deletedAt IS NULL AND (t.assignedTo.id = :userId OR t.assignedTo IS NULL)")
    List<Task> findVisibleTasksForChild(@Param("familyId") Long familyId, @Param("userId") Long userId);
}
