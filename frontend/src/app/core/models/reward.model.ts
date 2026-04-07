export interface RewardResponse {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  cost: number;
  minLevel: number | null;
  familyId: number;
  createdAt: string;
}

export interface CreateRewardRequest {
  familyId: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  cost: number;
  minLevel?: number | null;
}
