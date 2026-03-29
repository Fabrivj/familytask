package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {

    List<Space> findByFamilyGroupIdOrderByCreatedAtAsc(Long familyGroupId);

    Optional<Space> findByIdAndFamilyGroupId(Long id, Long familyGroupId);
}
