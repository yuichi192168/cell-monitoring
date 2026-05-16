'use client';

import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setError(null);

    // Metadata changes enabled to track cache vs server source
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true },
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData(docs as any);
        setLoading(false);
      },
      (err) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._query?.path?.toString() || 'unknown',
            operation: 'list',
          });
          setError(permissionError);
        } else if (err.code === 'unavailable') {
          // Expected behavior when offline, handled by persistence
          console.log("Firestore temporarily offline. Using cached snapshot.");
        } else {
          console.error("Firestore useCollection error:", err);
          setError(err);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
