package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(Long familyGroupId);
}
