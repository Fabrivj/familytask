import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MemberItem } from '@core/models/member.model';

/**
 * Displays a child member's gamification stats:
 * current level, XP progress bar, and total coins.
 *
 * Usage:
 *   <app-child-stats [member]="memberItem" />
 */
@Component({
  selector: 'app-child-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-card">
      <div class="level-badge">
        <span class="level-label">NIVEL</span>
        <span class="level-number">{{ member().currentLevel ?? 0 }}</span>
      </div>

      <div class="progress-section">
        <div class="xp-row">
          <span class="xp-label">XP</span>
          <span class="xp-values">{{ xpInLevel() }} / {{ xpNeededInLevel() }}</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" [style.width.%]="progressPercent()"></div>
        </div>
        <span class="xp-next">{{ member().xpToNextLevel ?? 0 }} XP para el siguiente nivel</span>
      </div>

      <div class="coins-section">
        <span class="coins-icon">◈</span>
        <span class="coins-value">{{ member().totalCoins ?? 0 }}</span>
        <span class="coins-label">monedas</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--panel);
      border: 1.5px solid rgba(var(--border-rgb), 0.18);
      border-radius: 14px;
      padding: 16px 20px;
      flex-wrap: wrap;
    }

    /* ── LEVEL BADGE ── */
    .level-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 52px;
    }

    .level-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.15em;
      color: var(--text-sub);
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .level-number {
      font-family: 'Rajdhani', sans-serif;
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      color: var(--primary);
    }

    /* ── XP PROGRESS ── */
    .progress-section {
      flex: 1;
      min-width: 140px;
    }

    .xp-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .xp-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--text-sub);
      text-transform: uppercase;
    }

    .xp-values {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-sub);
    }

    .xp-bar-track {
      height: 6px;
      border-radius: 3px;
      background: rgba(var(--border-rgb), 0.15);
      overflow: hidden;
    }

    .xp-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--primary);
      transition: width 0.4s ease;
      min-width: 2px;
    }

    .xp-next {
      display: block;
      font-size: 10px;
      color: var(--text-sub);
      margin-top: 5px;
      opacity: 0.7;
    }

    /* ── COINS ── */
    .coins-section {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .coins-icon {
      font-size: 16px;
      color: var(--primary);
      line-height: 1;
    }

    .coins-value {
      font-family: 'Rajdhani', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
    }

    .coins-label {
      font-size: 11px;
      color: var(--text-sub);
      align-self: flex-end;
      padding-bottom: 2px;
    }

    @media (max-width: 480px) {
      .stats-card {
        gap: 14px;
        padding: 14px 16px;
      }
      .level-number { font-size: 30px; }
      .coins-value { font-size: 18px; }
    }
  `],
})
export class ChildStatsComponent {
  readonly member = input.required<MemberItem>();

  /** XP needed to go from current level start to next level (= 100 * (currentLevel + 1)). */
  readonly xpNeededInLevel = computed(() => 100 * ((this.member().currentLevel ?? 0) + 1));

  /** XP earned within the current level. */
  readonly xpInLevel = computed(() =>
    this.xpNeededInLevel() - (this.member().xpToNextLevel ?? 0)
  );

  /** Progress percentage (0–100) for the XP bar. */
  readonly progressPercent = computed(() =>
    Math.min(100, Math.max(0, (this.xpInLevel() / this.xpNeededInLevel()) * 100))
  );
}
