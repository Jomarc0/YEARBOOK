import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Checks if the current viewer is subscribed.
 * Source of truth is always the API response (student.is_subscribed_viewer).
 * This hook is a fallback for when you don't have the API value yet.
 */
export function useSubscriptionGuard() {
  const { user } = useAuth();
  const isSubscribed = Boolean(user?.is_premium);
  return { isSubscribed, isFree: !isSubscribed };
}