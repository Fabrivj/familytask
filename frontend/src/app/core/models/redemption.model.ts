export type RedemptionStatus = 'PENDING' | 'DELIVERED';

export interface RedemptionHistoryResponse {
  id: number;
  rewardName: string;
  rewardIcon: string | null;
  rewardCost: number;
  redeemedByUserId: number;
  redeemedByName: string;
  status: RedemptionStatus;
  redeemedAt: string;
}

export interface RedemptionHistoryParams {
  familyId: number;
  memberId?: number;
  status?: RedemptionStatus;
  dateFrom?: string;
  dateTo?: string;
}

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
