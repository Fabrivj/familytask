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
import { AuthService } from '../../../core/services/auth.service';
import { FamilyService, MemberItem, PendingInvitation } from '../../../core/services/family.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { TopBarComponent } from '../../../shared/components/top-bar/top-bar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-family-members',
  imports: [PageLayoutComponent, TopBarComponent, PageHeaderComponent, RoleBadgeComponent, SidebarComponent, UserAvatarComponent, ConfirmDialogComponent],
  templateUrl: './family-members.component.html',
  styleUrl: './family-members.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMembersComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly invitationService = inject(InvitationService);
  private readonly router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // ── Session ──────────────────────────────────────────────────────────────
  readonly session = this.authService.session;

  readonly shortName = computed(() => this.authService.session()?.name?.split(' ')[0] ?? '');
  readonly userEmail = computed(() => this.authService.session()?.email ?? '');
  readonly currentUserPictureUrl = computed(() => this.authService.session()?.pictureUrl ?? '');

  readonly familyName = computed(() => this.authService.activeFamily()?.familyName ?? '');

  readonly userRole = computed(() => {
    const family = this.authService.activeFamily();
    if (family?.role === 'PARENT') {
      return family.isAdmin ? 'Padre · Admin' : 'Padre · Tutor';
    }
    return 'Hijo/a';
  });

  readonly isAdmin = computed(() => this.authService.activeFamily()?.isAdmin === true);

  private readonly currentEmail = computed(() => this.authService.session()?.email ?? '');

  readonly pageSubtitle = computed(() => {
    if (this.isLoading() || this.error()) return '';
    const m = this.members().length;
    const p = this.pendingInvitations().length;
    let text = `${m} miembro${m !== 1 ? 's' : ''} activo${m !== 1 ? 's' : ''}`;
    if (p > 0) text += ` · ${p} invitación${p !== 1 ? 'es' : ''} pendiente${p !== 1 ? 's' : ''}`;
    return text;
  });

  // ── Data signals ─────────────────────────────────────────────────────────
  readonly members = signal<MemberItem[]>([]);
  readonly pendingInvitations = signal<PendingInvitation[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly isForbidden = signal(false);
  readonly toast = signal('');
  readonly copiedToken = signal('');
  readonly cancelingToken = signal('');
  readonly changingRoleId = signal(0);
  readonly openDropdownId = signal(0);
  readonly confirmDialogOpen = signal(false);
  readonly pendingRoleChange = signal<{ member: MemberItem; newRole: 'PARENT' | 'CHILD' } | null>(null);
  readonly logoutLoading = signal(false);

  readonly confirmTitle = computed(() => 'Cambiar rol');
  readonly confirmMessage = computed(() => {
    const pending = this.pendingRoleChange();
    if (!pending) return '';
    const newRoleLabel = pending.newRole === 'PARENT' ? 'Padre/Tutor' : 'Hijo/a';
    return `¿Estás seguro de cambiar el rol de ${pending.member.name} a ${newRoleLabel}?`;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const state = history.state as { message?: string };
    if (state?.message) {
      this.toast.set(state.message);
      setTimeout(() => this.toast.set(''), 3500);
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

  // ── Polling ──────────────────────────────────────────────────────────────
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

  // ── Data loading ─────────────────────────────────────────────────────────
  private fetchMembers(familyId: number, showLoader: boolean): void {
    if (showLoader) this.isLoading.set(true);

    this.familyService.getMembers(familyId).subscribe({
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
        // Silent failure on background poll — keep previous data
      },
    });
  }

  retry(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;
    this.fetchMembers(familyId, true);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  onLogout(): void {
    this.logoutLoading.set(true);
    this.authService.logout().subscribe({
      next: (res) => {
        this.authService.clearLocalSession();
        this.router.navigate(['/auth/login'], { state: { message: res.message } });
      },
      error: () => {
        this.logoutLoading.set(false);
      },
    });
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
        this.toast.set('Rol actualizado exitosamente.');
        setTimeout(() => this.toast.set(''), 3500);
        this.fetchMembers(familyId, false);
        this.changingRoleId.set(0);
      },
      error: (err) => {
        const message = err?.status === 403
          ? 'No tienes permisos para cambiar roles en esta familia.'
          : err?.status === 409
            ? 'Debe existir al menos un Padre/Tutor en la familia.'
            : 'No se pudo actualizar el rol. Intenta nuevamente.';
        this.toast.set(message);
        setTimeout(() => this.toast.set(''), 3500);
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
