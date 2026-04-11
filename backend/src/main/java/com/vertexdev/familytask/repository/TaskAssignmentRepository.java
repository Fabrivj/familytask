package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.TaskAssignment;
import com.vertexdev.familytask.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    Optional<TaskAssignment> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);

    @Query("SELECT COUNT(a) FROM TaskAssignment a WHERE a.user.id = :userId AND a.task.familyGroup.id = :familyGroupId AND a.status = :status")
    long countByUserIdAndFamilyGroupIdAndStatus(@Param("userId") Long userId, @Param("familyGroupId") Long familyGroupId, @Param("status") TaskStatus status);

    @Modifying
    @Query("DELETE FROM TaskAssignment a WHERE a.user.id = :userId AND a.task.familyGroup.id = :familyGroupId")
    void deleteByUserIdAndFamilyGroupId(@Param("userId") Long userId, @Param("familyGroupId") Long familyGroupId);
}
