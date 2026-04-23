export type ApprovalRule = 'AUTOMATIC' | 'MANUAL';

export interface RewardResponse {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  cost: number;
  minLevel: number | null;
  approvalRule: ApprovalRule;
  familyId: number;
  createdAt: string;
  pendingCount: number;
  isEnabled: boolean;
}

export interface CreateRewardRequest {
  familyId: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  cost: number;
  minLevel?: number | null;
}

export interface UpdateRewardRequest {
  name: string;
  description: string | null;
  icon: string | null;
  cost: number;
  minLevel: number | null;
  isEnabled?: boolean;
}
