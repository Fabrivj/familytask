export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  location: string;
  xpReward: number;
  coinsReward: number;
  dueDate: string | null;
  createdAt: string;
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToPictureUrl: string | null;
}

export interface MemberItemResponse {
  id: number;
  name: string;
  email: string;
  pictureUrl: string;
  role: string;
  joinedAt: string;
}

export interface FamilyMembersResponse {
  members: MemberItemResponse[];
  pendingInvitations: unknown[];
}

export interface CreateTaskRequest {
  familyId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  xpReward: number;
  coinsReward: number;
  location: string;
  dueDate?: string | null;
  assignedToId?: number | null;
}
