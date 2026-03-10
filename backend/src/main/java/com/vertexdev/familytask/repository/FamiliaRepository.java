package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Familia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamiliaRepository extends JpaRepository<Familia, Long> {
}
