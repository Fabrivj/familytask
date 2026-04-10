package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Redemption;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RedemptionRepository extends JpaRepository<Redemption, Long> {

    @Query("""
        SELECT r FROM Redemption r
        WHERE r.familyGroup.id = :familyGroupId
          AND (:memberId IS NULL OR r.redeemedBy.id = :memberId)
          AND (:status IS NULL OR r.status = :status)
          AND (:dateFrom IS NULL OR r.redeemedAt >= :dateFrom)
          AND (:dateTo IS NULL OR r.redeemedAt <= :dateTo)
        ORDER BY r.redeemedAt DESC
    """)
    List<Redemption> findHistory(
        @Param("familyGroupId") Long familyGroupId,
        @Param("memberId") Long memberId,
        @Param("status") RedemptionStatus status,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo
    );
}
