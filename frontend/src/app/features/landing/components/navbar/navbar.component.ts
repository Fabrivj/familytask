import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LandingNavbarComponent {
  readonly ctaClicked = output<void>();

  private readonly elementRef = inject(ElementRef);
  private readonly scroller = inject(ViewportScroller);

  readonly mobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  scrollTo(sectionId: string): void {
    this.mobileMenuOpen.set(false);
    this.scroller.scrollToAnchor(sectionId);
  }

  onCta(): void {
    this.mobileMenuOpen.set(false);
    this.ctaClicked.emit();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mobileMenuOpen.set(false);
    }
  }
}
