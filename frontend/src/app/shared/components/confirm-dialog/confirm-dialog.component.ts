import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  effect,
  viewChild,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [A11yModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onCancel()',
  },
  template: `
    @if (open()) {
      <div class="backdrop" (click)="onCancel()"></div>
      <div class="dialog" role="alertdialog" aria-modal="true"
        aria-labelledby="confirm-title" aria-describedby="confirm-msg"
        cdkTrapFocus>
        @if (variant() === 'danger') {
          <mat-icon class="warning-icon" aria-hidden="true">warning</mat-icon>
        }
        <h2 id="confirm-title" class="title">{{ title() }}</h2>
        <p id="confirm-msg" class="message">{{ message() }}</p>
        @if (subMessage()) {
          <p class="sub-message">{{ subMessage() }}</p>
        }
        <div class="actions">
          <button class="btn-cancel" type="button" #cancelBtn (click)="onCancel()">
            {{ cancelLabel() }}
          </button>
          <button class="btn-confirm" [class.btn-danger]="variant() === 'danger'" type="button" (click)="onConfirm()">
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
      overflow-wrap: break-word;
      word-break: break-word;
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

    .warning-icon {
      display: block;
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #f5c542;
      margin: 0 auto 14px;
    }

    .sub-message {
      margin: -16px 0 24px;
      font-family: 'Nunito', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-sub);
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

    .btn-danger {
      background: #e53935;
      border-color: #e53935;
      box-shadow: 0 4px 18px rgba(229, 57, 53, 0.35);
    }

    .btn-danger:hover {
      box-shadow: 0 4px 24px rgba(229, 57, 53, 0.55);
    }

    .btn-cancel:focus-visible,
    .btn-confirm:focus-visible {
      outline: 2px solid var(--border);
      outline-offset: 2px;
    }

    @media (max-width: 767px) {
      .dialog {
        padding: 24px 20px 18px;
        width: calc(100vw - 32px);
      }

      .actions {
        flex-direction: column-reverse;
        gap: 8px;
      }

      .btn-cancel,
      .btn-confirm {
        width: 100%;
        padding: 13px;
        font-size: 14px;
        text-align: center;
      }
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
  readonly subMessage = input<string>('');
  readonly variant = input<'default' | 'danger'>('default');
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
