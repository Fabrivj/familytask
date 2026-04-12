package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.RedemptionRequest;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RedemptionRepository extends JpaRepository<RedemptionRequest, Long>, JpaSpecificationExecutor<RedemptionRequest> {

    List<RedemptionRequest> findByFamilyGroupIdAndRequestedByIdOrderByRequestedAtDesc(
            Long familyGroupId, Long requestedById);

    @Query("""
        SELECT r.reward.id, COUNT(r)
        FROM RedemptionRequest r
        WHERE r.familyGroup.id = :familyGroupId
          AND r.status = com.vertexdev.familytask.model.enums.RedemptionStatus.PENDING
        GROUP BY r.reward.id
    """)
    List<Object[]> countPendingPerReward(@Param("familyGroupId") Long familyGroupId);

    @Query("""
        SELECT r FROM RedemptionRequest r
        JOIN FETCH r.reward reward
        JOIN FETCH r.requestedBy member
        JOIN FETCH member.user user
        WHERE r.familyGroup.id = :familyGroupId
          AND (:memberId IS NULL OR member.user.id = :memberId)
          AND (:statusStr IS NULL OR CAST(r.status AS STRING) = :statusStr)
          AND r.requestedAt >= :dateFrom
          AND r.requestedAt <= :dateTo
        ORDER BY r.requestedAt DESC
    """)
    List<RedemptionRequest> findHistory(
            @Param("familyGroupId") Long familyGroupId,
            @Param("memberId") Long memberId,
            @Param("statusStr") String statusStr,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo
    );
}
