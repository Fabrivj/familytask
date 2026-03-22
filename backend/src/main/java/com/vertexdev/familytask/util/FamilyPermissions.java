package com.vertexdev.familytask.util;

import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.enums.Role;
import org.springframework.stereotype.Component;

/**
 * Central authority for family-level permission rules.
 * All role/permission checks must go through here instead of being inlined in services.
 *
 * Current permission model:
 * - PARENT (any): create tasks, invite members, view members, update family name, edit member roles
 * - PARENT (admin only): edit or demote the admin member's own role
 * - CHILD: view own assigned tasks only
 *
 * When business rules change, update only this class.
 */
@Component
public class FamilyPermissions {

    /** Any active PARENT in the family. Base requirement for most write operations. */
    public boolean isActiveParent(FamilyMember member) {
        return member.getIsActive() && member.getRole() == Role.PARENT;
    }

    /**
     * Whether {@code requester} can change the role of {@code target}.
     * <p>Rules:
     * <ul>
     *   <li>Requester must be an active PARENT.</li>
     *   <li>If target is the family admin, only another admin can modify them.</li>
     * </ul>
     */
    public boolean canEditMemberRole(FamilyMember requester, FamilyMember target) {
        if (!isActiveParent(requester)) return false;
        if (Boolean.TRUE.equals(target.getIsAdmin()) && !Boolean.TRUE.equals(requester.getIsAdmin())) return false;
        return true;
    }
}
