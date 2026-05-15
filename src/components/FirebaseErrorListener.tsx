'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/utils';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // Show friendly toast for the user
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: getFriendlyErrorMessage(error),
      });

      // In development, this will trigger the Next.js error overlay with technical details
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
