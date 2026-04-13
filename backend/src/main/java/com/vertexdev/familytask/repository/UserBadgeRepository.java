package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdAndFamilyGroupId(Long userId, Long familyGroupId);
    boolean existsByUserIdAndBadgeIdAndFamilyGroupId(Long userId, Long badgeId, Long familyGroupId);
}
