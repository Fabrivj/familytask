package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.FamiliaMiembro;
import com.vertexdev.familytask.model.enums.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FamiliaMiembroRepository extends JpaRepository<FamiliaMiembro, Long> {
    List<FamiliaMiembro> findByUsuarioIdAndActivoTrue(Long usuarioId);
    Optional<FamiliaMiembro> findByFamiliaIdAndUsuarioId(Long familiaId, Long usuarioId);
    boolean existsByFamiliaIdAndUsuarioId(Long familiaId, Long usuarioId);
    long countByFamiliaIdAndRolAndActivoTrue(Long familiaId, Rol rol);
}
