import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-gamification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gamification-section.component.html',
  styleUrl: './gamification-section.component.css',
})
export class LandingGamificationComponent {}
