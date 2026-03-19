package com.vertexdev.familytask.repository;

import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByUserIdAndIsActiveTrue(Long userId);
    Optional<FamilyMember> findByFamilyGroupIdAndUserId(Long familyGroupId, Long userId);
    boolean existsByFamilyGroupIdAndUserId(Long familyGroupId, Long userId);
    long countByFamilyGroupIdAndRoleAndIsActiveTrue(Long familyGroupId, Role role);
    long countByFamilyGroupIdAndIsActiveTrue(Long familyGroupId);
    List<FamilyMember> findByFamilyGroupIdAndIsActiveTrue(Long familyGroupId);
}
