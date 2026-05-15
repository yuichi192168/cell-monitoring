export type UserRole = 'Admin' | 'Leader' | 'Member';

export type MemberStatus = 'Active' | 'Inactive' | 'On Leave' | 'Trial';

export const SOL_STAGES = ['Win', 'Consolidate', 'Discipleship'] as const;
export type SOLStage = (typeof SOL_STAGES)[number];

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: MemberStatus;
  ladderOfSuccess: string[]; // SOL Stages achieved
  targetToDo: string[]; // Goals/Tasks
  remarks?: string;
  assignedLeaderId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AppStats {
  totalUsers: number;
  totalCellMembers: number;
  growthRate: number;
  activeSessions: number;
}
