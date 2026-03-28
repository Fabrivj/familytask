package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    Optional<TaskAssignment> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);
}
