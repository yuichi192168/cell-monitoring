
'use client';

import { collection, addDoc, Firestore } from 'firebase/firestore';
import { ActivityLog } from '@/lib/types';

export function recordActivityLog(
  db: Firestore,
  log: Omit<ActivityLog, 'id' | 'timestamp'>
) {
  const logsRef = collection(db, 'activityLogs');
  const fullLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  addDoc(logsRef, fullLog).catch((err) => {
    console.error('Failed to record activity log:', err);
  });
}
