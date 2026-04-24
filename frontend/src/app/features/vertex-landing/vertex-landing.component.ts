import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VxNavbarComponent } from './components/vx-navbar/vx-navbar.component';
import { VxHeroComponent } from './components/vx-hero/vx-hero.component';
import { VxCapabilitiesComponent } from './components/vx-capabilities/vx-capabilities.component';
import { VxTeamComponent } from './components/vx-team/vx-team.component';
import { VxIdentityComponent } from './components/vx-identity/vx-identity.component';
import { VxRolesComponent } from './components/vx-roles/vx-roles.component';
import { VxFooterComponent } from './components/vx-footer/vx-footer.component';

@Component({
  selector: 'app-vertex-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VxNavbarComponent,
    VxHeroComponent,
    VxCapabilitiesComponent,
    VxTeamComponent,
    VxIdentityComponent,
    VxRolesComponent,
    VxFooterComponent,
  ],
  templateUrl: './vertex-landing.component.html',
  styleUrl: './vertex-landing.component.css',
})
export class VertexLandingComponent {}
