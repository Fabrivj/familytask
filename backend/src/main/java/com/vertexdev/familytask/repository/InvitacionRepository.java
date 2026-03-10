package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Invitacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface InvitacionRepository extends JpaRepository<Invitacion, Long> {
    Optional<Invitacion> findByToken(UUID token);

    boolean existsByEmailInvitadoAndFamiliaIdAndUsadoFalseAndFechaExpiracionAfter(
            String email, Long familiaId, LocalDateTime ahora
    );
}