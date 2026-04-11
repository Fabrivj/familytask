export type RedemptionStatus = 'PENDING' | 'DELIVERED';

export interface RedemptionResponse {
  id: number;
  rewardId: number;
  rewardName: string;
  rewardIcon: string | null;
  coinsSpent: number;
  status: RedemptionStatus;
  requestedAt: string;
}

export interface RedeemRewardRequest {
  rewardId: number;
  familyId: number;
}
