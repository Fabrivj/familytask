package com.vertexdev.familytask.util;

import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.enums.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FamilyPermissionsTest {

    private final FamilyPermissions familyPermissions = new FamilyPermissions();

    // Test 4: isActiveParent respeta el rol y el estado activo del miembro
    @Test
    void isActiveParent_returnsCorrectly_basedOnRoleAndActiveStatus() {
        FamilyMember activePadre = FamilyMember.builder()
                .role(Role.PARENT).isActive(true).build();

        FamilyMember activeHijo = FamilyMember.builder()
                .role(Role.CHILD).isActive(true).build();

        FamilyMember inactivePadre = FamilyMember.builder()
                .role(Role.PARENT).isActive(false).build();

        assertThat(familyPermissions.isActiveParent(activePadre)).isTrue();
        assertThat(familyPermissions.isActiveParent(activeHijo)).isFalse();
        assertThat(familyPermissions.isActiveParent(inactivePadre)).isFalse();
    }
}
