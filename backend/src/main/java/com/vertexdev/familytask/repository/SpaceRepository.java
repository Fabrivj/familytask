package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {

    /**
     * Returns all spaces created by any active member of the given family.
     */
    @Query("""
            SELECT s FROM Space s
            WHERE s.createdBy.id IN (
                SELECT fm.user.id FROM FamilyMember fm
                WHERE fm.familyGroup.id = :familyId
                AND fm.isActive = true
            )
            ORDER BY s.createdAt ASC
            """)
    List<Space> findByFamilyGroupId(@Param("familyId") Long familyId);
}
