package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.RedemptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RedemptionRepository extends JpaRepository<RedemptionRequest, Long> {

    List<RedemptionRequest> findByFamilyGroupIdAndRequestedByIdOrderByRequestedAtDesc(
            Long familyGroupId, Long requestedById);
}
