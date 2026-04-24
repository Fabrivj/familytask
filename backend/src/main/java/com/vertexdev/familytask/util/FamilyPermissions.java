package com.vertexdev.familytask.util;

import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.enums.Role;
import org.springframework.stereotype.Component;

/**
 * Central authority for family-level permission rules.
 * All role/permission checks must go through here instead of being inlined in services.
 *
 * Current permission model:
 * - PARENT (any): create tasks, invite members, view members, update family name
 * - PARENT (admin only): edit member roles, remove members, promote/demote admins
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

    /** Any active CHILD in the family. Used for child-only features like badges. */
    public boolean isActiveChild(FamilyMember member) {
        return member.getIsActive() && member.getRole() == Role.CHILD;
    }

    /** Any active member in the specified family, regardless of role. */
    public boolean isActiveMember(FamilyMember member, Long familyId) {
        return member != null
                && member.getIsActive()
                && member.getFamilyGroup().getId().equals(familyId);
    }

    /**
     * Whether {@code requester} can change the role (PARENT/CHILD) of {@code target}.
     * <p>Rules:
     * <ul>
     *   <li>Requester must be an active PARENT.</li>
     *   <li>If target is the family admin, only another admin can modify them.</li>
     *   <li>An admin cannot change their own role.</li>
     * </ul>
     */
    public boolean canEditMemberRole(FamilyMember requester, FamilyMember target) {
        if (!isActiveParent(requester)) return false;
        if (requester.getUser().getId().equals(target.getUser().getId())) return false;
        if (Boolean.TRUE.equals(target.getIsAdmin()) && !Boolean.TRUE.equals(requester.getIsAdmin())) return false;
        return true;
    }

    /**
     * Whether {@code requester} can change the admin status of {@code target}.
     * <p>Rules:
     * <ul>
     *   <li>Requester must be the family admin.</li>
     *   <li>Target must be an active PARENT.</li>
     *   <li>An admin cannot change their own admin status.</li>
     * </ul>
     */
    public boolean canChangeAdminStatus(FamilyMember requester, FamilyMember target) {
        if (!Boolean.TRUE.equals(requester.getIsAdmin()) || !isActiveParent(requester)) return false;
        if (requester.getUser().getId().equals(target.getUser().getId())) return false;
        if (!isActiveParent(target)) return false;
        return true;
    }

    /**
     * Whether {@code requester} can remove {@code target} from the family.
     * <p>Rules:
     * <ul>
     *   <li>Requester must be the family admin.</li>
     *   <li>The admin cannot remove themselves.</li>
     *   <li>Whether removing another admin leaves the family without admins is checked in the service.</li>
     * </ul>
     */
    public boolean canRemoveMember(FamilyMember requester, FamilyMember target) {
        if (!Boolean.TRUE.equals(requester.getIsAdmin()) || !isActiveParent(requester)) return false;
        return true;
    }
}
