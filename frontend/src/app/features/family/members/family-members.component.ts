import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { FamilyService } from '@core/services/family.service';
import { MembersService } from '@core/services/members.service';
import { InvitationService } from '@core/services/invitation.service';
import { MemberItem, PendingInvitation } from '@core/models/member.model';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { injectLoadingState } from '@core/utils/loading-state';

const POLL_INTERVAL_MS = 15_000;

type DisplayRole = 'ADMIN' | 'PARENT' | 'CHILD';

@Component({
  selector: 'app-family-members',
  imports: [MatIconModule, AppShellComponent, PageHeaderComponent, RoleBadgeComponent, UserAvatarComponent, ConfirmDialogComponent],
  templateUrl: './family-members.component.html',
  styleUrls: [
    './family-members.component.css',
    './family-members-invitations.css',
    './family-members-responsive.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMembersComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  readonly permissions = inject(PermissionsService);
  private readonly membersService = inject(MembersService);
  private readonly invitationService = inject(InvitationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Sesión ───────────────────────────────────────────────────────────────

  private readonly currentEmail = computed(() => this.authService.session()?.email ?? '');

  readonly pageSubtitle = computed(() => {
    if (this.isLoading() || this.error()) return '';
    const m = this.members().length;
    const p = this.pendingInvitations().length;
    let text = `${m} miembro${m !== 1 ? 's' : ''} activo${m !== 1 ? 's' : ''}`;
    if (p > 0) text += ` · ${p} invitación${p !== 1 ? 'es' : ''} pendiente${p !== 1 ? 's' : ''}`;
    return text;
  });

  // ─── Estado ───────────────────────────────────────────────────────────────
  readonly members = signal<MemberItem[]>([]);
  readonly pendingInvitations = signal<PendingInvitation[]>([]);
  private readonly ls = injectLoadingState();
  readonly isLoading = this.ls.isLoading;
  readonly error = this.ls.error;
  readonly isForbidden = signal(false);
  readonly copiedToken = signal('');
  readonly cancelingToken = signal('');
  readonly changingRoleId = signal(0);
  readonly openDropdownId = signal(0);
  readonly confirmDialogOpen = signal(false);
  readonly pendingRoleChange = signal<{ member: MemberItem; newDisplayRole: DisplayRole } | null>(null);

  readonly confirmTitle = computed(() => 'Cambiar rol');
  readonly confirmMessage = computed(() => {
    const pending = this.pendingRoleChange();
    if (!pending) return '';
    const label = this.displayRoleLabel(pending.newDisplayRole);
    return `¿Estás seguro de cambiar el rol de ${pending.member.name} a ${label}?`;
  });

  readonly removeDialogOpen = signal(false);
  readonly pendingRemove = signal<MemberItem | null>(null);
  readonly isRemoving = signal(false);
  readonly removeMessage = computed(() => {
    const m = this.pendingRemove();
    return m ? `Vas a remover a ${m.name} de la familia.` : '';
  });

  ngOnInit(): void {
    const state = history.state as { message?: string };
    if (state?.message) {
      this.snackBar.open(state.message, 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
    }

    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) {
      this.router.navigate(['/family/select']);
      return;
    }

    this.fetchMembers(familyId);
    this.startPolling(familyId);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ─── Polling ──────────────────────────────────────────────────────────────
  private startPolling(familyId: number): void {
    this.pollTimer = setInterval(() => {
      this.pollMembers(familyId);
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────
  private fetchMembers(familyId: number): void {
    this.ls.run(this.membersService.getMembers(familyId), {
      next: (data) => {
        this.members.set(data.members);
        this.pendingInvitations.set(data.pendingInvitations);
      },
      error: (err: any) => {
        if (err?.status === 403) this.isForbidden.set(true);
      },
    });
  }

  /** Silent background poll — keeps previous data visible on error. */
  private pollMembers(familyId: number): void {
    this.membersService.getMembers(familyId).subscribe({
      next: (data) => {
        this.members.set(data.members);
        this.pendingInvitations.set(data.pendingInvitations);
        // Refresh session so the current user's role/admin status stays in sync
        this.authService.refreshSession().subscribe();
      },
    });
  }

  retry(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;
    this.fetchMembers(familyId);
  }

  // ─── Precomputed member / invitation meta (avoids per-CD-tick method calls) ─
  readonly memberMeta = computed(() => {
    const email = this.currentEmail();
    const map = new Map<number, {
      isCurrent: boolean;
      displayRole: DisplayRole;
      canEdit: boolean;
      canChangeAdmin: boolean;
      canRemove: boolean;
      xpPercent: number;
      xpInLevel: number;
      xpNeeded: number;
    }>();
    for (const m of this.members()) {
      const isCurrent = m.email === email;
      const displayRole: DisplayRole = m.isAdmin ? 'ADMIN' : m.role === 'PARENT' ? 'PARENT' : 'CHILD';
      const canEdit = this.permissions.canEditMemberRole(m);
      const canChangeAdmin = this.permissions.canChangeAdminStatus(m);
      const canRemove = this.permissions.canRemoveMember(m);
      const xpNeeded = 100 * ((m.currentLevel ?? 0) + 1);
      const xpIn = xpNeeded - (m.xpToNextLevel ?? 0);
      const xpPct = Math.min(100, Math.max(0, (xpIn / xpNeeded) * 100));
      map.set(m.id, { isCurrent, displayRole, canEdit, canChangeAdmin, canRemove, xpPercent: xpPct, xpInLevel: xpIn, xpNeeded });
    }
    return map;
  });

  readonly invitationMeta = computed(() => {
    const map = new Map<string, { daysAgo: number; daysUntil: number }>();
    for (const inv of this.pendingInvitations()) {
      const ago = Math.max(0, Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 86_400_000));
      const until = Math.max(0, Math.ceil((new Date(inv.expirationDate).getTime() - Date.now()) / 86_400_000));
      map.set(inv.token, { daysAgo: ago, daysUntil: until });
    }
    return map;
  });

  confirmRemove(member: MemberItem): void {
    this.pendingRemove.set(member);
    this.removeDialogOpen.set(true);
  }

  onConfirmRemove(): void {
    const member = this.pendingRemove();
    this.removeDialogOpen.set(false);
    this.pendingRemove.set(null);
    if (!member) return;

    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;

    this.isRemoving.set(true);
    this.familyService.removeMember(familyId, member.id).subscribe({
      next: () => {
        this.isRemoving.set(false);
        this.snackBar.open('Miembro removido exitosamente.', 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
        this.pollMembers(familyId);
      },
      error: (err) => {
        this.isRemoving.set(false);
        const message = err?.status === 409
          ? (err?.error?.message ?? 'Debe existir al menos un administrador en la familia.')
          : 'No se pudo remover el miembro. Intenta de nuevo.';
        this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  onCancelRemove(): void {
    this.removeDialogOpen.set(false);
    this.pendingRemove.set(null);
  }

  displayRoleLabel(displayRole: DisplayRole): string {
    if (displayRole === 'ADMIN') return 'Administrador';
    if (displayRole === 'PARENT') return 'Tutor';
    return 'Hijo/a';
  }

  /** Label shown on role dropdown button for a member. */
  memberRoleLabel(member: MemberItem): string {
    const displayRole: DisplayRole = member.isAdmin ? 'ADMIN' : member.role === 'PARENT' ? 'PARENT' : 'CHILD';
    return this.displayRoleLabel(displayRole);
  }

  inviteMember(): void {
    this.router.navigate(['/invitation/create']);
  }

  inviteLink(token: string): string {
    return `${window.location.origin}/invitation?token=${token}`;
  }

  cancelInvite(token: string): void {
    if (this.cancelingToken()) return;
    this.cancelingToken.set(token);
    this.invitationService.cancel(token).subscribe({
      next: () => {
        this.pendingInvitations.update(list => list.filter(i => i.token !== token));
        this.cancelingToken.set('');
      },
      error: () => {
        this.cancelingToken.set('');
      },
    });
  }

  toggleDropdown(memberId: number): void {
    this.openDropdownId.set(this.openDropdownId() === memberId ? 0 : memberId);
  }

  selectRole(member: MemberItem, newDisplayRole: DisplayRole): void {
    this.openDropdownId.set(0);
    const currentDisplayRole: DisplayRole = member.isAdmin ? 'ADMIN' : member.role === 'PARENT' ? 'PARENT' : 'CHILD';
    if (currentDisplayRole === newDisplayRole) return;
    this.pendingRoleChange.set({ member, newDisplayRole });
    this.confirmDialogOpen.set(true);
  }

  onConfirmRoleChange(): void {
    const pending = this.pendingRoleChange();
    this.confirmDialogOpen.set(false);
    this.pendingRoleChange.set(null);
    if (!pending) return;

    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;

    this.changingRoleId.set(pending.member.id);

    const { member, newDisplayRole } = pending;

    if (newDisplayRole === 'ADMIN') {
      // Promote to admin (keep PARENT role, set isAdmin=true)
      this.familyService.updateMemberAdmin(familyId, member.id, true).subscribe({
        next: () => this.onRoleChangeSuccess(familyId),
        error: (err) => this.onRoleChangeError(err),
      });
    } else if (newDisplayRole === 'PARENT' && member.isAdmin) {
      // Demote from admin (keep PARENT role, set isAdmin=false)
      this.familyService.updateMemberAdmin(familyId, member.id, false).subscribe({
        next: () => this.onRoleChangeSuccess(familyId),
        error: (err) => this.onRoleChangeError(err),
      });
    } else {
      // Change role between PARENT and CHILD
      const newRole = newDisplayRole === 'PARENT' ? 'PARENT' : 'CHILD';
      this.familyService.updateMemberRole(familyId, member.id, newRole).subscribe({
        next: () => this.onRoleChangeSuccess(familyId),
        error: (err) => this.onRoleChangeError(err),
      });
    }
  }

  private onRoleChangeSuccess(familyId: number): void {
    this.snackBar.open('Rol actualizado exitosamente.', 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
    this.authService.refreshSession().subscribe();
    this.pollMembers(familyId);
    this.changingRoleId.set(0);
  }

  private onRoleChangeError(err: any): void {
    const message = err?.status === 403
      ? 'No tienes permisos para cambiar roles en esta familia.'
      : err?.status === 409
        ? (err?.error?.message ?? 'Debe existir al menos un Padre/Tutor en la familia.')
        : 'No se pudo actualizar el rol. Intenta nuevamente.';
    this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
    this.changingRoleId.set(0);
  }

  onCancelRoleChange(): void {
    this.confirmDialogOpen.set(false);
    this.pendingRoleChange.set(null);
  }

  copyLink(token: string): void {
    navigator.clipboard.writeText(this.inviteLink(token)).then(() => {
      this.copiedToken.set(token);
      setTimeout(() => this.copiedToken.set(''), 2000);
    });
  }
}
