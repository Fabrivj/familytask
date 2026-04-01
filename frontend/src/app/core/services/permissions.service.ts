import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MemberItem } from '../models/member.model';

/**
 * Central authority for UI permission decisions.
 * Mirrors the rules in the backend's FamilyPermissions.java.
 *
 * Components consume signals and methods from here instead of reading
 * AuthService directly for authorization logic.
 * When business rules change, update only this service.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly authService = inject(AuthService);

  /** Whether the current user is a PARENT in the active family. */
  readonly isParent = computed(() => this.authService.activeFamily()?.role === 'PARENT');

  /** Whether the current user is the family admin (creator). */
  readonly isAdmin = computed(() => this.authService.activeFamily()?.isAdmin === true);

  /**
   * Whether the current user can edit {@link member}'s role.
   * Rules (mirror of FamilyPermissions.java#canEditMemberRole):
   * - Current user must be a PARENT.
   * - If target member is the admin, current user must also be admin.
   */
  canEditMemberRole(member: MemberItem): boolean {
    const me = this.authService.activeFamily();
    if (me?.role !== 'PARENT') return false;
    if (member.isAdmin && !me.isAdmin) return false;
    return true;
  }

  /**
   * Whether the current user can remove {@link member} from the family.
   * Rules (mirror of FamilyPermissions.java#canRemoveMember):
   * - Current user must be the family admin.
   * - The admin cannot remove themselves.
   */
  canRemoveMember(member: MemberItem): boolean {
    if (!this.isAdmin()) return false;
    if (member.isAdmin) return false;
    return true;
  }
}
