import { TestBed } from '@angular/core/testing';
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
  approvalRule: 'MANUAL',
  familyId: 10,
  createdAt: '2026-01-01T00:00:00',
};

describe('StoreComponent — edit flow', () => {
  let component: StoreComponent;
  let rewardService: {
    getRewards: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    rewardService = {
      getRewards: vi.fn().mockReturnValue(of([mockReward])),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    snackBar = { open: vi.fn() };

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
    expect(component.showCreatePanel()).toBe(true);
  });

  it('submitCreate in edit mode calls rewardService.update with all fields', () => {
    rewardService.update.mockReturnValue(of({ ...mockReward, name: 'Nueva Pizza' }));
    component.openEditPanel(mockReward);
    component.nameCtrl.setValue('Nueva Pizza');

    component.submitCreate();

    expect(rewardService.update).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Nueva Pizza',
      cost: 100,
    }));
    expect(rewardService.create).not.toHaveBeenCalled();
  });

  it('shows "Recompensa actualizada exitosamente." snackbar on success', () => {
    rewardService.update.mockReturnValue(of({ ...mockReward }));
    component.openEditPanel(mockReward);
    component.submitCreate();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Recompensa actualizada exitosamente.', 'Cerrar', expect.any(Object)
    );
  });

  it('shows error when name cleared in edit mode', () => {
    component.openEditPanel(mockReward);
    component.nameCtrl.setValue('');

    component.submitCreate();

    expect(component.nameCtrl.hasError('required')).toBe(true);
    expect(rewardService.update).not.toHaveBeenCalled();
  });

  it('shows error when cost is 0 in edit mode', () => {
    component.openEditPanel(mockReward);
    component.costCtrl.setValue(0);

    component.submitCreate();

    expect(component.costCtrl.hasError('min')).toBe(true);
    expect(rewardService.update).not.toHaveBeenCalled();
  });

  it('shows general error from service on update failure', () => {
    rewardService.update.mockReturnValue(throwError(() => ({
      error: { message: 'No se pudo completar la operación. Intenta de nuevo.' },
    })));
    component.openEditPanel(mockReward);
    component.submitCreate();

    expect(component.createError()).toBe('No se pudo completar la operación. Intenta de nuevo.');
  });
});
