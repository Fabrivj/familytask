import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { BadgeService } from '../../core/services/badge.service';
import { BadgeResponse } from '../../core/models/badge.model';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-badges',
  imports: [MatIconModule, AppShellComponent, PageHeaderComponent, DatePipe],
  templateUrl: './badges.component.html',
  styleUrl: './badges.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly badgeService = inject(BadgeService);

  readonly badges = signal<BadgeResponse[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');

  readonly earnedBadges = computed(() =>
    this.badges()
      .filter(b => b.earned)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
  );

  readonly lockedBadges = computed(() =>
    this.badges()
      .filter(b => !b.earned)
      .sort((a, b) => {
        const progressA = a.conditionValue > 0 ? a.currentProgress / a.conditionValue : 0;
        const progressB = b.conditionValue > 0 ? b.currentProgress / b.conditionValue : 0;
        return progressB - progressA;
      })
  );

  readonly nextBadge = computed(() => {
    const locked = this.lockedBadges();
    return locked.length > 0 ? locked[0] : null;
  });

  ngOnInit(): void {
    this.loadBadges();
  }

  loadBadges(): void {
    const familyId = this.authService.getActiveFamilyId();
    if (!familyId) return;

    this.isLoading.set(true);
    this.error.set('');

    this.badgeService.getBadges(familyId).subscribe({
      next: (data) => {
        this.badges.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar las insignias.');
        this.isLoading.set(false);
      },
    });
  }

  getProgressPercent(badge: BadgeResponse): number {
    if (badge.conditionValue <= 0) return 0;
    return Math.min(100, (badge.currentProgress / badge.conditionValue) * 100);
  }
}
