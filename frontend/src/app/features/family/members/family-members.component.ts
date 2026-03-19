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
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

const POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-family-members',
  imports: [UserAvatarComponent],
  templateUrl: './family-members.component.html',
  styleUrl: './family-members.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMembersComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // ── Topbar ──────────────────────────────────────────────────────────────
  readonly shortName = computed(() => {
    const name = this.authService.session()?.name ?? '';
    return name.split(' ')[0];
  });

  readonly currentUserPictureUrl = computed(
    () => this.authService.session()?.pictureUrl ?? ''
  );

  readonly familyName = computed(() => {
    const families = this.authService.families();
    const activeId = this.authService.getActiveFamilyId();
    return families.find(f => f.familyId === activeId)?.familyName ?? 'Mi familia';
  });

  readonly userRole = computed(() => {
    const families = this.authService.families();
    const activeId = this.authService.getActiveFamilyId();
    const role = families.find(f => f.familyId === activeId)?.role;
    return role === 'PARENT' ? 'Padre · Admin' : 'Hijo/a';
  });

  private readonly currentEmail = computed(() => this.authService.session()?.email ?? '');

  // ── Data signals ─────────────────────────────────────────────────────────
  readonly members = signal<MemberItem[]>([]);
  readonly pendingInvitations = signal<PendingInvitation[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly toast = signal('');

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
      error: () => {
        if (showLoader) {
          this.error.set('Error al cargar los miembros. Intenta de nuevo.');
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

  roleBadgeLabel(role: 'PARENT' | 'CHILD'): string {
    return role === 'PARENT' ? 'PADRE' : 'HIJO/A';
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

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
