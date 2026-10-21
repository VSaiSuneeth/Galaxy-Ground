// Fallback interests used when no topics are available from useTopics().
// Topics are the preferred interest source because they are user-facing
// space-education content curated for the app. When the Supabase topics
// table exists, useTopics() returns live records; otherwise it returns
// FALLBACK_TOPICS (src/lib/topics.ts). DEFAULT_INTERESTS is only reached
// if that fallback array is empty, which should not happen in practice.
import { normalizeInterests } from "@/lib/safe-data";

export const DEFAULT_INTERESTS = ["AI", "Space travel", "Deep tech", "Community", "Science"];

const NEW_USER_MS = 60_000;

export interface OnboardingProfileLike {
  interests?: unknown;
}

export function isNewUser(userCreatedAt?: string | null): boolean {
  if (!userCreatedAt) return false;
  const elapsed = Date.now() - new Date(userCreatedAt).getTime();
  return elapsed >= 0 && elapsed < NEW_USER_MS;
}

export function shouldPromptOnboarding(
  profile?: OnboardingProfileLike | null,
  userCreatedAt?: string | null,
  sessionCompleted = false,
): boolean {
  if (sessionCompleted) return false;
  if (!isNewUser(userCreatedAt)) return false;
  // If interests were already saved, onboarding was already completed.
  // This prevents the modal from reopening on page refresh after the user
  // saved their interests but is still within the 60-second new-user window.
  if (profile?.interests && normalizeInterests(profile.interests).length > 0) return false;
  return true;
}

const STORAGE_PREFIX = "galaxy-ground:onboarding";

function getOnboardingStorageKey(userId?: string | null) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : `${STORAGE_PREFIX}:guest`;
}

export function writeOnboardingStatus(userId: string | null | undefined, completed = false) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getOnboardingStorageKey(userId), completed ? "complete" : "pending");
}
