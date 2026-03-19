package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByFamilyGroupIdAndDeletedAtIsNull(Long familyGroupId);
}
