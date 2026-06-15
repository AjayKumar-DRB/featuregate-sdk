'use client';

import { useFeatureContext } from './FeatureProvider';

/**
 * Returns true if the given feature flag key is enabled for the current context.
 */
export function useFeatureFlag(key: string): boolean {
  const { flags } = useFeatureContext();
  return !!flags[key];
}
