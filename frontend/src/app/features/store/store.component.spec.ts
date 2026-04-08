import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StoreComponent } from './store.component';
import { RewardService } from '../../core/services/reward.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { RewardResponse } from '../../core/models/reward.model';

const mockReward: RewardResponse = {
  id: 1,
  name: 'Pizza',
  description: 'Buena pizza',
  icon: 'local_pizza',
  cost: 100,
  minLevel: 3,
  approvalRule: 'AUTOMATIC',
  familyId: 10,
  createdAt: '2026-01-01T00:00:00',
};

describe('StoreComponent — edit flow', () => {
  let component: StoreComponent;
  let rewardService: jasmine.SpyObj<RewardService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    rewardService = jasmine.createSpyObj('RewardService', ['getRewards', 'create', 'update', 'delete']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    rewardService.getRewards.and.returnValue(of([mockReward]));

    await TestBed.configureTestingModule({
      imports: [StoreComponent],
      providers: [
        { provide: RewardService, useValue: rewardService },
        { provide: AuthService, useValue: { activeFamily: () => ({ familyId: 10 }) } },
        { provide: PermissionsService, useValue: { isParent: () => true } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StoreComponent);
    component = fixture.componentInstance;
  });

  it('openEditPanel pre-populates all form fields and sets editingReward', () => {
    component.openEditPanel(mockReward);

    expect(component.editingReward()).toEqual(mockReward);
    expect(component.nameCtrl.value).toBe('Pizza');
    expect(component.descriptionCtrl.value).toBe('Buena pizza');
    expect(component.costCtrl.value).toBe(100);
    expect(component.minLevelCtrl.value).toBe(3);
    expect(component.selectedApprovalRule()).toBe('AUTOMATIC');
    expect(component.showCreatePanel()).toBeTrue();
  });

  it('submitCreate in edit mode calls rewardService.update with all fields', fakeAsync(() => {
    rewardService.update.and.returnValue(of({ ...mockReward, name: 'Nueva Pizza' }));
    component.openEditPanel(mockReward);
    component.nameCtrl.setValue('Nueva Pizza');

    component.submitCreate();
    tick();

    expect(rewardService.update).toHaveBeenCalledWith(1, jasmine.objectContaining({
      name: 'Nueva Pizza',
      cost: 100,
      approvalRule: 'AUTOMATIC',
    }));
    expect(rewardService.create).not.toHaveBeenCalled();
  }));

  it('shows "Recompensa actualizada exitosamente." snackbar on success', fakeAsync(() => {
    rewardService.update.and.returnValue(of({ ...mockReward }));
    component.openEditPanel(mockReward);
    component.submitCreate();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Recompensa actualizada exitosamente.', 'Cerrar', jasmine.any(Object)
    );
  }));

  it('shows error when name cleared in edit mode', () => {
    component.openEditPanel(mockReward);
    component.nameCtrl.setValue('');

    component.submitCreate();

    expect(component.nameCtrl.hasError('required')).toBeTrue();
    expect(rewardService.update).not.toHaveBeenCalled();
  });

  it('shows error when cost is 0 in edit mode', () => {
    component.openEditPanel(mockReward);
    component.costCtrl.setValue(0);

    component.submitCreate();

    expect(component.costCtrl.hasError('min')).toBeTrue();
    expect(rewardService.update).not.toHaveBeenCalled();
  });

  it('shows general error from service on update failure', fakeAsync(() => {
    rewardService.update.and.returnValue(throwError(() => ({
      error: { message: 'No se pudo completar la operación. Intenta de nuevo.' },
    })));
    component.openEditPanel(mockReward);
    component.submitCreate();
    tick();

    expect(component.createError()).toBe('No se pudo completar la operación. Intenta de nuevo.');
  }));
});
