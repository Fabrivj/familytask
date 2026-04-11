export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: string;
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
  status: TaskStatus | null;
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

export interface UpdateTaskRequest {
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

export interface CompleteTaskResponse {
  taskId: number;
  taskTitle: string;
  assignedToName: string;
  xpReward: number;
  coinsReward: number;
  completedAt: string;
  newTotalXp: number;
  newTotalCoins: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  xpToNextLevel: number;
}
