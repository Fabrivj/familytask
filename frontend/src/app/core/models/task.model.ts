export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  homeSpaceId: number;
  homeSpaceName: string;
  homeSpaceType: string;
  xpReward: number;
  coinsReward: number;
  dueDate: string | null;
  createdAt: string;
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToPictureUrl: string | null;
}

export interface CreateTaskRequest {
  familyId: number;
  homeSpaceId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  xpReward: number;
  coinsReward: number;
  dueDate?: string | null;
  assignedToId?: number | null;
}
