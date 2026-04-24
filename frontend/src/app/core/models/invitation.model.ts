export type InvitationRole = 'PARENT' | 'CHILD';

export interface CreateInviteRequest {
  invitedEmail: string;
  role: InvitationRole;
  familyId: number;
  isAdmin?: boolean;
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

export interface InviteDetailsResponse {
  familyName: string;
  invitedByName: string;
  role: InvitationRole;
  expirationDate: string;
}
