export type SpaceType = 'BAÑO' | 'COCINA' | 'SALA' | 'HABITACION' | 'PATIO' | 'OTRO';

export interface SpaceResponse {
  id: number;
  name: string;
  type: SpaceType;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceRequest {
  familyId: number;
  name: string;
  type: SpaceType;
}

export interface UpdateSpaceRequest {
  familyId: number;
  name: string;
  type: SpaceType;
}

export const SPACE_TYPE_OPTIONS: { value: SpaceType; label: string; icon: string }[] = [
  { value: 'BAÑO',       label: 'Baño',       icon: 'bathtub' },
  { value: 'COCINA',     label: 'Cocina',     icon: 'kitchen' },
  { value: 'SALA',       label: 'Sala',       icon: 'weekend' },
  { value: 'HABITACION', label: 'Habitación', icon: 'bed' },
  { value: 'PATIO',      label: 'Patio',      icon: 'deck' },
  { value: 'OTRO',       label: 'Otro',       icon: 'home' },
];

export function spaceTypeLabel(type: string): string {
  return SPACE_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
}

export function spaceTypeIcon(type: string): string {
  return SPACE_TYPE_OPTIONS.find(o => o.value === type)?.icon ?? 'home';
}
