package com.vertexdev.familytask.seeder;

import com.vertexdev.familytask.model.Role;
import com.vertexdev.familytask.model.RoleEnum;
import com.vertexdev.familytask.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Se ejecuta primero, antes de otros seeders
public class RoleSeeder implements ApplicationListener<ContextRefreshedEvent> {

    private final RoleRepository roleRepository;

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {

        Map<RoleEnum, String> rolesToCreate = Map.of(
                RoleEnum.PARENT, "Padre/Tutor - Administra la familia, crea tareas y recompensas",
                RoleEnum.CHILD, "Hijo/a - Completa misiones, gana puntos y canjea recompensas"
        );

        rolesToCreate.forEach((roleEnum, description) -> {
            Optional<Role> existingRole = roleRepository.findByName(roleEnum);

            if (existingRole.isEmpty()) {
                Role newRole = Role.builder()
                        .name(roleEnum)
                        .description(description)
                        .build();

                roleRepository.save(newRole);
                log.info("Rol creado: {}", roleEnum.name());
            } else {
                log.info("Rol ya existe: {}", roleEnum.name());
            }
        });
    }
}
