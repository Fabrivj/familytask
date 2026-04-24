package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.TaskCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TaskCompletionRepository extends JpaRepository<TaskCompletion, Long> {

    Optional<TaskCompletion> findByTaskAssignmentId(Long taskAssignmentId);

    boolean existsByTaskAssignmentId(Long taskAssignmentId);

    @Query("""
        SELECT tc FROM TaskCompletion tc
        WHERE tc.taskAssignment.task.familyGroup.id = :familyId
          AND tc.completedAt >= :start AND tc.completedAt <= :end
          AND (:memberId IS NULL OR tc.taskAssignment.user.id = :memberId)
          AND (:spaceId  IS NULL OR tc.taskAssignment.task.homeSpace.id = :spaceId)
        """)
    List<TaskCompletion> findByFamilyAndWeek(
            @Param("familyId") Long familyId,
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end,
            @Param("memberId") Long memberId,
            @Param("spaceId")  Long spaceId);
}
