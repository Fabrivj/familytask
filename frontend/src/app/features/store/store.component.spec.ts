import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StoreComponent } from './store.component';
import { RewardService } from '@core/services/reward.service';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RedemptionService } from '@core/services/redemption.service';
import { RedemptionHistoryService } from '@core/services/redemption-history.service';
import { MembersService } from '@core/services/members.service';
import { of, throwError } from 'rxjs';
import { RewardResponse } from '@core/models/reward.model';

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
  pendingCount: 0,
  isEnabled: true,
};

describe('StoreComponent â€” edit flow', () => {
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
        provideRouter([]),
        { provide: RewardService, useValue: rewardService },
        { provide: AuthService, useValue: { activeFamily: () => ({ familyId: 10 }) } },
        { provide: PermissionsService, useValue: { isParent: () => true } },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: RedemptionService, useValue: { requestRedemption: vi.fn() } },
        { provide: RedemptionHistoryService, useValue: { getHistory: vi.fn().mockReturnValue(of([])) } },
        { provide: MembersService, useValue: { getMembers: vi.fn().mockReturnValue(of({ members: [] })), getMyStats: vi.fn() } },
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
      error: { message: 'No se pudo completar la operaciÃ³n. Intenta de nuevo.' },
    })));
    component.openEditPanel(mockReward);
    component.submitCreate();

    expect(component.createError()).toBe('No se pudo completar la operaciÃ³n. Intenta de nuevo.');
  });

  it('submitCreate in create mode calls rewardService.create, not update', () => {
    rewardService.create.mockReturnValue(of({ ...mockReward, id: 2 }));
    component.openCreatePanel();
    component.nameCtrl.setValue('Nueva Recompensa');
    component.costCtrl.setValue(50);

    component.submitCreate();

    expect(rewardService.create).toHaveBeenCalled();
    expect(rewardService.update).not.toHaveBeenCalled();
  });

  it('update request does not include approvalRule field', () => {
    rewardService.update.mockReturnValue(of(mockReward));
    component.openEditPanel(mockReward);

    component.submitCreate();

    const payload = rewardService.update.mock.calls[0][1];
    expect(payload).not.toHaveProperty('approvalRule');
  });

  it('openDeleteModal sets rewardToDelete and shows modal', () => {
    component.openDeleteModal(mockReward);

    expect(component.rewardToDelete()).toEqual(mockReward);
    expect(component.showDeleteModal()).toBe(true);
  });

  it('closeDeleteModal resets rewardToDelete and hides modal', () => {
    component.openDeleteModal(mockReward);

    component.closeDeleteModal();

    expect(component.rewardToDelete()).toBeNull();
    expect(component.showDeleteModal()).toBe(false);
  });

  it('confirmDelete removes reward from list and shows success snackbar', () => {
    rewardService.delete.mockReturnValue(of({ message: 'Recompensa eliminada correctamente.' }));
    component.rewards.set([mockReward]);
    component.openDeleteModal(mockReward);

    component.confirmDelete();

    expect(rewardService.delete).toHaveBeenCalledWith(1);
    expect(component.rewards().find(r => r.id === mockReward.id)).toBeUndefined();
    expect(component.showDeleteModal()).toBe(false);
    expect(component.rewardToDelete()).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Recompensa eliminada exitosamente.', 'Cerrar', expect.any(Object)
    );
  });

  it('confirmDelete closes modal and shows error message on service failure', () => {
    rewardService.delete.mockReturnValue(throwError(() => ({
      error: { message: 'No se pudo completar la operaciÃ³n. Intenta de nuevo.' },
    })));
    component.openDeleteModal(mockReward);

    component.confirmDelete();

    expect(component.showDeleteModal()).toBe(false);
    expect(component.rewardToDelete()).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith(
      'No se pudo completar la operaciÃ³n. Intenta de nuevo.', 'Cerrar', expect.any(Object)
    );
  });

  it('closeCreatePanel clears editingReward and createError after a failed update', () => {
    rewardService.update.mockReturnValue(throwError(() => ({
      error: { message: 'Error' },
    })));
    component.openEditPanel(mockReward);
    component.submitCreate();

    component.closeCreatePanel();

    expect(component.editingReward()).toBeNull();
    expect(component.createError()).toBe('');
    expect(component.showCreatePanel()).toBe(false);
  });
});
