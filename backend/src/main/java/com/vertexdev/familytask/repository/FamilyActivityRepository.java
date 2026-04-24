package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.FamilyActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyActivityRepository extends JpaRepository<FamilyActivity, Long> {
    Page<FamilyActivity> findByFamilyGroupIdOrderByCreatedAtDesc(Long familyGroupId, Pageable pageable);
}
