import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps technical error codes and messages to user-friendly text.
 */
export function getFriendlyErrorMessage(error: any): string {
  const message = error?.message || String(error);
  const code = error?.code || '';

  if (code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
    return "The email or password you entered is incorrect. Please try again.";
  }
  if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
    return "We couldn't find an account with that email.";
  }
  if (code === 'auth/email-already-in-use' || message.includes('auth/email-already-in-use')) {
    return "This email is already registered. Try signing in instead.";
  }
  if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
    return "Your password is too weak. Please use at least 6 characters.";
  }
  if (code === 'auth/wrong-password' || message.includes('auth/wrong-password')) {
    return "The password you entered is incorrect.";
  }
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return "Access Denied: You don't have the required permissions for this action. Contact your Primary Leader for help.";
  }
  if (message.includes('network-request-failed')) {
    return "Connection Error: Please check your internet connection and try again.";
  }

  return "Something went wrong. Please try again later or reach out to your leader.";
}
