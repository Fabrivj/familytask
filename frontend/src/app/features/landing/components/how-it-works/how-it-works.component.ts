import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-how-it-works',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css',
})
export class LandingHowItWorksComponent {}
