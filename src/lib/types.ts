
export type UserRole = 'Admin' | 'Leader' | 'Member';

export type MemberStatus = 'Active' | 'Inactive' | 'On Leave' | 'Trial';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: MemberStatus;
  ladderOfSuccess: string[]; // Achievements
  targetToDo: string[]; // Goals/Tasks
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
