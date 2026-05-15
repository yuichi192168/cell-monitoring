
export type UserRole = 'Admin' | 'Leader' | 'Member';

export type MemberStatus = 'Active' | 'Inactive';

export const SOL_STAGES = ['Win', 'Consolidate', 'Discipleship', 'SOL'] as const;
export type SOLStage = (typeof SOL_STAGES)[number];

export interface Member {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: UserRole;
  status: MemberStatus;
  ladderOfSuccess: string[];
  targetToDo: string[];
  remarks?: string;
  assignedLeaderId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: UserRole;
  status?: MemberStatus;
  createdAt?: string;
}

export interface AppStats {
  totalUsers: number;
  totalCellMembers: number;
  growthRate: number;
  activeSessions: number;
}
