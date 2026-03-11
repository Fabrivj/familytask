import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-section.component.html',
  styleUrl: './cta-section.component.css',
})
export class LandingCtaComponent {
  readonly ctaClicked = output<void>();
}
