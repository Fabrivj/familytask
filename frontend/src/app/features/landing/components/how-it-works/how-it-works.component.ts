import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-how-it-works',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css',
})
export class LandingHowItWorksComponent {}
