import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class LandingNavbarComponent {
  readonly ctaClicked = output<void>();

  private elementRef = inject(ElementRef);
  private scroller = inject(ViewportScroller);

  mobileMenuOpen = signal(false);

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mobileMenuOpen.set(false);
    }
  }
}
