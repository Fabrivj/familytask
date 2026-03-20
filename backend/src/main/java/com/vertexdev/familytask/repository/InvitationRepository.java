package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByToken(UUID token);

    boolean existsByInvitedEmailAndFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(
            String email, Long familyGroupId, LocalDateTime now
    );

    List<Invitation> findByFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(
            Long familyGroupId, LocalDateTime now
    );
}