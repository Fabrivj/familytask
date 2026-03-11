import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class LandingHeroComponent {
  readonly ctaClicked = output<void>();
}
