/**
 * EvaluationContext carries the identity and metadata used to evaluate
 * feature flags for a given subject (tenant or user).
 */
export interface EvaluationContext {
  /** A unique identifier for the subject — either a tenantId or a userId. */
  id: string;

  /** The organization's billing tier, e.g. 'free', 'pro', 'enterprise'. */
  tier: string;

  /**
   * Optional custom metadata for targeting rules.
   * Examples: country, device, planVersion, region, etc.
   */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * A flat map of feature flag keys to their resolved boolean values.
 * Keys are flag identifiers (e.g. 'beta-ui', 'dark-mode').
 */
export interface FeatureFlagMap extends Record<string, boolean> {}

/**
 * FeatureRule defines the configuration for a single feature flag.
 * It describes when and for whom a feature should be active.
 */
export interface FeatureRule {
  /**
   * Master kill switch. When false, the feature is disabled for everyone
   * regardless of tier or rollout percentage.
   */
  enabled: boolean;

  /**
   * An optional allowlist of tiers that can access this feature.
   * If omitted, the feature is not restricted by tier.
   * Example: ['pro', 'enterprise']
   */
  allowedTiers?: string[];

  /**
   * An optional number from 0 to 100 representing the percentage of
   * eligible subjects that should have this feature enabled (gradual rollout).
   * If omitted, the feature is rolled out to 100% of eligible subjects.
   */
  rolloutPercentage?: number;
}
