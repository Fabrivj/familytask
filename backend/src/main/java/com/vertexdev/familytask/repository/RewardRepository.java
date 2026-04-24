package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    // Children: only active + enabled
    List<Reward> findByFamilyGroupIdAndIsActiveTrueAndIsEnabledTrueOrderByCreatedAtDesc(Long familyGroupId);
    // Parents: all non-deleted (enabled first, then disabled, newest first within each group)
    List<Reward> findByFamilyGroupIdAndIsActiveTrueOrderByIsEnabledDescCreatedAtDesc(Long familyGroupId);
}
