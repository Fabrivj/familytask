import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-section.component.html',
  styleUrl: './cta-section.component.css',
})
export class LandingCtaComponent {
  readonly ctaClicked = output<void>();
}
