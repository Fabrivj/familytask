export interface FamilySummary {
  familyId: number;
  familyName: string;
  role: 'PARENT' | 'CHILD';
  isAdmin?: boolean;
  memberCount?: number;
  activeTaskCount?: number;
}

export interface AuthResponse {
  userId: number;
  token: string;
  email: string;
  name: string;
  pictureUrl: string;
  families: FamilySummary[];
}

export interface UserSession {
  userId: number;
  token: string;
  email: string;
  name: string;
  pictureUrl: string;
  families: FamilySummary[];
  activeFamilyId?: number;
}
