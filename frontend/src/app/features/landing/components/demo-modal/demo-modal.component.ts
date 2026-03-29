import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

interface DemoSlide {
  title: string;
  desc: string;
  gif: string;
}

const SLIDES: DemoSlide[] = [
  {
    title: 'Crea tu familia',
    desc: 'Inicia sesión con Google, crea tu familia, ponle un nombre e invita a tus hijos para que se unan.',
    gif: 'demo/01-familia.gif',
  },
  {
    title: 'Organiza tu hogar',
    desc: 'En el mapa del hogar puedes crear los espacios de tu casa y asignar tareas a cada área.',
    gif: 'demo/02-mapa.gif',
  },
  {
    title: 'Tareas y hábitos',
    desc: 'Crea tareas y hábitos para tus hijos, define su importancia y cuántos puntos valen al completarlos.',
    gif: 'demo/03-tareas.gif',
  },
  {
    title: 'Gestiona tu familia',
    desc: 'En el panel de miembros puedes ver a cada integrante de la familia y gestionar sus roles.',
    gif: 'demo/04-miembros.gif',
  },
  {
    title: 'Vista del hijo',
    desc: 'Tus hijos ven sus misiones asignadas, su progreso y las recompensas que pueden solicitar.',
    gif: 'demo/05-hijo.gif',
  },
];

@Component({
  selector: 'app-landing-demo-modal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-modal.component.html',
  styleUrl: './demo-modal.component.css',
  host: {
    '(keydown.escape)': 'close()',
    '(keydown.arrowRight)': 'next()',
    '(keydown.arrowLeft)': 'prev()',
  },
})
export class DemoModalComponent {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  readonly slides = SLIDES;
  readonly current = signal(0);
  readonly imgError = signal(false);

  close(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  goTo(index: number): void {
    this.current.set(index);
    this.imgError.set(false);
  }

  next(): void {
    if (this.current() < this.slides.length - 1) {
      this.goTo(this.current() + 1);
    }
  }

  prev(): void {
    if (this.current() > 0) {
      this.goTo(this.current() - 1);
    }
  }

  onImgError(): void {
    this.imgError.set(true);
  }

  onImgLoad(): void {
    this.imgError.set(false);
  }
}
