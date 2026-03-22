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
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { FamilyService } from '../../../core/services/family.service';
import { MembersService } from '../../../core/services/members.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { MemberItem, PendingInvitation } from '../../../core/models/member.model';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-family-members',
  imports: [MatIconModule, AppShellComponent, PageHeaderComponent, RoleBadgeComponent, UserAvatarComponent, ConfirmDialogComponent],
  templateUrl: './family-members.component.html',
  styleUrl: './family-members.component.css',
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
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly isForbidden = signal(false);
  readonly copiedToken = signal('');
  readonly cancelingToken = signal('');
  readonly changingRoleId = signal(0);
  readonly openDropdownId = signal(0);
  readonly confirmDialogOpen = signal(false);
  readonly pendingRoleChange = signal<{ member: MemberItem; newRole: 'PARENT' | 'CHILD' } | null>(null);

  readonly confirmTitle = computed(() => 'Cambiar rol');
  readonly confirmMessage = computed(() => {
    const pending = this.pendingRoleChange();
    if (!pending) return '';
    const newRoleLabel = pending.newRole === 'PARENT' ? 'Padre/Tutor' : 'Hijo/a';
    return `¿Estás seguro de cambiar el rol de ${pending.member.name} a ${newRoleLabel}?`;
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

    this.fetchMembers(familyId, true);
    this.startPolling(familyId);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ─── Polling ──────────────────────────────────────────────────────────────
  private startPolling(familyId: number): void {
    this.pollTimer = setInterval(() => {
      this.fetchMembers(familyId, false);
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────
  private fetchMembers(familyId: number, showLoader: boolean): void {
    if (showLoader) this.isLoading.set(true);

    this.membersService.getMembers(familyId).subscribe({
      next: (data) => {
        this.members.set(data.members);
        this.pendingInvitations.set(data.pendingInvitations);
        this.isLoading.set(false);
        this.error.set('');
      },
      error: (err) => {
        if (showLoader) {
          const forbidden = err?.status === 403;
          this.isForbidden.set(forbidden);
          this.error.set(forbidden
            ? 'No tienes permisos para ver los miembros de esta familia.'
            : 'Error al cargar los miembros. Intenta de nuevo.');
          this.isLoading.set(false);
        }
        // En el polling en background dejamos los datos anteriores visibles
      },
    });
  }

  retry(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;
    this.fetchMembers(familyId, true);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  canEdit(member: MemberItem): boolean {
    return this.permissions.canEditMemberRole(member);
  }

  isCurrentUser(member: MemberItem): boolean {
    return member.email === this.currentEmail();
  }

  roleDropdownLabel(role: 'PARENT' | 'CHILD'): string {
    return role === 'PARENT' ? 'Tutor' : 'Hijo/a';
  }

  daysAgo(dateStr: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
  }

  daysUntil(dateStr: string): number {
    return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
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

  selectRole(member: MemberItem, newRole: 'PARENT' | 'CHILD'): void {
    this.openDropdownId.set(0);
    if (member.role === newRole) return;
    this.pendingRoleChange.set({ member, newRole });
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

    this.familyService.updateMemberRole(familyId, pending.member.id, pending.newRole).subscribe({
      next: () => {
        this.snackBar.open('Rol actualizado exitosamente.', 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
        this.fetchMembers(familyId, false);
        this.changingRoleId.set(0);
      },
      error: (err) => {
        const message = err?.status === 403
          ? 'No tienes permisos para cambiar roles en esta familia.'
          : err?.status === 409
            ? 'Debe existir al menos un Padre/Tutor en la familia.'
            : 'No se pudo actualizar el rol. Intenta nuevamente.';
        this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
        this.changingRoleId.set(0);
      },
    });
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
