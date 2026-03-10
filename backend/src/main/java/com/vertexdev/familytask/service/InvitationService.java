package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.invitacion.CreateInviteRequest;
import com.vertexdev.familytask.dto.invitacion.InviteResponse;
import com.vertexdev.familytask.dto.invitacion.ProcessInviteRequest;
import com.vertexdev.familytask.mapper.InviteMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Invitation;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.InvitationRepository;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    @Value("${app.invitation.expiration-days}")
    private int expirationDays;

    @Value("${app.invitation.base-url}")
    private String baseUrl;

    private final InvitationRepository invitationRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final InviteMapper invitacionMapper;
    private final UserRepository userRepository;

    /**
     * Paso 2 del flujo: el Padre/Tutor genera la invitación.
     */
    @Transactional
    public InviteResponse crearInvitacion(CreateInviteRequest request, User solicitante) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new RuntimeException("Familia no encontrada"));

        // Verificar que el solicitante es PADRE_TUTOR en esa familia
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), solicitante.getId())
                .filter(m -> m.getRole() == Role.PARENT && m.getIsActive())
                .orElseThrow(() -> new RuntimeException("No tienes permisos para invitar miembros a esta familia"));

        // Validar que el email no sea ya miembro activo ni tenga invitación pendiente
        boolean yaMiembro = userRepository.findByEmail(request.getInvitedEmail())
                .map(usuarioExistente -> familyMemberRepository
                        .existsByFamilyGroupIdAndUserId(familyGroup.getId(), usuarioExistente.getId()))
                .orElse(false);

        if (yaMiembro) {
            throw new RuntimeException(
                    "Este correo ya es miembro activo de esta familia.");
        }


        boolean tieneInvitacionPendiente = invitationRepository
                .existsByInvitedEmailAndFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(
                        request.getInvitedEmail(), familyGroup.getId(), LocalDateTime.now()
                );

        if (yaMiembro || tieneInvitacionPendiente) {
            throw new RuntimeException("Este correo ya tiene una invitación pendiente para esta familia.");
        }

        // Crear la invitación
        UUID token = UUID.randomUUID();
        LocalDateTime expiracion = LocalDateTime.now().plusDays(expirationDays);

        Invitation invitation = Invitation.builder()
                .token(token)
                .invitedEmail(request.getInvitedEmail())
                .role(request.getRole())
                .familyGroup(familyGroup)
                .expirationDate(expiracion)
                .isUsed(false)
                .build();

        invitationRepository.save(invitation);
        log.info("Invitación creada para {} en familia {}", request.getInvitedEmail(), familyGroup.getNombre());

        // Construir la respuesta con el link
        InviteResponse response = invitacionMapper.toResponse(invitation);
        response.setInviteLink(baseUrl + "?token=" + token);
        return response;
    }

    /**
     * Paso 4 del flujo: el invitado, ya autenticado con Google, procesa el token.
     */
    @Transactional
    public void procesarInvitacion(ProcessInviteRequest request, User userAutenticado) {
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(request.getToken());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        Invitation invitation = invitationRepository.findByToken(tokenUUID)
                .orElseThrow(() -> new RuntimeException("La invitación no es válida o expiró"));

        // Validar que no esté usada
        if (invitation.getIsUsed()) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validar que no haya expirado
        if (LocalDateTime.now().isAfter(invitation.getExpirationDate())) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validar que el email de Google coincide con el email de la invitación
        if (!invitation.getInvitedEmail().equalsIgnoreCase(userAutenticado.getEmail())) {
            throw new RuntimeException("Esta invitación no pertenece a tu cuenta de Google");
        }

        // Verificar que no sea ya miembro
        if (familyMemberRepository.existsByFamilyGroupIdAndUserId(
                invitation.getFamilyGroup().getId(), userAutenticado.getId())) {
            throw new RuntimeException("Ya eres miembro de esta familia");
        }

        // Agregar al usuario como miembro de la familia con el rol de la invitación
        FamilyMember nuevoMiembro = FamilyMember.builder()
                .familyGroup(invitation.getFamilyGroup())
                .user(userAutenticado)
                .role(invitation.getRole())
                .isActive(true)
                .build();

        familyMemberRepository.save(nuevoMiembro);

        // Marcar invitación como usada
        invitation.setIsUsed(true);
        invitationRepository.save(invitation);

        log.info("Usuario {} incorporado a familia {} con rol {}",
                userAutenticado.getEmail(),
                invitation.getFamilyGroup().getNombre(),
                invitation.getRole());
    }
}