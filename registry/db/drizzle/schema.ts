import { boolean, integer, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * Represents the single latest authoritative state of a feature flag rule.
 * Each row maps one feature key to its current enablement configuration,
 * tier restrictions, and rollout percentage. This table is the source of truth
 * consumed by the SDK's evaluateFlag engine to make real-time flag decisions.
 */
export const featureFlags = pgTable('feature_flags', {
  /**
   * The unique identifier for this feature flag (e.g. "beta-ui", "dark-mode").
   * Acts as the primary key — one row per flag key.
   */
  key: varchar('key').primaryKey(),

  /**
   * Master kill switch. When false, the feature is disabled for all subjects
   * regardless of tier or rollout percentage.
   */
  enabled: boolean('enabled').default(false).notNull(),

  /**
   * Optional list of billing tiers permitted to access this feature.
   * Stored as a JSONB array for efficient querying and type safety.
   * A null value means the feature is not restricted by tier.
   * Examples: ["pro", "enterprise"]
   */
  allowedTiers: jsonb('allowed_tiers').$type<string[]>(),

  /**
   * Optional gradual rollout percentage (0–100).
   * When set, only a deterministic percentage of subjects (hashed by id)
   * will have the feature enabled. Null means 100% rollout to eligible subjects.
   */
  rolloutPercentage: integer('rollout_percentage'),

  /**
   * Tracks when this flag configuration was last modified.
   * Defaults to the current timestamp at insertion time.
   */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Inferred TypeScript types for use in application code
export type FeatureFlagRow = typeof featureFlags.$inferSelect;
export type NewFeatureFlagRow = typeof featureFlags.$inferInsert;
