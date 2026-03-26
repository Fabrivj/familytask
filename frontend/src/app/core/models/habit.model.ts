export type HabitFrequency = 'DAILY' | 'WEEKLY';

export interface HabitResponse {
  id: number;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  xpReward: number;
  coinsReward: number;
  location: string;
  createdAt: string;
}

export interface CreateHabitRequest {
  familyId: number;
  title: string;
  description?: string | null;
  frequency: HabitFrequency;
  xpReward: number;
  coinsReward: number;
  location: string;
}
