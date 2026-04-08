export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'WEEKENDS' | 'MONTHLY';

export interface HabitResponse {
  id: number;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  xpReward: number;
  coinsReward: number;
  createdAt: string;
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToPictureUrl: string | null;
}

export interface CreateHabitRequest {
  familyId: number;
  title: string;
  description?: string | null;
  frequency: HabitFrequency;
  xpReward: number;
  coinsReward: number;
}

export interface AssignHabitRequest {
  familyId: number;
  assignedToId: number;
}
