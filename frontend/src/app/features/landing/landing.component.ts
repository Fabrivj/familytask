import { ChangeDetectionStrategy, Component, inject, NgZone, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent, throttleTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { LandingNavbarComponent } from './components/navbar/navbar.component';
import { LandingHeroComponent } from './components/hero/hero.component';
import { LandingFeaturesComponent } from './components/features-section/features-section.component';
import { LandingHowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { LandingGamificationComponent } from './components/gamification-section/gamification-section.component';
import { LandingCtaComponent } from './components/cta-section/cta-section.component';
import { LandingFooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingFeaturesComponent,
    LandingHowItWorksComponent,
    LandingGamificationComponent,
    LandingCtaComponent,
    LandingFooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly showBackToTop = signal(false);

  constructor() {
    const ngZone = inject(NgZone);
    ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll', { passive: true })
        .pipe(
          throttleTime(100, undefined, { leading: true, trailing: true }),
          takeUntilDestroyed(),
        )
        .subscribe(() => {
          this.showBackToTop.set(window.scrollY > 400);
        });
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCtaClick(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
