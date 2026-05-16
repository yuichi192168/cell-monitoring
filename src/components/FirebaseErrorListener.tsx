'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/utils';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    // Utility to ensure the UI is never locked
    const unlockUI = () => {
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.body) {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
          // Also remove any stray data-attributes Radix might have left
          document.body.removeAttribute('data-scroll-locked');
        }
      }, 100);
    };

    const handleError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Action Restricted",
        description: getFriendlyErrorMessage(error),
      });

      unlockUI();

      if (process.env.NODE_ENV === 'development') {
        console.warn("Firebase Error handled by listener:", error);
      }
    };

    errorEmitter.on('permission-error', handleError);
    errorEmitter.on('auth-error', handleError);
    
    // Safety: Run cleanup periodically to catch any leaked locks from third-party libs
    const interval = setInterval(unlockUI, 5000);
    
    return () => {
      errorEmitter.off('permission-error', handleError);
      errorEmitter.off('auth-error', handleError);
      clearInterval(interval);
    };
  }, [toast]);

  return null;
}
