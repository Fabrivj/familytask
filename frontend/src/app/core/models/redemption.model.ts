export type RedemptionStatus = 'PENDING' | 'DELIVERED';

export interface RedemptionHistoryResponse {
  id: number;
  rewardName: string;
  rewardIcon: string | null;
  rewardCost: number;
  redeemedByUserId: number;
  redeemedByName: string;
  status: RedemptionStatus;
  redeemedAt: string; // ISO 8601 LocalDateTime from backend
}

export interface RedemptionHistoryParams {
  familyId: number;
  memberId?: number;
  status?: RedemptionStatus;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
}
