import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DemoModalComponent } from '../demo-modal/demo-modal.component';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [MatIconModule, DemoModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class LandingHeroComponent {
  readonly ctaClicked = output<void>();

  readonly demoOpen = signal(false);
}
