export interface CreateInviteRequest {
  invitedEmail: string;
  role: 'PARENT' | 'CHILD';
  familyId: number;
}

export interface InviteResponse {
  invitedEmail: string;
  role: string;
  expirationDate: string;
  inviteLink: string;
}

export interface ProcessInviteRequest {
  token: string;
}
