import { Member, AppStats } from './types';

export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'Member',
    status: 'Active',
    ladderOfSuccess: ['Win', 'Consolidate'],
    targetToDo: ['Finish Bible Study Module 1', 'Invite 1 Friend'],
    assignedLeaderId: 'leader-1',
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    role: 'Member',
    status: 'Active',
    ladderOfSuccess: ['Win'],
    targetToDo: ['Register for Foundation Class'],
    assignedLeaderId: 'leader-1',
    createdAt: '2024-03-05',
  },
  {
    id: '3',
    name: 'Marcus Thorne',
    email: 'marcus@example.com',
    role: 'Leader',
    status: 'Active',
    ladderOfSuccess: ['Win', 'Consolidate', 'Discipleship', 'SOL'],
    targetToDo: ['Weekly report submission'],
    createdAt: '2023-11-20',
  }
];

export const MOCK_STATS: AppStats = {
  totalUsers: 1450,
  totalCellMembers: 128,
  growthRate: 12.5,
  activeSessions: 84
};
