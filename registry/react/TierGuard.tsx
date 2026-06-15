'use client';

import React from 'react';
import { useFeatureContext } from './FeatureProvider';

export interface TierGuardProps {
  /**
   * The tier or tiers that are permitted to see the children.
   * Pass a single string (e.g. 'pro') or an array (e.g. ['pro', 'enterprise']).
   */
  requiredTier: string | string[];
  /** Content rendered when the active tier satisfies the requirement. */
  children: React.ReactNode;
  /** Optional content rendered when the tier requirement is NOT met. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * TierGuard conditionally renders its children based on the active
 * organization tier provided by the nearest FeatureProvider.
 *
 * @example
 * <TierGuard requiredTier={['pro', 'enterprise']} fallback={<UpgradeBanner />}>
 *   <AdvancedAnalytics />
 * </TierGuard>
 */
export function TierGuard({ requiredTier, children, fallback = null }: TierGuardProps) {
  const { context } = useFeatureContext();

  const activeTier = context?.tier;

  const allowed = activeTier && (Array.isArray(requiredTier)
    ? requiredTier.includes(activeTier)
    : activeTier === requiredTier);

  return <>{allowed ? children : fallback}</>;
}
