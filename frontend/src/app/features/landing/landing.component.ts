import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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

  onCtaClick(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
