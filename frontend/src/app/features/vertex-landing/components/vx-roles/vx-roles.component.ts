import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Role {
  name: string;
  role: string;
  team: string;
  responsibilities: string;
}

@Component({
  selector: 'vx-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vx-section">
      <div class="vx-section-inner">
        <div class="vx-section-head">
          <span class="vx-eyebrow">RESPONSABILIDADES</span>
          <h2 class="vx-heading">
            Roles & <span class="vx-accent">funciones</span>
          </h2>
        </div>

        <div class="vx-table-wrap">
          <table class="vx-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Equipo</th>
                <th>Responsabilidades</th>
              </tr>
            </thead>
            <tbody>
              @for (r of roles; track r.name) {
                <tr>
                  <td data-label="Nombre">{{ r.name }}</td>
                  <td data-label="Rol"><span class="vx-badge">{{ r.role }}</span></td>
                  <td data-label="Equipo">{{ r.team }}</td>
                  <td data-label="Responsabilidades" class="vx-resp">{{ r.responsibilities }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .vx-section { padding: 80px 0; border-top: 1px solid var(--vx-border); }
    .vx-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .vx-section-head { margin-bottom: 40px; }
    .vx-eyebrow {
      display: inline-block; color: var(--vx-accent-2);
      font-size: 11px; font-weight: 600; letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .vx-heading {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 800; line-height: 1.1; margin: 0;
      letter-spacing: -0.02em;
    }
    .vx-accent { color: var(--vx-accent-2); }

    .vx-table-wrap {
      border: 1px solid var(--vx-border);
      border-radius: 12px;
      overflow: hidden;
      background: var(--vx-surface);
    }
    .vx-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .vx-table thead {
      background: var(--vx-surface-2);
    }
    .vx-table th {
      text-align: left;
      padding: 16px 20px;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--vx-text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--vx-border);
    }
    .vx-table td {
      padding: 18px 20px;
      color: var(--vx-text-dim);
      border-bottom: 1px solid var(--vx-border);
      vertical-align: top;
    }
    .vx-table tbody tr:last-child td { border-bottom: none; }
    .vx-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .vx-table td:first-child { color: var(--vx-text); font-weight: 500; }
    .vx-badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 9px; letter-spacing: 2px; font-weight: 600;
      text-transform: uppercase;
      background: rgba(0, 72, 255, 0.12);
      border: 1px solid rgba(0, 72, 255, 0.3);
      color: var(--vx-accent-2);
      border-radius: 4px;
      white-space: nowrap;
    }
    .vx-resp { line-height: 1.6; }

    @media (max-width: 768px) {
      .vx-table thead { display: none; }
      .vx-table, .vx-table tbody, .vx-table tr, .vx-table td { display: block; width: 100%; }
      .vx-table tr {
        padding: 16px;
        border-bottom: 1px solid var(--vx-border);
      }
      .vx-table tbody tr:last-child { border-bottom: none; }
      .vx-table td {
        padding: 8px 0;
        border: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .vx-table td::before {
        content: attr(data-label);
        font-size: 9px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--vx-text-muted);
        font-weight: 600;
      }
    }
  `],
})
export class VxRolesComponent {
  readonly roles: Role[] = [
    {
      name: 'Katherine Segura G\u00f3mez',
      role: 'General Lead',
      team: 'Vertex Dev',
      responsibilities: 'Gesti\u00f3n de proyecto, planificaci\u00f3n de sprints, control de cronograma y alcance, minutas y seguimiento de entregables.',
    },
    {
      name: 'Luis Diego Hidalgo Ag\u00fcero',
      role: 'Dev Lead',
      team: 'Vertex Dev',
      responsibilities: 'Arquitectura del sistema, est\u00e1ndares de c\u00f3digo, code reviews y decisiones t\u00e9cnicas sobre rendimiento, seguridad y escalabilidad.',
    },
    {
      name: 'Fabricio Vargas Jim\u00e9nez',
      role: 'Dev Lead',
      team: 'Vertex Dev',
      responsibilities: 'Investigaci\u00f3n de tecnolog\u00edas, APIs y frameworks; mentor\u00eda t\u00e9cnica y apoyo en decisiones de arquitectura y revisi\u00f3n de c\u00f3digo.',
    },
    {
      name: 'Antonio Mora Blotta',
      role: 'QA Lead',
      team: 'Vertex Dev',
      responsibilities: 'Estrategia de testing (manual, unitario y rendimiento), gesti\u00f3n de defectos, mantenimiento QA y cobertura de pruebas en cada sprint.',
    },
    {
      name: 'Jos\u00e9 Andr\u00e9s Picado Corrales',
      role: 'Support Lead',
      team: 'Vertex Dev',
      responsibilities: 'Administraci\u00f3n de repositorios, branching strategy, configuraci\u00f3n del pipeline CI/CD y gesti\u00f3n de merges a ramas principales.',
    },
  ];
}
