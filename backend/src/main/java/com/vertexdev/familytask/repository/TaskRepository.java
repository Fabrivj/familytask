package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
}
