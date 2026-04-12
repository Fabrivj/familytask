export interface BadgeResponse {
  id: number;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  currentProgress: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface EarnedBadge {
  id: number;
  name: string;
  icon: string;
}
