package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.TaskCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskCompletionRepository extends JpaRepository<TaskCompletion, Long> {

    Optional<TaskCompletion> findByTaskAssignmentId(Long taskAssignmentId);

    boolean existsByTaskAssignmentId(Long taskAssignmentId);
}
