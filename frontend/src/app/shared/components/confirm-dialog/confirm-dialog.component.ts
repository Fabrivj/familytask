import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  effect,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onCancel()',
  },
  template: `
    @if (open()) {
      <div class="backdrop" (click)="onCancel()"></div>
      <div class="dialog" role="alertdialog" aria-modal="true"
        aria-labelledby="confirm-title" aria-describedby="confirm-msg">
        <h2 id="confirm-title" class="title">{{ title() }}</h2>
        <p id="confirm-msg" class="message">{{ message() }}</p>
        <div class="actions">
          <button class="btn-cancel" type="button" #cancelBtn (click)="onCancel()">
            {{ cancelLabel() }}
          </button>
          <button class="btn-confirm" type="button" (click)="onConfirm()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 200;
      animation: fadeIn 0.15s ease;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 201;
      width: 90vw;
      max-width: 420px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px 28px 22px;
      box-shadow: 0 0 40px rgba(var(--border-rgb), 0.15),
                  0 8px 32px rgba(0, 0, 0, 0.5);
      animation: scaleIn 0.18s ease;
    }

    .title {
      margin: 0 0 10px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .message {
      margin: 0 0 24px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-sub);
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-confirm {
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 8px 22px;
      border-radius: var(--radius);
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }

    .btn-cancel {
      background: transparent;
      border: 1.5px solid var(--primary);
      color: var(--primary);
    }

    .btn-cancel:hover {
      background: rgba(var(--primary-rgb), 0.08);
    }

    .btn-confirm {
      background: var(--primary);
      border: 1.5px solid var(--primary);
      color: #fff;
      box-shadow: 0 4px 18px rgba(var(--primary-rgb), 0.35);
    }

    .btn-confirm:hover {
      box-shadow: 0 4px 24px rgba(var(--primary-rgb), 0.55);
    }

    .btn-cancel:focus-visible,
    .btn-confirm:focus-visible {
      outline: 2px solid var(--border);
      outline-offset: 2px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  `],
})
export class ConfirmDialogComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirmar');
  readonly cancelLabel = input<string>('Cancelar');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  constructor() {
    effect(() => {
      if (this.open()) {
        setTimeout(() => this.cancelBtn()?.nativeElement.focus());
      }
    });
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    if (this.open()) {
      this.cancelled.emit();
    }
  }
}
