package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.invitacion.CrearInvitacionRequest;
import com.vertexdev.familytask.dto.invitacion.InvitacionResponse;
import com.vertexdev.familytask.dto.invitacion.ProcesarInvitacionRequest;
import com.vertexdev.familytask.mapper.InvitacionMapper;
import com.vertexdev.familytask.model.Familia;
import com.vertexdev.familytask.model.FamiliaMiembro;
import com.vertexdev.familytask.model.Invitacion;
import com.vertexdev.familytask.model.Usuario;
import com.vertexdev.familytask.model.enums.Rol;
import com.vertexdev.familytask.repository.FamiliaMiembroRepository;
import com.vertexdev.familytask.repository.FamiliaRepository;
import com.vertexdev.familytask.repository.InvitacionRepository;
import com.vertexdev.familytask.repository.UsuarioRepository;
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
public class InvitacionService {

    @Value("${app.invitation.expiration-days}")
    private int expirationDays;

    @Value("${app.invitation.base-url}")
    private String baseUrl;

    private final InvitacionRepository invitacionRepository;
    private final FamiliaRepository familiaRepository;
    private final FamiliaMiembroRepository familiaMiembroRepository;
    private final InvitacionMapper invitacionMapper;
    private final UsuarioRepository usuarioRepository;

    /**
     * Paso 2 del flujo: el Padre/Tutor genera la invitación.
     */
    @Transactional
    public InvitacionResponse crearInvitacion(CrearInvitacionRequest request, Usuario solicitante) {
        Familia familia = familiaRepository.findById(request.getFamiliaId())
                .orElseThrow(() -> new RuntimeException("Familia no encontrada"));

        // Verificar que el solicitante es PADRE_TUTOR en esa familia
        familiaMiembroRepository
                .findByFamiliaIdAndUsuarioId(familia.getId(), solicitante.getId())
                .filter(m -> m.getRol() == Rol.PADRE_TUTOR && m.getActivo())
                .orElseThrow(() -> new RuntimeException("No tienes permisos para invitar miembros a esta familia"));

        // Validar que el email no sea ya miembro activo ni tenga invitación pendiente
        boolean yaMiembro = usuarioRepository.findByEmail(request.getEmailInvitado())
                .map(usuarioExistente -> familiaMiembroRepository
                        .existsByFamiliaIdAndUsuarioId(familia.getId(), usuarioExistente.getId()))
                .orElse(false);

        if (yaMiembro) {
            throw new RuntimeException(
                    "Este correo ya es miembro activo de esta familia.");
        }


        boolean tieneInvitacionPendiente = invitacionRepository
                .existsByEmailInvitadoAndFamiliaIdAndUsadoFalseAndFechaExpiracionAfter(
                        request.getEmailInvitado(), familia.getId(), LocalDateTime.now()
                );

        if (yaMiembro || tieneInvitacionPendiente) {
            throw new RuntimeException("Este correo ya tiene una invitación pendiente para esta familia.");
        }

        // Crear la invitación
        UUID token = UUID.randomUUID();
        LocalDateTime expiracion = LocalDateTime.now().plusDays(expirationDays);

        Invitacion invitacion = Invitacion.builder()
                .token(token)
                .emailInvitado(request.getEmailInvitado())
                .rol(request.getRol())
                .familia(familia)
                .fechaExpiracion(expiracion)
                .usado(false)
                .build();

        invitacionRepository.save(invitacion);
        log.info("Invitación creada para {} en familia {}", request.getEmailInvitado(), familia.getNombre());

        // Construir la respuesta con el link
        InvitacionResponse response = invitacionMapper.toResponse(invitacion);
        response.setLinkInvitacion(baseUrl + "?token=" + token);
        return response;
    }

    /**
     * Paso 4 del flujo: el invitado, ya autenticado con Google, procesa el token.
     */
    @Transactional
    public void procesarInvitacion(ProcesarInvitacionRequest request, Usuario usuarioAutenticado) {
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(request.getToken());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        Invitacion invitacion = invitacionRepository.findByToken(tokenUUID)
                .orElseThrow(() -> new RuntimeException("La invitación no es válida o expiró"));

        // Validar que no esté usada
        if (invitacion.getUsado()) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validar que no haya expirado
        if (LocalDateTime.now().isAfter(invitacion.getFechaExpiracion())) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validar que el email de Google coincide con el email de la invitación
        if (!invitacion.getEmailInvitado().equalsIgnoreCase(usuarioAutenticado.getEmail())) {
            throw new RuntimeException("Esta invitación no pertenece a tu cuenta de Google");
        }

        // Verificar que no sea ya miembro
        if (familiaMiembroRepository.existsByFamiliaIdAndUsuarioId(
                invitacion.getFamilia().getId(), usuarioAutenticado.getId())) {
            throw new RuntimeException("Ya eres miembro de esta familia");
        }

        // Agregar al usuario como miembro de la familia con el rol de la invitación
        FamiliaMiembro nuevoMiembro = FamiliaMiembro.builder()
                .familia(invitacion.getFamilia())
                .usuario(usuarioAutenticado)
                .rol(invitacion.getRol())
                .activo(true)
                .build();

        familiaMiembroRepository.save(nuevoMiembro);

        // Marcar invitación como usada
        invitacion.setUsado(true);
        invitacionRepository.save(invitacion);

        log.info("Usuario {} incorporado a familia {} con rol {}",
                usuarioAutenticado.getEmail(),
                invitacion.getFamilia().getNombre(),
                invitacion.getRol());
    }
}