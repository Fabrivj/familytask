package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Badge;
import com.vertexdev.familytask.model.enums.ConditionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByConditionType(ConditionType conditionType);
    Optional<Badge> findByName(String name);
}
