'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/utils';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // Show friendly toast for the user instead of a full-screen crash
      toast({
        variant: "destructive",
        title: "Action Restricted",
        description: getFriendlyErrorMessage(error),
      });

      // SAFETY FIX: If an error occurs during a dialog transition, 
      // Radix UI sometimes leaves the body scroll or pointer events locked.
      // This ensures the app remains interactive.
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.body) {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
        }
      }, 300);

      // Log the error for development debugging without freezing the UI thread
      if (process.env.NODE_ENV === 'development') {
        console.error("Firebase Error handled by listener:", error);
      }
    };

    errorEmitter.on('permission-error', handleError);
    errorEmitter.on('auth-error', handleError);
    
    return () => {
      errorEmitter.off('permission-error', handleError);
      errorEmitter.off('auth-error', handleError);
    };
  }, [toast]);

  return null;
}
