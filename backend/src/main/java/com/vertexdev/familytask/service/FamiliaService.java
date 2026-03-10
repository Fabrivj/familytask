package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.familia.CrearFamiliaRequest;
import com.vertexdev.familytask.dto.familia.FamiliaResponse;
import com.vertexdev.familytask.model.Familia;
import com.vertexdev.familytask.model.FamiliaMiembro;
import com.vertexdev.familytask.model.Usuario;
import com.vertexdev.familytask.model.enums.Rol;
import com.vertexdev.familytask.repository.FamiliaMiembroRepository;
import com.vertexdev.familytask.repository.FamiliaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FamiliaService {

    private final FamiliaRepository familiaRepository;
    private final FamiliaMiembroRepository familiaMiembroRepository;

    @Transactional
    public FamiliaResponse crearFamilia(CrearFamiliaRequest request, Usuario creador) {
        Familia familia = Familia.builder()
                .nombre(request.getNombre())
                .build();

        familiaRepository.save(familia);

        // El creador queda automáticamente como PADRE_TUTOR
        FamiliaMiembro miembro = FamiliaMiembro.builder()
                .familia(familia)
                .usuario(creador)
                .rol(Rol.PADRE_TUTOR)
                .activo(true)
                .build();

        familiaMiembroRepository.save(miembro);
        log.info("Familia '{}' creada por {}", familia.getNombre(), creador.getEmail());

        return FamiliaResponse.builder()
                .id(familia.getId())
                .nombre(familia.getNombre())
                .rol(Rol.PADRE_TUTOR.name())
                .build();
    }
}