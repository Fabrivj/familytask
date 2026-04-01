package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    Optional<TaskAssignment> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);

    @Modifying
    @Query("DELETE FROM TaskAssignment a WHERE a.user.id = :userId AND a.task.familyGroup.id = :familyGroupId")
    void deleteByUserIdAndFamilyGroupId(@Param("userId") Long userId, @Param("familyGroupId") Long familyGroupId);
}
