import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './features-section.component.html',
  styleUrl: './features-section.component.css',
})
export class LandingFeaturesComponent {}
