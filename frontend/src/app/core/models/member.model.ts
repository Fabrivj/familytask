export interface MemberItem {
  id: number;
  name: string;
  email: string;
  pictureUrl: string;
  role: 'PARENT' | 'CHILD';
  isAdmin: boolean;
  joinedAt: string;
  totalXp?: number;
  currentLevel?: number;
  totalCoins?: number;
  xpToNextLevel?: number;
  completedTaskCount?: number;
}

export interface PendingInvitation {
  email: string;
  role: 'PARENT' | 'CHILD';
  token: string;
  createdAt: string;
  expirationDate: string;
}

export interface FamilyMembersResponse {
  members: MemberItem[];
  pendingInvitations: PendingInvitation[];
}
