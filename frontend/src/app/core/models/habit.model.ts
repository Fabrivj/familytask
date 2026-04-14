import { EarnedBadge } from './badge.model';

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
  currentStreak: number | null;
  longestStreak: number | null;
  completedInCurrentPeriod: boolean | null;
}

export interface CompleteHabitResponse {
  habitId: number;
  habitTitle: string;
  assignedToName: string;
  xpReward: number;
  coinsReward: number;
  currentStreak: number;
  longestStreak: number;
  completionDate: string;
  streakMultiplier: number;
  xpActuallyAwarded: number;
  coinsActuallyAwarded: number;
  newTotalXp: number;
  newTotalCoins: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  xpToNextLevel: number;
  earnedBadges: EarnedBadge[];
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
